import bcrypt from "bcryptjs";
import User from "../model/user.model.js";
import { generateToken } from "../utils/auth/jwt.js";
import { AuthError } from "../modules/auth/auth.errors.js";

// Use one generic message so attackers cannot tell which field was wrong
const INVALID = "Invalid email or password";

// Shared login logic for both user and admin login
async function loginWith({ email, password, allowedRoles }) {
  if (!email || !password) {
    throw new AuthError("Email and password are required", 400);
  }

  // Password is hidden by default in the schema, so select it explicitly
  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  }).select("+password");

  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw new AuthError(INVALID, 401);

  // Block inactive or deleted accounts
  if (user.status !== "active") throw new AuthError("Account is not active", 403);
if (!user || user.status !== "active") {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}
  // Block roles that are not allowed on this login endpoint
  if (!allowedRoles.includes(user.role)) throw new AuthError("Access denied", 403);

  // Token payload: user id (sub) and role
  const token = generateToken({ sub: user._id.toString(), role: user.role });

  // Never return the password hash to the client
  const { password: _pw, ...safeUser } = user.toObject();
  return { token, user: safeUser };
}

// Creates a login handler for the given roles
const handle = (allowedRoles) => async (req, res) => {
  try {
    const data = await loginWith({ ...req.body, allowedRoles });
    return res.status(200).json({ success: true, data });
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, message: e.message });
  }
};

// Normal login: any active account
export const userLogin = handle(["user", "moderator", "admin"]);

// Admin panel login: only admin and moderator
export const adminLogin = handle(["admin", "moderator"]);

// Return the currently logged-in user (needs the authenticate middleware)
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select("-password").lean();
    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};