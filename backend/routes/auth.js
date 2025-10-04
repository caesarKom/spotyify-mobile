const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, resendOTP, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Protected routes
router.post('/refresh-token', protect, refreshToken);
router.post('/logout', protect, logout);

module.exports = router;