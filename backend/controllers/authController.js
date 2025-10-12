const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const OTPGenerator = require('../utils/otpGenerator');

// Generowanie JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Walidacja email
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Walidacja hasła
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Walidacja nazwy użytkownika
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return username && username.length >= 3 && username.length <= 30 && usernameRegex.test(username);
};

// Rejestracja nowego użytkownika
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Walidacja danych wejściowych
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }

    // Walidacja email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Proszę podać poprawny adres email'
      });
    }

    // Walidacja nazwy użytkownika
    if (!validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Nazwa użytkownika musi mieć 3-30 znaków i zawierać tylko litery, cyfry i podkreślenia'
      });
    }

    // Walidacja hasła
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Hasło musi mieć minimum 6 znaków'
      });
    }

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Użytkownik z tym adresem email już istnieje'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: 'Nazwa użytkownika jest już zajęta'
        });
      }
    }

    // Stwórz nowego użytkownika
    const user = await User.create({
      username,
      email,
      password
    });

    // Generuj OTP
    const otpCode = OTPGenerator.generate();
    const otpExpiry = OTPGenerator.getExpiryTime(10); // 10 minut

    // Zapisz OTP w użytkowniku
    user.otp.code = otpCode;
    user.otp.expiresAt = otpExpiry;
    await user.save();

    // Wyślij email z OTP
    await emailService.sendOTP(email, otpCode, username);

    // Generuj token dla zalogowanego użytkownika (ale niezweryfikowanego)
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Konto utworzone pomyślnie. Sprawdź email aby zweryfikować konto.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.log("Error register user", error)
  }
};

// Logowanie użytkownika
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Walidacja danych wejściowych
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane'
      });
    }

    // Znajdź użytkownika po emailu
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    // Sprawdź hasło
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło'
      });
    }

    // Sprawdź czy konto jest zweryfikowane
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Konto nie zostało zweryfikowane. Sprawdź email i użyj kodu OTP.',
        needsVerification: true
      });
    }

    // Generuj token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Zalogowano pomyślnie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        //profile: user.profile
      }
    });
  } catch (error) {
    console.log("Error to login", error)
  }
};

// Weryfikacja OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Walidacja danych wejściowych
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email i kod OTP są wymagane'
      });
    }

    // Znajdź użytkownika
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Sprawdź czy OTP jest ważny
    if (!user.isOTPValid()) {
      return res.status(400).json({
        success: false,
        message: 'Kod OTP jest nieprawidłowy lub wygasł'
      });
    }

    // Sprawdź czy OTP się zgadza
    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy kod OTP'
      });
    }

    // Zaktualizuj użytkownika
    user.isVerified = true;
    user.clearOTP();
    await user.save();

    // Wyślij email powitalny
    await emailService.sendWelcomeEmail(user.email, user.username);

    // Generuj token dla zweryfikowanego użytkownika
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Konto zweryfikowane pomyślnie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        profile: user.profile
      }
    });
  } catch (error) {
    console.log("Error verify otp", error)
  }
};

// Ponowne wysłanie OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email jest wymagany'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Sprawdź czy użytkownik jest już zweryfikowany
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Konto zostało już zweryfikowane'
      });
    }

    // Generuj nowy OTP
    const otpCode = OTPGenerator.generate();
    const otpExpiry = OTPGenerator.getExpiryTime(10);

    // Zaktualizuj OTP w użytkowniku
    user.otp.code = otpCode;
    user.otp.expiresAt = otpExpiry;
    await user.save();

    // Wyślij email z nowym OTP
    await emailService.sendOTP(email, otpCode, user.username);

    res.status(200).json({
      success: true,
      message: 'Nowy kod OTP został wysłany na Twój email'
    });
  } catch (error) {
    console.log("Error resend otp", error)
  }
};

// Odświeżanie tokena
const refreshToken = async (req, res) => {
  console.log("Start refresh token api")
  try {
    const user = req.user;
   
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        //profile: user.profile
      }
    });
  } catch (error) {
    console.log("Error refresh token", error)
  }
};

// Wylogowanie (opcjonalne - w React Native zazwyczaj po prostu usuwamy token z pamięci)
const logout = async (req, res) => {
  try {
    // W przyszłości można dodać czarną listę tokenów
    res.status(200).json({
      success: true,
      message: 'Wylogowano pomyślnie'
    });
  } catch (error) {
    console.log("Error log out", error)
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  refreshToken,
  logout
};