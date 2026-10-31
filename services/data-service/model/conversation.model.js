const mongoose = require("mongoose");

/* =========================================================
   CONSTANTS
========================================================= */

const CONVERSATION_TYPES = Object.freeze([
  "direct",
  "group",
]);

const MEMBERSHIP_STATUS = Object.freeze([
  "pending",
  "active",
  "rejected",
  "left",
  "removed",
  "banned",
]);

const CONVERSATION_STATUS = Object.freeze([
  "active",
  "archived",
  "deleted",
]);

const GROUP_VISIBILITY = Object.freeze([
  "public",
  "private",
]);

const GROUP_JOIN_POLICY = Object.freeze([
  "open",
  "approval_required",
]);

const PARTICIPANT_ROLES = Object.freeze([
  "owner",
  "admin",
  "moderator",
  "member",
]);

const MAX_PARTICIPANTS = 500;

/* =========================================================
   PARTICIPANT SCHEMA
========================================================= */

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Participant user is required"],
    },

    role: {
      type: String,
      enum: {
        values: PARTICIPANT_ROLES,
        message: "Invalid participant role",
      },
      default: "member",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    /*
     * Used for group read tracking.
     * Instead of storing readBy[] in every message.
     */
    lastReadAt: {
      type: Date,
      default: null,
    },

    isMuted: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   CONVERSATION SCHEMA
========================================================= */

const conversationSchema = new mongoose.Schema(
  {
    /* =====================================================
       CONVERSATION TYPE
    ===================================================== */

    type: {
      type: String,
      enum: {
        values: CONVERSATION_TYPES,
        message: "Invalid conversation type",
      },
      required: [true, "Conversation type is required"],
      index: true,
    },

    /* =====================================================
       PARTICIPANTS
       Maximum 500 users
    ===================================================== */

    participants: {
      type: [participantSchema],

      validate: {
        validator: function (participants) {
          return (
            participants.length >= 2 &&
            participants.length <= MAX_PARTICIPANTS
          );
        },

        message:
          "Conversation must contain between 2 and 500 participants.",
      },
    },

    /* =====================================================
       GROUP INFORMATION
    ===================================================== */

    name: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Group name cannot exceed 100 characters.",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Group description cannot exceed 500 characters.",
      ],
    },

    groupImage: {
      type: String,
      trim: true,
    },

    visibility: {
      type: String,
      enum: {
        values: GROUP_VISIBILITY,
        message: "Invalid group visibility",
      },
      default: "private",
    },

    joinPolicy: {
      type: String,
      enum: {
        values: GROUP_JOIN_POLICY,
        message: "Invalid group join policy",
      },
      default: "approval_required",
    },

    /* =====================================================
       CREATED BY
    ===================================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Conversation creator is required"],
    },

    /* =====================================================
       LAST MESSAGE
    ===================================================== */

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },

    /* =====================================================
       MESSAGE BUCKET
    ===================================================== */

    currentBucketNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    currentBucketMessageCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 500,
    },

    /* =====================================================
       CONVERSATION STATUS
    ===================================================== */

    status: {
      type: String,
      enum: {
        values: CONVERSATION_STATUS,
        message: "Invalid conversation status",
      },
      default: "active",
      index: true,
    },

    /* =====================================================
       GROUP SETTINGS
    ===================================================== */

    settings: {
      onlyAdminsCanSend: {
        type: Boolean,
        default: false,
      },

      onlyAdminsCanAddMembers: {
        type: Boolean,
        default: false,
      },
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
 * Find user's conversations
 */
conversationSchema.index({
  "participants.user": 1,
  status: 1,
  lastMessageAt: -1,
});

/*
 * Public group discovery
 */
conversationSchema.index({
  type: 1,
  visibility: 1,
  status: 1,
});

/*
 * Conversation lookup
 */
conversationSchema.index({
  type: 1,
  status: 1,
});

/* =========================================================
   VALIDATION
========================================================= */

conversationSchema.pre("validate", function (next) {
  /* -------------------------------------------------------
     DIRECT CONVERSATION
  ------------------------------------------------------- */

  if (this.type === "direct") {
    if (this.participants.length !== 2) {
      return next(
        new Error(
          "Direct conversation must have exactly 2 participants."
        )
      );
    }

    /*
     * Direct conversation does not need group settings.
     */
    this.visibility = undefined;
    this.joinPolicy = undefined;
  }

  /* -------------------------------------------------------
     GROUP CONVERSATION
  ------------------------------------------------------- */

  if (this.type === "group") {
    if (!this.name) {
      return next(
        new Error("Group name is required.")
      );
    }
  }

  next();
});

/* =========================================================
   INSTANCE METHODS
========================================================= */

/*
 * Check whether conversation is full
 */
conversationSchema.methods.isFull = function () {
  return this.participants.length >= MAX_PARTICIPANTS;
};

/*
 * Check whether user is participant
 */
conversationSchema.methods.hasParticipant = function (
  userId
) {
  return this.participants.some(
    (participant) =>
      participant.user.toString() === userId.toString() &&
      !participant.leftAt
  );
};

/*
 * Get participant
 */
conversationSchema.methods.getParticipant = function (
  userId
) {
  return this.participants.find(
    (participant) =>
      participant.user.toString() === userId.toString() &&
      !participant.leftAt
  );
};

/*
 * Check whether user is admin
 */
conversationSchema.methods.isAdmin = function (
  userId
) {
  const participant = this.getParticipant(userId);

  return (
    participant &&
    ["owner", "admin"].includes(participant.role)
  );
};

/* =========================================================
   MODEL
========================================================= */

const ConversationModel = mongoose.model(
  "Conversation",
  conversationSchema
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  ConversationModel,
  CONVERSATION_TYPES,
  CONVERSATION_STATUS,
  GROUP_VISIBILITY,
  GROUP_JOIN_POLICY,
  PARTICIPANT_ROLES,
  MAX_PARTICIPANTS,
};