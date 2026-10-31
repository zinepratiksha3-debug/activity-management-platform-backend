
import mongoose from "mongoose";
import { OrganizationModel } from "../model/organization.model.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class OrganizationService {
  // Get organizations with validated filters and pagination.
  static async getAllOrganizations(query = {}) {
    const filters = {
      status: { $ne: "deleted" },
    };

    const allowedStatuses = [
      "draft",
      "pending",
      "active",
      "suspended",
      "rejected",
    ];

    const allowedVerificationStatuses = [
      "unverified",
      "pending",
      "verified",
      "rejected",
    ];

    if (query.status) {
      if (!allowedStatuses.includes(query.status)) {
        throw new Error("Invalid organization status filter");
      }

      filters.status = query.status;
    }

    if (query.verificationStatus) {
      if (
        !allowedVerificationStatuses.includes(
          query.verificationStatus
        )
      ) {
        throw new Error("Invalid verification status filter");
      }

      filters.verificationStatus = query.verificationStatus;
    }

    if (query.search !== undefined) {
      if (typeof query.search !== "string") {
        throw new Error("Invalid search query");
      }

      const search = query.search.trim();

      if (search.length > 100) {
        throw new Error("Search query is too long");
      }

      if (search) {
        filters.name = {
          $regex: escapeRegex(search),
          $options: "i",
        };
      }
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new Error("Invalid pagination values");
    }

    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      OrganizationModel.find(filters)
        .select(
          "name slug organizationType tagline email phone website owner status verificationStatus verifiedAt createdAt updatedAt"
        )
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      OrganizationModel.countDocuments(filters),
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Calculate statistics using real organization records.
  static async getOrganizationStats() {
    const [total, verified, pending] = await Promise.all([
      OrganizationModel.countDocuments({
        status: { $ne: "deleted" },
      }),

      OrganizationModel.countDocuments({
        status: { $ne: "deleted" },
        verificationStatus: "verified",
      }),

      OrganizationModel.countDocuments({
        status: { $ne: "deleted" },
        verificationStatus: "pending",
      }),
    ]);

    return { total, verified, pending };
  }

  // Get one organization by its MongoDB ID.
  static async getOrganizationById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid organization ID");
    }

    const organization = await OrganizationModel.findOne({
      _id: id,
      status: { $ne: "deleted" },
    })
      .populate("owner", "name email")
      .lean();

    if (!organization) {
      throw new Error("Organization not found");
    }

    return organization;
  }
}

export default OrganizationService;
