import { verifyToken } from "../auth/jwt.js";
import User from "../../model/user.model.js";
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    // Verify JWT token
    const decoded = verifyToken(token);

    // Check user status in database
    const user = await User.findById(decoded.sub)
      .select("_id role status")
      .lean();

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Account is not active",
      });
    }

    // Use latest role from database
    req.user = {
      ...decoded,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication failed:", error.name, error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    console.log("AUTH DEBUG:", {
  role: req.user?.role,
  sub: req.user?.sub,
  allowedRoles,
});
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

export const selfOrAdmin = (req, res, next) => {
  if (req.user?.sub === req.params.id || req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action",
  });
};