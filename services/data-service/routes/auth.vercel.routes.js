import express from "express";
import {
  userLogin,
  adminLogin,
  me,
} from "../controllers/login.controller.js";
import { authenticate } from "../utils/middelwares/auth.middleware.js";

const router = express.Router();

// User login
router.post("/login", userLogin);

// Admin login
router.post("/admin/login", adminLogin);

// Logged-in user details
router.get("/me", authenticate, me);

export default router;