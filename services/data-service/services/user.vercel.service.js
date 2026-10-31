
import User from "../model/user.model.js";
import { encryptPassword } from "../utils/helpers/encryption.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class UserVercelService {
  // CREATE USER
  static async createUser(user) {
    if (!user?.email || !user?.password) {
      throw new Error("Email and password are required");
    }

    if (user.profilePhoto || user.verificationPhoto) {
      throw new Error("Media upload is not available in this deployment");
    }

    const {
      role,
      status,
      emailVerificationStatus,
      emailVerifiedAt,
      mobileVerificationStatus,
      mobileVerifiedAt,
      deletedAt,
      ...payload
    } = user;

    payload.email = String(payload.email).toLowerCase().trim();
    payload.password = await encryptPassword(payload.password);

    const result = await User.create(payload);
    const { password: _pw, ...safeUser } = result.toObject();

    return safeUser;
  }

  // UPDATE USER PROFILE
  static async updateUser(id, user) {
    if (!id) throw new Error("User ID is required");

    if (user.profilePhoto || user.verificationPhoto) {
      throw new Error("Media upload is not available in this deployment");
    }

    const allowedFields = ["name", "bio", "address"];
    const payload = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(user, field)) {
        payload[field] = user[field];
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new Error("No valid profile fields provided for update");
    }

    const result = await User.findOneAndUpdate(
      { _id: id, status: { $ne: "deleted" } },
      { $set: payload },
      { new: true, runValidators: true }
    ).select("-password");

    if (!result) throw new Error("User not found");

    return result;
  }

  // UPDATE USER STATUS - ADMIN
  static async updateUserStatus(id, status) {
    if (!id) throw new Error("User ID is required");

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Invalid user status");
    }

    const result = await User.findOneAndUpdate(
      { _id: id, status: { $ne: "deleted" } },
      { $set: { status } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!result) throw new Error("User not found or already deleted");

    return result;
  }

  // SOFT DELETE USER
  static async softDeleteUser(id) {
    if (!id) throw new Error("User ID is required");

    const result = await User.findOneAndUpdate(
      { _id: id, status: { $ne: "deleted" } },
      { $set: { status: "deleted", deletedAt: new Date() } },
      { new: true }
    ).select("-password");

    if (!result) throw new Error("User not found");

    return result;
  }

  // HARD DELETE USER
  static async hardDeleteUser(id) {
    if (!id) throw new Error("User ID is required");

    const result = await User.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new Error("User not found");
    }

    return { message: "User deleted successfully" };
  }

  // GET ONE USER
  static async getOneUser(id) {
    if (!id) throw new Error("User ID is required");

    const result = await User.findOne({
      _id: id,
      status: { $ne: "deleted" },
    })
      .select("-password")
      .lean();

    if (!result) throw new Error("User not found");

    return result;
  }

  // GET ALL USERS
  static async getAllUsers(query = {}) {
    const filters = { status: { $ne: "deleted" } };

    const allowedRoles = ["user", "admin", "moderator"];
    const allowedStatuses = ["active", "inactive"];

    if (query.role && !allowedRoles.includes(query.role)) {
      throw new Error("Invalid role filter");
    }

    if (query.status) {
      const statuses = Array.isArray(query.status)
        ? query.status
        : [query.status];

      if (!statuses.every((status) => allowedStatuses.includes(status))) {
        throw new Error("Invalid status filter");
      }

      filters.status = { $in: statuses };
    }

    if (query.role) {
      filters.role = query.role;
    }

    if (query.email) {
      filters.email = new RegExp(escapeRegex(query.email), "i");
    }

    return User.aggregate([
      { $match: filters },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          mobile: 1,
          role: 1,
          status: 1,
          emailVerificationStatus: 1,
          mobileVerificationStatus: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
  }
}

export default UserVercelService;
