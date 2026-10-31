import express from "express";
import rateLimit from "express-rate-limit";

import { sendOTP, verifyOTP,verifySignupOTP} from "../controllers/auth.controller.js";
import { userLogin, adminLogin, me } from "../controllers/login.controller.js";
import { authenticate } from "../utils/middelwares/auth.middleware.js";

const router = express.Router();

// Helper to build a limiter with a consistent JSON error message
const limiter = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, try again later" },
  });

// Login: 5 attempts per minute per IP
const loginLimiter = limiter(60 * 1000, 5);

// OTP: limit SMS sending (cost) and guessing (security)
const otpSendLimiter = limiter(10 * 60 * 1000, 3);
const otpVerifyLimiter = limiter(10 * 60 * 1000, 5);

// OTP routes
router.post("/send-otp", otpSendLimiter, sendOTP);
router.post("/verify-otp", otpVerifyLimiter, verifyOTP);
router.post(
  "/verify-signup-otp",
  otpVerifyLimiter,
  verifySignupOTP
);
// Password login routes
router.post("/login", loginLimiter, userLogin);
router.post("/admin/login", loginLimiter, adminLogin);

// Current logged-in user
router.get("/me", authenticate, me);

export default router;