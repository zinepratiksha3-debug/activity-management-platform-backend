
import express from "express";
import OrganizationCtrl from "../controllers/organization.controller.js";
import {
  authenticate,
  authorize,
} from "../utils/middelwares/auth.middleware.js";

const router = express.Router();

// All organization management routes require authentication and admin access.
router.use(authenticate, authorize("admin"));

// Get organization statistics.
router.get("/stats", OrganizationCtrl.handleGetOrganizationStats);

// Get all organizations with filters and pagination.
router.get("/", OrganizationCtrl.handleGetAllOrganizations);

// Get one organization by ID.
router.get("/:id", OrganizationCtrl.handleGetOrganizationById);

export default router;
