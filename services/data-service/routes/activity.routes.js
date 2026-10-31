
import express from "express";
import ActivityController from "../controllers/activity.controller.js";
import { authenticate } from "../utils/middelwares/auth.middleware.js";

const router = express.Router();

// Public route: fetch published activities for Explore.
router.get("/", ActivityController.getActivities);

// All activity creation requests require login.
router.post("/", authenticate, ActivityController.createActivity);
export default router;
