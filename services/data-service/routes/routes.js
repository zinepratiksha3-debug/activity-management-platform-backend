import express from "express";
import UserCtrl from "../controllers/user.controller.js";
import {
  authenticate,
  authorize,selfOrAdmin
} from "../utils/middelwares/auth.middleware.js";
const router = express.Router();

// Create user - public signup
router.post("/", UserCtrl.handleCreateUser);

// All routes below require authentication
router.use(authenticate);

// Update user - own profile or admin only
router.put(
  "/:id",
  selfOrAdmin,
  UserCtrl.handleUpdateUser
);

// Update user status - Admin only
router.patch(
  "/:id/status",
  authorize("admin"),
  UserCtrl.handleUpdateUserStatus
);

// Soft delete - logged-in user (ownership check still needed)
router.delete("/:id", selfOrAdmin, UserCtrl.handleSoftDeleteUser);
// Hard delete - admin only
router.delete(
  "/hard/:id",
  authorize("admin"),
  UserCtrl.handleHardDeleteUser
);

router.get(
  "/:id",
  selfOrAdmin,
  UserCtrl.handleGetOneUser
);

// Get all users - admin or moderator
router.get(
  "/",
  authorize("admin", "moderator"),
  UserCtrl.handleGetAllUsers
);

export default router;