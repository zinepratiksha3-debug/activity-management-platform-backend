import  mongoose  from "mongoose";

/* =========================================================
   CONSTANTS
========================================================= */

const AUTH_METHODS = Object.freeze([
  "password",
  "google",
  "otp",
]);

const SESSION_STATUS = Object.freeze([
  "active",
  "revoked",
  "expired",
]);

const DEVICE_TYPES = Object.freeze([
  "web",
  "android",
  "ios",
  "desktop",
  "other",
]);

/* =========================================================
   USER SESSION SCHEMA
========================================================= */

const userSessionSchema = new mongoose.Schema(
  {
    /* =====================================================
       USER
    ===================================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    /* =====================================================
       SESSION
    ===================================================== */

    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      index: true,
      trim: true,
    },

    /* =====================================================
       AUTHENTICATION METHOD
    ===================================================== */

    authMethod: {
      type: String,
      enum: {
        values: AUTH_METHODS,
        message: "Invalid authentication method",
      },
      required: [true, "Authentication method is required"],
      trim: true,
    },

      /* =====================================================
       TOKEN HASH
    ===================================================== */

    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
      select: false,
      previousRefreshTokenHash: { type: String, select: false },
rotatedAt: { type: Date },
    },

    /* =====================================================
       DEVICE
    ===================================================== */

    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      trim: true,
      index: true,
    },

    deviceType: {
      type: String,
      enum: {
        values: DEVICE_TYPES,
        message: "Invalid device type",
      },
      default: "web",
    },

    deviceName: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Device name cannot exceed 100 characters",
      ],
    },

    /* =====================================================
       BROWSER / OPERATING SYSTEM
    ===================================================== */

    browser: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Browser cannot exceed 100 characters",
      ],
    },

    operatingSystem: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Operating system cannot exceed 100 characters",
      ],
    },

    /* =====================================================
       NETWORK INFORMATION
    ===================================================== */

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "User agent cannot exceed 1000 characters",
      ],
    },

    /* =====================================================
       SESSION STATUS
    ===================================================== */

    status: {
      type: String,
      enum: {
        values: SESSION_STATUS,
        message: "Invalid session status",
      },
      default: "active",
      index: true,
    },

    /* =====================================================
       SESSION DATES
    ===================================================== */

    loginAt: {
      type: Date,
      default: Date.now,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    logoutAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: [true, "Session expiry date is required"],
      index: true,
    },

    /* =====================================================
       REFRESH TOKEN
    ===================================================== */

    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
    },
  },

  {
    timestamps: true,
  }
);

/* =========================================================
   INDEXES
========================================================= */

/*
 * Find all sessions of a user
 */
userSessionSchema.index({
  user: 1,
  status: 1,
});

/*
 * Find sessions of a particular device
 */
userSessionSchema.index({
  user: 1,
  deviceId: 1,
  status: 1,
});

/*
 * Find recently active sessions
 */
userSessionSchema.index({
  status: 1,
  lastActiveAt: -1,
});

/*
 * Automatically remove expired sessions
 */
userSessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

/* =========================================================
   INSTANCE METHODS
========================================================= */

/*
 * Check whether session is active
 */
userSessionSchema.methods.isActive = function () {
  return (
    this.status === "active" &&
    this.expiresAt > new Date()
  );
};

/*
 * Check whether user is online
 */
userSessionSchema.methods.isOnline = function (
  timeoutMinutes = 5
) {
  if (!this.isActive()) {
    return false;
  }

  const lastActiveLimit =
    Date.now() - timeoutMinutes * 60 * 1000;

  return (
    this.lastActiveAt.getTime() >= lastActiveLimit
  );
};

/*
 * Update last activity
 */
userSessionSchema.methods.updateActivity = async function () {
  this.lastActiveAt = new Date();

  return this.save();
};

/*
 * Revoke current session
 */
userSessionSchema.methods.revoke = async function () {
  this.status = "revoked";
  this.logoutAt = new Date();

  return this.save();
};

/* =========================================================
   STATIC METHODS
========================================================= */

/*
 * Find active session
 */
userSessionSchema.statics.findActiveSession = function (
  sessionId
) {
  return this.findOne({
    sessionId,
    status: "active",
    expiresAt: {
      $gt: new Date(),
    },
  });
};

/*
 * Find all active sessions of user
 */
userSessionSchema.statics.findUserSessions = function (
  userId
) {
  return this.find({
    user: userId,
    status: "active",
    expiresAt: {
      $gt: new Date(),
    },
  }).sort({
    lastActiveAt: -1,
  });
};

/*
 * Find online sessions of user
 */
userSessionSchema.statics.findOnlineSessions = function (
  userId,
  timeoutMinutes = 5
) {
  const lastActiveLimit = new Date(
    Date.now() - timeoutMinutes * 60 * 1000
  );

  return this.find({
    user: userId,
    status: "active",
    expiresAt: {
      $gt: new Date(),
    },
    lastActiveAt: {
      $gte: lastActiveLimit,
    },
  }).sort({
    lastActiveAt: -1,
  });
};

/*
 * Revoke device session
 */
userSessionSchema.statics.revokeDeviceSession = function (
  userId,
  deviceId
) {
  return this.updateMany(
    {
      user: userId,
      deviceId,
      status: "active",
    },
    {
      $set: {
        status: "revoked",
        logoutAt: new Date(),
      },
    }
  );
};

/*
 * Revoke all other sessions
 */
userSessionSchema.statics.revokeOtherSessions = function (
  userId,
  currentSessionId
) {
  return this.updateMany(
    {
      user: userId,
      sessionId: {
        $ne: currentSessionId,
      },
      status: "active",
    },
    {
      $set: {
        status: "revoked",
        logoutAt: new Date(),
      },
    }
  );
};

/*
 * Revoke all user sessions
 */
userSessionSchema.statics.revokeAllSessions = function (
  userId
) {
  return this.updateMany(
    {
      user: userId,
      status: "active",
    },
    {
      $set: {
        status: "revoked",
        logoutAt: new Date(),
      },
    }
  );
};

/* =========================================================
   MODEL
========================================================= */

export const UserSessionModel = mongoose.model(
  "UserSession",
  userSessionSchema
);

/* =========================================================
   EXPORT
========================================================= */

// module.exports = {
//   UserSessionModel,
//   AUTH_METHODS,
//   SESSION_STATUS,
//   DEVICE_TYPES,
// };