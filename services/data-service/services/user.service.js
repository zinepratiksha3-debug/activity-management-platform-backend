// companion_server/services/data-service/services/user.service.js

import { encryptPassword } from "../utils/helpers/encryption.js";
import User from "../model/user.model.js";
import { headObject } from "./r2.service.js";
import { invalidateUserCache } from "./user-cache.service.js";
import { addMediaJob } from "../queues/media.queue.js";
// Escape special characters so user input cannot be abused as a regex
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
class UserService {

  /* =====================================================
     VALIDATE MEDIA
  ===================================================== */
 static async validateMedia(media) {
  if (!media) return null;

  if (!media.key || typeof media.key !== "string") {
    throw new Error("Media key is required.");
  }

  const head = await headObject(media.key);

  if (!head) {
    throw new Error("Uploaded media was not found in storage.");
  }

  const mimeType = String(
    head.ContentType || media.mimeType || ""
  ).toLowerCase();

  if (!mimeType) {
    throw new Error("Media MIME type is required.");
  }

  let type;

  if (mimeType.startsWith("image/")) {
    type = "image";
  } else if (mimeType.startsWith("video/")) {
    type = "video";
  } else if (mimeType.startsWith("audio/")) {
    type = "audio";
  } else if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("application/")
  ) {
    type = "document";
  } else {
    throw new Error("Unsupported media type.");
  }

  return {
    type,
    status: "queued",
    originalKey: media.key,
    mimeType,
    originalSize: Number(head.ContentLength || 0),
    processing: {
      attempts: 0,
      error: {
        code: null,
        message: null,
      },
    },
  };
}

  /* =====================================================
     CREATE USER
  ===================================================== */
  static async createUser(user) {
    try {
      if (!user?.email || !user?.password) {
        throw new Error("Email and password are required");
      }

      const { role, status, emailVerificationStatus, emailVerifiedAt,
  mobileVerificationStatus, mobileVerifiedAt, deletedAt, ...payload } = user;

      if (payload.password) {
        payload.password = await encryptPassword(payload.password);
      }

      // Media validate करा
      for (const field of ["profilePhoto"]) {
        if (payload[field]) {
          payload[field] = await this.validateMedia(payload[field]);
        }
      }

      const result = await User.create(payload);

      // Media queue मध्ये add करा
      for (const field of ["profilePhoto"]) {
        const media = result[field];
        if (!media?.originalKey) continue;

        try {
          await addMediaJob({
            mediaId: media._id.toString(),
            entityType: "user",
            entityId: result._id.toString(),
            originalKey: media.originalKey,
            type: media.mimeType?.startsWith("video") ? "video" : "image",
          });
        } catch (error) {
          console.error("Failed to enqueue media:", error);

          await User.updateOne(
            { _id: result._id, [`${field}._id`]: media._id },
            {
              $set: {
                [`${field}.status`]: "failed",
                [`${field}.processing.error`]: {
                  code: "QUEUE_ERROR",
                  message: error.message,
                },
                [`${field}.processing.failedAt`]: new Date(),
              },
            }
          );
        }
      }

      // await invalidateUserCache(result._id.toString());
// Never return the password hash in the signup response
const { password: _pw, ...safeUser } = result.toObject();
return safeUser;

   } catch (error) {
  error.message = `Failed to create user: ${error.message}`;
  throw error;
}
  }

  /* =====================================================
     UPDATE USER
  ===================================================== */

  /* =====================================================
     UPDATE USER
  ===================================================== */
  static async updateUser(id, user) {
    try {
      if (!id) {
        throw new Error("User ID is required");
      }

      // Allow only safe profile fields
      const allowedFields = [
        "name",
        "bio",
        "address",
        "profilePhoto",
        "verificationPhoto",
      ];

      const payload = {};

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(user, field)) {
          payload[field] = user[field];
        }
      }

      if (Object.keys(payload).length === 0) {
        throw new Error(
          "No valid profile fields provided for update"
        );
      }

      // Validate media only when supplied
      for (const field of ["profilePhoto", "verificationPhoto"]) {
        if (payload[field]) {
          payload[field] = await this.validateMedia(payload[field]);
        }
      }

      const result = await User.findOneAndUpdate(
        { _id: id },
        { $set: payload },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

      if (!result) {
        throw new Error("User not found");
      }

      // Queue processing only for a newly supplied profile photo
      if (payload.profilePhoto && result.profilePhoto?.originalKey) {
        const media = result.profilePhoto;

        await addMediaJob({
          mediaId: media._id.toString(),
          entityType: "user",
          entityId: result._id.toString(),
          originalKey: media.originalKey,
          type: media.mimeType?.startsWith("video")
            ? "video"
            : "image",
        });
      }

      await invalidateUserCache(id);

      return result;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }





  /* =====================================================
     UPDATE USER STATUS - ADMIN ONLY
  ===================================================== */
  static async updateUserStatus(id, status) {
    try {
      if (!id) {
        throw new Error("User ID is required");
      }

      const allowedStatuses = ["active", "inactive"];

      if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid user status");
      }

      const result = await User.findOneAndUpdate(
        {
          _id: id,
          status: { $ne: "deleted" },
        },
        {
          $set: { status },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

      if (!result) {
        throw new Error("User not found or already deleted");
      }

      await invalidateUserCache(id);

      return result;
    } catch (error) {
      throw error;
    }
  }


  /* =====================================================
     SOFT DELETE USER
  ===================================================== */
  static async softDeleteUser(id) {
    try {
      if (!id) throw new Error("User ID is required");

      const result = await User.findOneAndUpdate(
        { _id: id },
        { status: "deleted", deletedAt: new Date() },
        { new: true }
      );

      if (!result) throw new Error("User not found");

      await invalidateUserCache(id);

      return result;
    } catch (error) {
      throw new Error(`Failed to soft delete user: ${error.message}`);
    }
  }

  /* =====================================================
     HARD DELETE USER
  ===================================================== */
  static async hardDeleteUser(id) {
    try {
      if (!id) throw new Error("User ID is required");

      const result = await User.deleteOne({ _id: id });

      if (result.deletedCount === 0) throw new Error("User not found");

      await invalidateUserCache(id);

      return { message: "User deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to hard delete user: ${error.message}`);
    }
  }

  /* =====================================================
     GET ONE USER
  ===================================================== */
  static async getOneUser(id) {
    try {
      if (!id) throw new Error("User ID is required");

      const result = await User.findOne({ _id: id })
        .select("-password")
        .lean();

      if (!result) throw new Error("User not found");

      return result;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /* =====================================================
     GET ALL USERS
  ===================================================== */
  static async getAllUsers(query)
  {
  try
  {
    const filters = { status: { $ne: "deleted" } };

    const allowedRoles = ["user", "admin", "moderator"];
    const allowedStatuses = ["active", "inactive"];

    if (query?.role && !allowedRoles.includes(query.role)) {
      throw new Error("Invalid role filter");
    }

    if (query?.status) {
      const statuses = Array.isArray(query.status)
        ? query.status
        : [query.status];

      const validStatuses = statuses.every((status) =>
        allowedStatuses.includes(status)
      );

      if (!validStatuses) {
        throw new Error("Invalid status filter");
      }

      filters.status = { $in: statuses };
    }

    if (query?.role) {
      filters.role = query.role;
    }

    if (query?.email) {
      filters.email = new RegExp(escapeRegex(query.email), "i");
    }

   const users = await User.aggregate([
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

return users;

    return users;
  } catch (error) {
    throw error;
  }
}
}

export default UserService;
