
import express from "express";
import StatsController from "../controllers/stats.controller.js";
import {
  authenticate,
  authorize,
} from "../utils/middelwares/auth.middleware.js";

const router = express.Router();

// Only authenticated admins can access dashboard statistics
router.get(
  "/",
  authenticate,
  authorize("admin"),
  StatsController.getDashboardStats
);

export default router;
