const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware do weryfikacji JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Brak tokena autoryzacji' 
      });
    }

    try {
      // Weryfikacja tokena
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Znajdź użytkownika i sprawdź czy nadal istnieje
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Użytkownik nie istnieje' 
        });
      }

      // Sprawdź czy użytkownik jest zweryfikowany
      if (!user.isVerified) {
        return res.status(401).json({ 
          success: false, 
          message: 'Konto nie zostało zweryfikowane' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Nieprawidłowy token' 
      });
    }
  } catch (error) {
    console.error('Błąd autentykacji:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera podczas autentykacji' 
    });
  }
};

// Middleware do weryfikacji OTP (opcjonalne - dla dodatkowej ochrony)
const otpRequired = async (req, res, next) => {
  try {
    const otpToken = req.headers['x-otp-token'];
    
    if (!otpToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Wymagane potwierdzenie OTP' 
      });
    }

    // Tutaj możesz dodać logikę weryfikacji OTP tokena
    // Na razie przepuszczamy - możesz rozbudować według potrzeb
    
    next();
  } catch (error) {
    console.error('Błąd weryfikacji OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Błąd podczas weryfikacji OTP' 
    });
  }
};

module.exports = { protect, otpRequired };