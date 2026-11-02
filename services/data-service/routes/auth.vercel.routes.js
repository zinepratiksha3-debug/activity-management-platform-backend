
import express from "express";
import rateLimit from "express-rate-limit";

import {
  sendOTP,
  verifyOTP,
  verifySignupOTP,
} from "../controllers/auth.controller.js";

import {
  userLogin,
  adminLogin,
  me,
} from "../controllers/login.controller.js";

import { authenticate } from "../utils/middelwares/auth.middleware.js";

const router = express.Router();

const limiter = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many attempts, try again later",
    },
  });

const loginLimiter = limiter(60 * 1000, 5);
const otpSendLimiter = limiter(10 * 60 * 1000, 3);
const otpVerifyLimiter = limiter(10 * 60 * 1000, 5);

// OTP routes
router.post("/send-otp", otpSendLimiter, sendOTP);
router.post("/verify-otp", otpVerifyLimiter, verifyOTP);
router.post("/verify-signup-otp", otpVerifyLimiter, verifySignupOTP);

// Login routes
router.post("/login", loginLimiter, userLogin);
router.post("/admin/login", loginLimiter, adminLogin);

// Logged-in user
router.get("/me", authenticate, me);

export default router;
