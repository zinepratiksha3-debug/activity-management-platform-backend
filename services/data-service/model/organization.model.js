
import mongoose from "mongoose";
import { mediaSchema } from "./media.model.js";
import { addressSchema } from "./address.model.js";


/* =========================================================
   CONSTANTS
========================================================= */

export const MEMBERSHIP_TYPES = ["free", "premium"];

 export const ORGANIZATION_TYPES = [
  "community",
  "ngo",
  "club",
  "company",
  "school",
  "college",
  "sports",
  "fitness",
  "other",
];

 export const ORGANIZATION_STATUSES = [
  "draft",
  "pending",
  "active",
  "suspended",
  "rejected",
  "deleted",
];

 export const VERIFICATION_STATUSES = [
  "unverified",
  "pending",
  "verified",
  "rejected",
];


/* =========================================================
   EMAIL VALIDATOR
========================================================= */

const emailValidator = {
  validator: function (value) {
    if (!value) return true;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  message: "Please provide a valid email address.",
};


/* =========================================================
   PHONE VALIDATOR
========================================================= */

const phoneValidator = {
  validator: function (value) {
    if (!value) return true;

    return /^\+[1-9]\d{7,14}$/.test(value);
  },

  message:
    "Phone number must be in international E.164 format.",
};


/* =========================================================
   ORGANIZATION SCHEMA
========================================================= */

const organizationSchema = new mongoose.Schema(
  {
    /* =====================================================
       OWNER
    ===================================================== */

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },


    /* =====================================================
       BASIC INFORMATION
    ===================================================== */

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    organizationType: {
      type: String,
      enum: ORGANIZATION_TYPES,
      required: true,
    },

    focusedCategories: {
      type: [String],
      default: [],
    },


    /* =====================================================
       MEDIA
    ===================================================== */

    logo: {
      type: mediaSchema,
    },

    coverPage: {
      type: mediaSchema,
    },


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    tagline: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    about: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    tags: {
      type: [String],
      default: [],
    },


    /* =====================================================
       CONTACT
    ===================================================== */

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      validate: emailValidator,
    },

    phone: {
      type: String,
      trim: true,
      validate: phoneValidator,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 500,
    },


    /* =====================================================
       SOCIAL MEDIA
    ===================================================== */

    socialPages: {
      instagram: {
        type: String,
        trim: true,
      },

      facebook: {
        type: String,
        trim: true,
      },

      youtube: {
        type: String,
        trim: true,
      },

      x: {
        type: String,
        trim: true,
      },

      linkedIn: {
        type: String,
        trim: true,
      },
    },


    /* =====================================================
       ADDRESS
    ===================================================== */

    address: {
      type: addressSchema,
    },


    /* =====================================================
       MEMBERSHIP
    ===================================================== */

    membershipType: {
      type: String,
      enum: MEMBERSHIP_TYPES,
      default: "free",
    },

    isMemberVisible: {
      type: Boolean,
      default: true,
    },


    /* =====================================================
       VERIFICATION
    ===================================================== */

    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: "unverified",
      index: true,
    },

    registeredDocument: {
      type: mediaSchema,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },


    /* =====================================================
       STATUS
    ===================================================== */

    status: {
      type: String,
      enum: ORGANIZATION_STATUSES,
      default: "draft",
      index: true,
    },


    /* =====================================================
       SOFT DELETE
    ===================================================== */

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

 organizationSchema.index({
  owner: 1,
  status: 1,
});

 organizationSchema.index({
  name: "text",
  tagline: "text",
  about: "text",
  tags: "text",
  focusedCategories: "text",
});

organizationSchema.index({
  status: 1,
  verificationStatus: 1,
});

organizationSchema.index({
  membershipType: 1,
});

organizationSchema.index({
  createdAt: -1,
});


/* =========================================================
   MODEL
========================================================= */

export const OrganizationModel = mongoose.model(
  "Organization",
  organizationSchema
);

// module.exports = OrganizationModel;