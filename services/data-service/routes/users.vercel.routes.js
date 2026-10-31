
import express from "express";

import UserVercelController from "../controllers/user.vercel.controller.js";

import {
  authenticate,
  authorize,
  selfOrAdmin,
} from "../utils/middelwares/auth.middleware.js";

const router = express.Router();

// PUBLIC ROUTE - Signup
router.post("/", UserVercelController.handleCreateUser);

// All routes below require authentication
router.use(authenticate);

// GET all users - Admin / Moderator
router.get(
  "/",
  authorize("admin", "moderator"),
  UserVercelController.handleGetAllUsers
);

// UPDATE user - Own profile or Admin
router.put(
  "/:id",
  selfOrAdmin,
  UserVercelController.handleUpdateUser
);

// UPDATE status - Admin only
router.patch(
  "/:id/status",
  authorize("admin"),
  UserVercelController.handleUpdateUserStatus
);

// SOFT DELETE - Own profile or Admin
router.delete(
  "/:id",
  selfOrAdmin,
  UserVercelController.handleSoftDeleteUser
);

// HARD DELETE - Admin only
router.delete(
  "/hard/:id",
  authorize("admin"),
  UserVercelController.handleHardDeleteUser
);

// GET single user - Own profile or Admin
router.get(
  "/:id",
  selfOrAdmin,
  UserVercelController.handleGetOneUser
);

export default router;
