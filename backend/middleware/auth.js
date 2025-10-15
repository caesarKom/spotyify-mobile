import jwt from "jsonwebtoken"
import User from "../models/User.js"

// JWT verification middleware
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No authorization token",
    })
  }

  const token = authHeader.split(" ")[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User does not exist",
      })
    }
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "The account has not been verified",
      })
    }

    req.user = {userId: decoded.userId, name: decoded.username}
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }
}

// OTP verification middleware (optional - for additional protection)
export const otpRequired = async (req, res, next) => {
  try {
    const otpToken = req.headers["x-otp-token"]

    if (!otpToken) {
      return res.status(401).json({
        success: false,
        message: "OTP confirmation required",
      })
    }

    // Tutaj możesz dodać logikę weryfikacji OTP tokena
    // Na razie przepuszczamy - możesz rozbudować według potrzeb

    next()
  } catch (error) {
    console.error("OTP verification error:", error)
    res.status(500).json({
      success: false,
      message: "Error while verifying OTP",
    })
  }
}

