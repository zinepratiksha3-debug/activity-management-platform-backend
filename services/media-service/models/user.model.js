// // companion_server/services/data-service/model/user.model.js





// media-service/models/user.model.js
import mongoose from "mongoose";
import { addressSchema } from "./address.model.js";
import { mediaSchema } from "./media.model.js";

/* =========================================================
   CONSTANTS
========================================================= */

const USER_ROLES = ["user", "admin", "moderator"];
const USER_STATUSES = ["active", "inactive", "deleted"];
const VERIFICATION_STATUSES = ["unverified", "pending", "verified"];

/* =========================================================
   VALIDATORS
========================================================= */

const emailValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  message: "Please provide a valid email address.",
};

const mobileValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^\+?[1-9]\d{9,14}$/.test(value);
  },
  message: "Mobile number must be 10-15 digits.",
};

/* =========================================================
   USER SCHEMA
========================================================= */

const userSchema = new mongoose.Schema(
  {
    /* =====================================================
       PERSONAL INFORMATION
    ===================================== */
    name: {
      first: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
        maxlength: [50, "First name cannot exceed 50 characters"],
      },
      last: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
        maxlength: [50, "Last name cannot exceed 50 characters"],
      },
    },

    /* =====================================================
       CONTACT INFORMATION
    ===================================== */

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: emailValidator,
      index: true,
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      validate: mobileValidator,
      index: true,
    },

    /* =====================================================
       AUTHENTICATION
    ===================================== */
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Password default मध्ये आणू नका
    },

    /* =====================================================
       PROFILE
    ===================================== */


/* =====================================================
   PROFILE
===================================================== */

bio: {
  type: String,
  trim: true,
  maxlength: [500, "Bio cannot exceed 500 characters"],
},

profilePhoto: mediaSchema,

address: addressSchema,

/* =====================================================
   ROLES & PERMISSIONS
===================================================== */

role: {
  type: String,
  enum: {
    values: USER_ROLES,
    message: "Invalid user role",
  },
  default: "user",
  index: true,
},

/* =====================================================
   VERIFICATION
===================================================== */

emailVerificationStatus: {
  type: String,
  enum: {
    values: VERIFICATION_STATUSES,
    message: "Invalid verification status",
  },
  default: "unverified",
},

emailVerifiedAt: {
  type: Date,
  default: null,
},

mobileVerificationStatus: {
  type: String,
  enum: {
    values: VERIFICATION_STATUSES,
    message: "Invalid verification status",
  },
  default: "unverified",
},

mobileVerifiedAt: {
  type: Date,
  default: null,
},

verificationVideo: mediaSchema,


    mobileVerificationStatus: {
      type: String,
      enum: {
        values: VERIFICATION_STATUSES,
        message: "Invalid verification status",
      },
      default: "unverified",
    },

    mobileVerifiedAt: {
      type: Date,
      default: null,
    },


    /* =====================================================
       STATUS
    ===================================== */
    status: {
      type: String,
      enum: {
        values: USER_STATUSES,
        message: "Invalid user status",
      },
      default: "active",
      index: true,
    },

    /* =====================================================
       SOFT DELETE
    ===================================== */
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================================================
   INDEXES
========================================================= */

userSchema.index({
  email: 1,
  status: 1,
});

userSchema.index({
  mobile: 1,
  status: 1,
});

userSchema.index({
  createdAt: -1,
});

/* =========================================================
   MODEL
========================================================= */

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
