
import mongoose from "mongoose";
import { mediaSchema } from "./media.model.js";
import { addressSchema } from "./address.model.js";

const ACTIVITY_MODES = ["online", "offline", "hybrid"];

const ORGANIZER_TYPES = ["individual", "organization"];

const JOIN_TYPES = ["open", "requestToApprove", "inviteOnly"];

const GENDERS = ["male", "female", "all"];

const VISIBILITY = ["public", "private"];

const RECURRING_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const ACTIVITY_STATUSES = [
  "draft",
  "published",
  "cancelled",
  "completed",
  "deleted",
];


/* =========================================
   ACTIVITY SCHEMA
========================================= */

const activitySchema = new mongoose.Schema(
  {
    /* =====================================
       BASIC INFORMATION
    ===================================== */

    category: {
      type: String,
      required: [true, "Activity category is required"],
      trim: true,
      minlength: [2, "Category must be at least 2 characters"],
      maxlength: [50, "Category cannot exceed 50 characters"],
    },

    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 10;
        },
        message: "Maximum 10 tags are allowed",
      },
    },

    media: {
      type: [mediaSchema],
      default: [],
    },

    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },


    /* =====================================
       ORGANIZER
    ===================================== */

    organizerType: {
      type: String,
      enum: {
        values: ORGANIZER_TYPES,
        message: "Invalid organizer type",
      },
      required: [true, "Organizer type is required"],
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    organizerOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },


    /* =====================================
       DATE & TIME
    ===================================== */

    startDateTime: {
      type: Date,
      required: [true, "Start date and time is required"],
    },

    endDateTime: {
      type: Date,
      required: [true, "End date and time is required"],
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurringPeriod: {
      type: String,
      enum: {
        values: RECURRING_PERIODS,
        message: "Invalid recurring period",
      },
    },

    dayOfWeek: {
      type: [String],
      enum: {
        values: DAYS_OF_WEEK,
        message: "Invalid day of week",
      },
      default: [],
    },


    /* =====================================
       ACTIVITY MODE
    ===================================== */

    activityMode: {
      type: String,
      enum: {
        values: ACTIVITY_MODES,
        message: "Activity mode must be online, offline or hybrid",
      },
      required: [true, "Activity mode is required"],
    },

    /*
      Required only when activity is
      offline or hybrid.
    */

    meetingAddress: {
      type: addressSchema,
      required: function () {
        return (
          this.activityMode === "offline" ||
          this.activityMode === "hybrid"
        );
      },
    },

    /*
      Required only when activity is
      online or hybrid.
    */

    meetingLink: {
      type: String,
      trim: true,
      maxlength: [500, "Meeting link cannot exceed 500 characters"],
      required: function () {
        return (
          this.activityMode === "online" ||
          this.activityMode === "hybrid"
        );
      },
    },


    /* =====================================
       PARTICIPANTS
    ===================================== */

    minParticipants: {
      type: Number,
      min: [1, "Minimum participants must be at least 1"],
      default: 1,
    },

    maxParticipants: {
      type: Number,
      required: [true, "Maximum participants is required"],
      min: [1, "Maximum participants must be at least 1"],
    },


    /* =====================================
       JOIN SETTINGS
    ===================================== */

    joinType: {
      type: String,
      enum: {
        values: JOIN_TYPES,
        message: "Invalid join type",
      },
      default: "open",
    },


    /* =====================================
       ELIGIBILITY
    ===================================== */

    allowedGender: {
      type: String,
      enum: {
        values: GENDERS,
        message: "Invalid allowed gender",
      },
      default: "all",
    },

    allowedAge: {
      min: {
        type: Number,
        min: [13, "Minimum age cannot be less than 13"],
        max: [100, "Minimum age cannot exceed 100"],
      },

      max: {
        type: Number,
        min: [13, "Maximum age cannot be less than 13"],
        max: [100, "Maximum age cannot exceed 100"],
      },
    },


    /* =====================================
       FITNESS
    ===================================== */

    isFitnessRequired: {
      type: Boolean,
      default: false,
    },


    /* =====================================
       PAYMENT
    ===================================== */

    isPaid: {
      type: Boolean,
      default: false,
    },

    activityCost: {
      type: Number,
      min: [0, "Activity cost cannot be negative"],
      default: 0,
    },


    /* =====================================
       REQUIREMENTS
    ===================================== */

    requirements: {
      type: [String],
      default: [],
    },

    cancellationPolicy: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Cancellation policy cannot exceed 1000 characters",
      ],
    },


    /* =====================================
       VISIBILITY
    ===================================== */

    visibility: {
      type: String,
      enum: {
        values: VISIBILITY,
        message: "Visibility must be public or private",
      },
      default: "public",
    },


    /* =====================================
       STATUS
    ===================================== */

    status: {
      type: String,
      enum: {
        values: ACTIVITY_STATUSES,
        message: "Invalid activity status",
      },
      default: "draft",
    },
  },

  {
    timestamps: true,
  }
);


