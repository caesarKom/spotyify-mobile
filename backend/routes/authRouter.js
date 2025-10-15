import express from "express"

import {
  register,
  loginUser,
  verifyOTP,
  resendOTP,
  refreshToken,
  logout,
} from "../controllers/authController.js"
import {protect} from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.post("/register", register)
router.post("/login", loginUser)
router.post("/verify-otp", verifyOTP)
router.post("/resend-otp", resendOTP)

router.post("/refresh-token", refreshToken)

// Protected routes
router.post("/logout", protect, logout)

export default router
