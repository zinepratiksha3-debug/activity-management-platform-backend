import axios from "axios";
import { redis } from "../config/redis.js";
import User from "../model/user.model.js";
import { generateToken } from "../utils/auth/jwt.js";

// OTP Generate
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// =========================
// SEND OTP
// =========================
export const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile)
      {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const cleanMobile = String(mobile)
      .replace(/\D/g, "")
      .replace(/^91/, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Indian mobile number",
      });
    }

   
    // TEMPORARY OTP MODE - DEVELOPMENT ONLY
// TEMPORARY OTP MODE - LOCAL + VERCEL PREVIEW
// TEST OTP MODE - LOCAL, PREVIEW, AND ALLOWED TEST MOBILE
const isTestEnvironment =
  process.env.NODE_ENV !== "production" ||
  process.env.VERCEL_ENV === "preview";

const isAllowedTestMobile =
  process.env.OTP_TEST_MODE === "true" &&
  process.env.OTP_TEST_MOBILE === cleanMobile;

if (isTestEnvironment || isAllowedTestMobile) {
  await redis.setex(`otp:${cleanMobile}`, 600, "123456");

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
}

const apiKey = process.env.FAST2SMS_API_KEY;

if (!apiKey) {
  return res.status(500).json({
    success: false,
    message: "OTP service is not configured",
  });
}

const otp = generateOTP();

   
    // Production - Fast2SMS ला पाठवा
    await redis.setex(`otp:${cleanMobile}`, 600, otp);

    const response = await axios.get(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        params: {
          authorization: apiKey,
          route: "q",
          message: `Your OTP is ${otp}. Valid for 10 minutes. Do not share.`,
          numbers: cleanMobile,
          flash: 0,
        },
      }
    );

    if (response.data.return !== true) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("sendOTP error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// =========================
// VERIFY OTP
// =========================
export const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Mobile and OTP are required",
      });
    }

    const cleanMobile = String(mobile)
      .replace(/\D/g, "")
      .replace(/^91/, "");

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "OTP must be 6 digits",
      });
    }

    // Get OTP from Redis
    const storedOTP = await redis.get(`otp:${cleanMobile}`);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "OTP expired. Please request a new one",
      });
    }

    // Check OTP
    if (storedOTP !== String(otp)) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Invalid OTP",
      });
    }

    // OTP is correct, so delete it
    await redis.del(`otp:${cleanMobile}`);

    // Find user
    const user = await User.findOne({
      mobile: cleanMobile,
    }).select("-password");

    // User does not exist
    if (!user) {
      return res.status(404).json({
        success: false,
        verified: true,
        message: "User not found. Please sign up first",
      });
    }

    // Check user status
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        verified: true,
        message: "Your account is not active",
      });
    }

    // Update mobile verification
    if (user.mobileVerificationStatus !== "verified") {
      user.mobileVerificationStatus = "verified";
      user.mobileVerifiedAt = new Date();
      await user.save();
    }

    // Generate JWT
   const token = generateToken({
  sub: user._id.toString(),
  role: user.role,
});

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("verifyOTP error:", error.message);

    return res.status(500).json({
      success: false,
      verified: false,
      message: "Verification failed",
    });
  }
};

// =========================
// VERIFY SIGNUP OTP
// =========================
export const verifySignupOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Mobile and OTP are required",
      });
    }

    const cleanMobile = String(mobile)
      .replace(/\D/g, "")
      .replace(/^91/, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Invalid mobile number",
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "OTP must be 6 digits",
      });
    }

    const storedOTP = await redis.get(`otp:${cleanMobile}`);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "OTP expired. Please request a new one",
      });
    }

    if (storedOTP !== String(otp)) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Invalid OTP",
      });
    }

    await redis.del(`otp:${cleanMobile}`);

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Signup mobile verification successful",
    });
  } catch (error) {
    console.error("verifySignupOTP error:", error.message);

    return res.status(500).json({
      success: false,
      verified: false,
      message: "Signup OTP verification failed",
    });
  }
};