/* =========================================
   CUSTOM VALIDATIONS
========================================= */

/*
  Start date must be before end date.
*/

activitySchema.pre("validate", function () {
  if (
    this.startDateTime &&
    this.endDateTime &&
    this.startDateTime >= this.endDateTime
  ) {
    throw new Error(
      "End date and time must be after start date and time"
    );
  }
});


/*
  Minimum participants cannot be
  greater than maximum participants.
*/

activitySchema.pre("validate", function () {
  if (
    this.minParticipants &&
    this.maxParticipants &&
    this.minParticipants > this.maxParticipants
  ) {
    throw new Error(
      "Minimum participants cannot be greater than maximum participants"
    );
  }
});


/*
  Minimum age cannot be greater than maximum age.
*/

/*
  Minimum age cannot be greater than maximum age.
*/
activitySchema.pre("validate", function () {
  if (
    this.allowedAge?.min != null &&
    this.allowedAge?.max != null &&
    this.allowedAge.min > this.allowedAge.max
  ) {
    throw new Error(
      "Minimum age cannot be greater than maximum age"
    );
  }
});


/*
  Individual organizer must have User.
  Organization organizer must have Organization.
*/
activitySchema.pre("validate", function () {
  if (
    this.organizerType === "individual" &&
    !this.organizer
  ) {
    throw new Error(
      "User organizer is required for individual activity"
    );
  }

  if (
    this.organizerType === "organization" &&
    !this.organizerOrganization
  ) {
    throw new Error(
      "Organization is required for organization activity"
    );
  }
});


/*
  Recurring activity validation.
*/
activitySchema.pre("validate", function () {
  if (this.isRecurring && !this.recurringPeriod) {
    throw new Error(
      "Recurring period is required for recurring activity"
    );
  }
});


/*
  Free activity should not have a cost.
*/
activitySchema.pre("validate", function () {
  if (!this.isPaid) {
    this.activityCost = 0;
  }
});

/*
  Free activity should not have a cost.
*/

activitySchema.pre("validate", function () {
  if (!this.isPaid) {
    this.activityCost = 0;
  }
});


/* =========================================
   INDEXES
========================================= */

/*
  Search index
*/

activitySchema.index({
  title: "text",
  description: "text",
  category: "text",
  tags: "text",
});


/*
  Date based search
*/

activitySchema.index({
  startDateTime: 1,
});


/*
  Category + status filtering
*/

activitySchema.index({
  category: 1,
  status: 1,
});


/*
  Organizer activities
*/

activitySchema.index({
  organizer: 1,
});


/*
  Public activity listing
*/

activitySchema.index({
  visibility: 1,
  status: 1,
});


/*
  Activity mode filtering
*/

activitySchema.index({
  activityMode: 1,
});


/* =========================================
   MODEL
========================================= */

const ActivityModel = mongoose.model(
  "Activity",
  activitySchema
);

export default ActivityModel;