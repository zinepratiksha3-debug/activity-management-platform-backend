
import mongoose from "mongoose";
import UserVercelService from "../services/user.vercel.service.js";

class UserVercelController {
  // CREATE USER
  static async handleCreateUser(req, res) {
    try {
      const user = req.body;

      if (!user || typeof user !== "object" || Array.isArray(user)) {
        return res.status(400).json({
          success: false,
          message: "Request body must be a valid object",
        });
      }

      if (!user.email || !user.password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const result = await UserVercelService.createUser(user);

      return res.status(201).json({
        data: result,
        message: "User created successfully",
      });
    } catch (error) {
      const statusCode = error.code === 11000
        ? 409
        : error.message.includes("Email and password")
          ? 400
          : error.message.includes("Media upload")
            ? 400
            : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Could not create the user",
        error: error.message,
      });
    }
  }

  // UPDATE USER
  static async handleUpdateUser(req, res) {
    try {
      const { id } = req.params;
      const user = req.body;

      if (!user || typeof user !== "object" || Array.isArray(user)) {
        return res.status(400).json({
          success: false,
          message: "Request body must be a valid object",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const result = await UserVercelService.updateUser(id, user);

      return res.status(200).json({
        data: result,
        message: "User updated successfully",
      });
    } catch (error) {
      const statusCode = error.message.includes("User not found")
        ? 404
        : error.message.includes("No valid profile fields") ||
          error.message.includes("Media upload")
          ? 400
          : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Could not update the user",
        error: error.message,
      });
    }
  }

  // UPDATE USER STATUS - ADMIN
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

      const result = await UserVercelService.updateUserStatus(id, status);

      return res.status(200).json({
        success: true,
        data: result,
        message: `User ${status} successfully`,
      });
    } catch (error) {
      const statusCode = error.message.includes("User not found") ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Could not update user status",
        error: error.message,
      });
    }
  }

  // SOFT DELETE USER
  static async handleSoftDeleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const result = await UserVercelService.softDeleteUser(id);

      return res.status(200).json({
        data: result,
        message: "User soft deleted successfully",
      });
    } catch (error) {
      const statusCode = error.message.includes("User not found") ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Could not soft delete the user",
        error: error.message,
      });
    }
  }

  // HARD DELETE USER
  static async handleHardDeleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const result = await UserVercelService.hardDeleteUser(id);

      return res.status(200).json({
        data: result,
        message: "User hard deleted successfully",
      });
    } catch (error) {
      const statusCode = error.message.includes("User not found") ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Could not hard delete the user",
        error: error.message,
      });
    }
  }

  // GET ONE USER
  static async handleGetOneUser(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const result = await UserVercelService.getOneUser(id);

      return res.status(200).json({
        data: result,
        message: "User fetched successfully",
      });
    } catch (error) {
      const statusCode = error.message.includes("User not found") ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        message: "User not available",
        error: error.message,
      });
    }
  }

  // GET ALL USERS
  static async handleGetAllUsers(req, res) {
    try {
      const result = await UserVercelService.getAllUsers(req.query);

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

export default UserVercelController;
