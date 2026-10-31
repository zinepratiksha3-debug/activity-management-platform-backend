const mongoose = require("mongoose");

/* =========================================================
   CONSTANTS
========================================================= */

const MESSAGE_TYPES = Object.freeze([
  "text",
  "image",
  "video",
  "audio",
]);

const MESSAGE_STATUS = Object.freeze([
  "pending",
  "new",
  "delivered",
  "read",
  "deleted",
]);

const MAX_MESSAGES_PER_BUCKET = 500;

/* =========================================================
   ATTACHMENT SCHEMA
========================================================= */

const attachmentSchema = new mongoose.Schema(
  {
    /*
     * AWS S3 object key
     */
    key: {
      type: String,
      required: [true, "Attachment key is required"],
      trim: true,
    },

    /*
     * CloudFront URL
     */
    url: {
      type: String,
      required: [true, "Attachment URL is required"],
      trim: true,
    },

    mimeType: {
      type: String,
      trim: true,
      lowercase: true,
    },

    originalName: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    size: {
      type: Number,
      min: [0, "Attachment size cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   MESSAGE SCHEMA
========================================================= */

const messageSchema = new mongoose.Schema(
  {
    /* =====================================================
       CONVERSATION
    ===================================================== */

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
      index: true,
    },

    /* =====================================================
       BUCKET
    ===================================================== */

    bucketNumber: {
      type: Number,
      required: [true, "Bucket number is required"],
      min: 1,
      index: true,
    },

    /* =====================================================
       SENDER
    ===================================================== */

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message sender is required"],
      index: true,
    },

    /* =====================================================
       MESSAGE TYPE
    ===================================================== */

    type: {
      type: String,
      enum: {
        values: MESSAGE_TYPES,
        message: "Invalid message type",
      },
      required: [true, "Message type is required"],
      default: "text",
    },

    /* =====================================================
       TEXT
    ===================================================== */

    text: {
      type: String,
      trim: true,
      maxlength: [
        5000,
        "Message cannot exceed 5000 characters.",
      ],
    },

    /* =====================================================
       ATTACHMENTS
    ===================================================== */

    attachment: {
      type: attachmentSchema,
      default: null,
    },

    /* =====================================================
       MESSAGE STATUS
    ===================================================== */

    status: {
      type: String,
      enum: {
        values: MESSAGE_STATUS,
        message: "Invalid message status",
      },
      default: "pending",
      index: true,
    },

    /* =====================================================
       DELIVERY
    ===================================================== */

    deliveredAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       READ
    ===================================================== */

    readAt: {
      type: Date,
      default: null,
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

    /* =====================================================
       EDIT
    ===================================================== */

    editedAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       REPLY
    ===================================================== */

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
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
 * Main pagination query
 */
messageSchema.index({
  conversation: 1,
  bucketNumber: -1,
  createdAt: -1,
});

/*
 * Fetch messages from a particular bucket
 */
messageSchema.index({
  conversation: 1,
  bucketNumber: 1,
  createdAt: 1,
});

/*
 * Status queries
 */
messageSchema.index({
  conversation: 1,
  status: 1,
});

/* =========================================================
   VALIDATION
========================================================= */

messageSchema.pre("validate", function (next) {
  /*
   * TEXT MESSAGE
   */
  if (this.type === "text") {
    if (!this.text) {
      return next(
        new Error(
          "Text message must contain text."
        )
      );
    }

    this.attachment = null;
  }

  /*
   * MEDIA MESSAGE
   */
  if (
    ["image", "video", "audio"].includes(this.type)
  ) {
    if (!this.attachment) {
      return next(
        new Error(
          `${this.type} message must contain an attachment.`
        )
      );
    }

    if (
      this.attachment.mimeType &&
      !this.attachment.mimeType.startsWith(
        `${this.type}/`
      )
    ) {
      return next(
        new Error(
          `Invalid MIME type for ${this.type} attachment.`
        )
      );
    }
  }

  next();
});

/* =========================================================
   INSTANCE METHODS
========================================================= */

/*
 * Soft delete message
 */
messageSchema.methods.softDelete = async function (
  userId
) {
  this.status = "deleted";
  this.deletedAt = new Date();
  this.deletedBy = userId;

  return this.save();
};

/*
 * Edit message
 */
messageSchema.methods.editMessage = async function (
  text
) {
  if (this.type !== "text") {
    throw new Error(
      "Only text messages can be edited."
    );
  }

  this.text = text;
  this.editedAt = new Date();

  return this.save();
};

/*
 * Mark message as delivered
 */
messageSchema.methods.markDelivered =
  async function () {
    if (this.status === "deleted") {
      return this;
    }

    this.status = "delivered";
    this.deliveredAt = new Date();

    return this.save();
  };

/*
 * Mark message as read
 */
messageSchema.methods.markRead = async function () {
  if (this.status === "deleted") {
    return this;
  }

  this.status = "read";
  this.readAt = new Date();

  return this.save();
};

/* =========================================================
   STATIC METHODS
========================================================= */

/*
 * Get latest messages from current bucket
 */
messageSchema.statics.getLatestMessages =
  function (conversationId, bucketNumber, limit = 50) {
    return this.find({
      conversation: conversationId,
      bucketNumber,
      status: {
        $ne: "deleted",
      },
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .populate("sender", "name profileImage");
  };

/*
 * Get older messages
 */
messageSchema.statics.getOlderMessages =
  function (
    conversationId,
    bucketNumber,
    beforeDate,
    limit = 50
  ) {
    return this.find({
      conversation: conversationId,

      bucketNumber,

      createdAt: {
        $lt: beforeDate,
      },

      status: {
        $ne: "deleted",
      },
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .populate("sender", "name profileImage");
  };

/* =========================================================
   MODEL
========================================================= */

const MessageModel = mongoose.model(
  "Message",
  messageSchema
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  MessageModel,
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  MAX_MESSAGES_PER_BUCKET,
};