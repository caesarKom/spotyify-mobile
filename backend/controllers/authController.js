import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors/index.js"
import { StatusCodes } from "http-status-codes"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import EmailServices from "../utils/emailService.js"
import OTPGenerators from "../utils/otpGenerator.js"

const OTPGenerator = new OTPGenerators()
const EmailService = new EmailServices()

const generateRefreshTokens = async (
  token,
  refresh_secret,
  refresh_expiry,
  access_secret,
  access_expiry
) => {
  try {
    const payload = jwt.verify(token, refresh_secret)
    const user = await User.findById(payload.userId)
    if (!user) {
      throw new NotFoundError("User not found")
    }
    const access_token = jwt.sign({ userId: payload.userId }, access_secret, {
      expiresIn: access_expiry,
    })
    const newRefreshToken = jwt.sign(
      { userId: payload.userId },
      refresh_secret,
      { expiresIn: refresh_expiry }
    )

    return { access_token, newRefreshToken }
  } catch (error) {
    console.error(error)
    throw new UnauthenticatedError("Invalid Token")
  }
}

export const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  return (
    username &&
    username.length >= 3 &&
    username.length <= 30 &&
    usernameRegex.test(username)
  )
}

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      })
    }
    if (!validateUsername(username)) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-30 characters long and contain only letters, numbers, and underscores.",
      })
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      })
    }
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "A user with this email address already exists",
        })
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: "The username is already taken",
        })
      }
    }

    const user = await User.create({
      username,
      email,
      password,
    })

    const otpCode = OTPGenerator.generate()
    const otpExpiry = OTPGenerator.getExpiryTime(30) // 30 minutes

    user.otp.code = otpCode
    user.otp.expiresAt = otpExpiry
    await user.save()

    await EmailService.sendOTP(email, otpCode, username)

    res.status(201).json({
      success: true,
      message:
        "Account created successfully. Check your email to verify your account.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.log("Error register user", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      })
    }

    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      })
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message:
          "Your account has not been verified. Please check your email and use the OTP code.",
        needsVerification: true,
      })
    }

    const access_token = user.createAccessToken()
    const refresh_token = user.createRefreshToken()

    res.status(200).json({
      success: true,
      message: "You have logged in successfully",
      tokens: { access_token, refresh_token },
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        profile: user.profile,
      },
    })
  } catch (error) {
    console.log("Error to login", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP code are required",
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    if (!user.isOTPValid()) {
      return res.status(400).json({
        success: false,
        message: "The OTP code is invalid or expired",
      })
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code",
      })
    }

    user.isVerified = true
    user.clearOTP()
    await user.save()

    await EmailService.sendWelcomeEmail(user.email, user.username)

    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      message: "Account verified successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        profile: user.profile,
      },
    })
  } catch (error) {
    console.log("Error verify otp", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "The account has already been verified",
      })
    }

    const otpCode = OTPGenerator.generate()
    const otpExpiry = OTPGenerator.getExpiryTime(10)

    user.otp.code = otpCode
    user.otp.expiresAt = otpExpiry
    await user.save()

    await EmailService.sendOTP(email, otpCode, user.username)

    res.status(200).json({
      success: true,
      message: "A new OTP code has been sent to your email",
    })
  } catch (error) {
    console.log("Error resend otp", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) {
    throw new BadRequestError("Invalid body")
  }
  try {
    let accessToken, newRefreshToken
    ;({ access_token: accessToken, newRefreshToken } =
      await generateRefreshTokens(
        refresh_token,
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_EXPIRY,
        process.env.JWT_SECRET,
        process.env.ACCESS_TOKEN_EXPIRY
      ))
    res
      .status(StatusCodes.OK)
      .json({
        success: true,
        access_token: accessToken,
        refresh_token: newRefreshToken,
      })
  } catch (error) {
    console.log("Error refresh token", error)
    throw new UnauthenticatedError("Invalid Token")
  }
}

export const logout = async (req, res) => {
  try {
    // A token blacklist may be added in the future
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.log("Error log out", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}
