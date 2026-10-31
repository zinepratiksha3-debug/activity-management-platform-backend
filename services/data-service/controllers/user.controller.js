



// companion_server/services/data-service/controllers/user.controller.js

import mongoose from "mongoose";
import UserService from "../services/user.service.js";

class UserCtrl {
  // Create User
  static async handleCreateUser(req, res) {
    try {
      const user = req.body;
if (!user || typeof user !== "object" || Array.isArray(user)) {
  return res.status(400).json({
    success: false,
    message: "Request body must be a valid object",
  });
}
      if (!user?.email || !user?.password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const result = await UserService.createUser(user);
      return res.status(201).json({
        data: result,
        message: "User created successfully",
      });
    }
    catch (error) {
  const statusCode =
    error.code === 11000
      ? 409
      : error.message.includes("Email and password are required")
        ? 400
        : 500;

  return res.status(statusCode).json({
    success: false,
    message: "Could not create the user",
    error: error.message,
  });
}
}

  // Update User
  static async handleUpdateUser(req, res) {
    try {
      const { id } = req?.params;
      const user = req.body;
      if (!user || typeof user !== "object" || Array.isArray(user)) {
  return res.status(400).json({
    success: false,
    message: "Request body must be a valid object",
  });
}

      if (!id) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid user ID",
  });
}

      const result = await UserService.updateUser(id, user);
      return res.status(200).json({
        data: result,
        message: "User updated successfully",
      });
   } catch (error) {
  const statusCode = error.message.includes("User not found")
    ? 404
    : error.message.includes("No valid profile fields provided")
      ? 400
      : 500;

  return res.status(statusCode).json({
    success: false,
    message: "Could not update the user",
    error: error.message,
  });
}
  }

  // Update User Status - Admin Only
  static async handleUpdateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be active or inactive",
        });
      }

      const result = await UserService.updateUserStatus(id, status);

      return res.status(200).json({
        success: true,
        data: result,
        message: `User ${status} successfully`,
      });
    } catch (error) {
      const statusCode = error.message.includes("User not found")
        ? 404
        : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Could not update user status",
        error: error.message,
      });
    }
  }

  // Soft Delete User
static async handleSoftDeleteUser(req, res) {
    try {
      const { id } = req?.params;

      if (!id) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid user ID",
  });
}
      const result = await UserService.softDeleteUser(id);
      return res.status(200).json({
        data: result,
        message: "User soft deleted successfully",
      });
    } catch (error) {
  const statusCode = error.message.includes("User not found")
    ? 404
    : 500;

  return res.status(statusCode).json({
    success: false,
    message: "Could not soft delete the user",
    error: error.message,
  });
}
  }

  // Hard Delete User
  static async handleHardDeleteUser(req, res) {
    try {
      const { id } = req?.params;

      if (!id) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid user ID",
  });
}

      const result = await UserService.hardDeleteUser(id);
      return res.status(200).json({
        data: result,
        message: "User hard deleted successfully",
      });
   } catch (error) {
  const statusCode = error.message.includes("User not found")
    ? 404
    : 500;

  return res.status(statusCode).json({
    success: false,
    message: "Could not hard delete the user",
    error: error.message,
  });
}
  }

  // Get One User
  static async handleGetOneUser(req, res) {
    try {
      const { id } = req?.params;

      if (!id) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      const result = await UserService.getOneUser(id);
      return res.status(200).json({
        data: result,
        message: "User fetched successfully",
      });
   } catch (error) {
  const statusCode = error.message.includes("User not found")
    ? 404
    : 500;

  return res.status(statusCode).json({
    success: false,
    message: "User not available",
    error: error.message,
  });
}
  }

  // Get All Users with Filters

static async handleGetAllUsers(req, res) {
  try {
    const result = await UserService.getAllUsers(req?.query);

    return res.status(200).json({
      success: true,
      data: result,
      message: "User list fetched successfully",
      count: result.length,
    });
  } catch (error) {
    const isValidationError =
      error.message.includes("Invalid role filter") ||
      error.message.includes("Invalid status filter");

    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: "Could not fetch users",
      error: error.message,
    });
  }
}

}

export default UserCtrl;
