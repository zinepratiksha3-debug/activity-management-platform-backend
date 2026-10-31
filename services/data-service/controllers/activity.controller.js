
import mongoose from "mongoose";
import ActivityModel from "../model/activity.model.js";
import { OrganizationModel } from "../model/organization.model.js";

class ActivityController {
  static async createActivity(req, res) {
    try {
      const {
        title,
        category,
        description,
        tags = [],
        organizerType = "individual",
        organizerOrganization,
        startDateTime,
        endDateTime,
        isRecurring = false,
        recurringPeriod,
        activityType,
        location,
        meetingLink,
        minParticipants = 1,
        maxParticipants = 10,
        joinType = "open",
        pricingType = "free",
        fee = 0,
        requirements = [],
        status = "published",
      } = req.body;

      // Validate required text fields.
      if (
        typeof title !== "string" ||
        typeof category !== "string" ||
        typeof description !== "string" ||
        !title.trim() ||
        !category.trim() ||
        !description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Title, category and description are required.",
        });
      }

      if (
        !startDateTime ||
        !endDateTime ||
        !activityType
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date, end date and activity type are required.",
        });
      }

      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start >= end
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid dates. End time must be after start time.",
        });
      }

      if (start <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Activity start time must be in the future.",
        });
      }

      if (!["online", "offline", "hybrid"].includes(activityType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid activity type.",
        });
      }

      if (
        !Number.isInteger(Number(minParticipants)) ||
        !Number.isInteger(Number(maxParticipants)) ||
        Number(minParticipants) < 1 ||
        Number(maxParticipants) < Number(minParticipants)
      ) {
        return res.status(400).json({
          success: false,
          message: "Participant limits are invalid.",
        });
      }

      if (!["open", "request", "invite"].includes(joinType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid participation type.",
        });
      }

      if (!["free", "paid"].includes(pricingType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid pricing type.",
        });
      }

      const activityCost =
        pricingType === "paid" ? Number(fee) : 0;

      if (
        !Number.isFinite(activityCost) ||
        activityCost < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Activity fee must be a valid non-negative number.",
        });
      }

      if (
        !Array.isArray(tags) ||
        tags.length > 10 ||
        !tags.every((tag) => typeof tag === "string")
      ) {
        return res.status(400).json({
          success: false,
          message: "Tags must be an array of up to 10 strings.",
        });
      }

      if (
        !Array.isArray(requirements) ||
        !requirements.every((item) => typeof item === "string")
      ) {
        return res.status(400).json({
          success: false,
          message: "Requirements must be an array of strings.",
        });
      }

      if (isRecurring && !recurringPeriod) {
        return res.status(400).json({
          success: false,
          message: "A recurring period is required for recurring activities.",
        });
      }

      // Only the authenticated user's ID can be used as an individual organizer.
      let organizer;
      let organizerOrganizationId;

      if (organizerType === "individual") {
        if (!mongoose.isValidObjectId(req.user?.sub)) {
          return res.status(401).json({
            success: false,
            message: "A valid authenticated user is required.",
          });
        }

        organizer = req.user.sub;
      } else if (organizerType === "organization") {
        if (!mongoose.isValidObjectId(organizerOrganization)) {
          return res.status(400).json({
            success: false,
            message: "Select a valid organization before creating this activity.",
          });
        }

        const organization = await OrganizationModel.findOne({
          _id: organizerOrganization,
          owner: req.user?.sub,
          status: "active",
          deletedAt: null,
        }).select("_id");

        if (!organization) {
          return res.status(403).json({
            success: false,
            message: "You must own an active organization to create an activity for it.",
          });
        }

        organizerOrganizationId = organization._id;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid organizer type.",
        });
      }

      if (
        ["offline", "hybrid"].includes(activityType) &&
        (typeof location !== "string" || !location.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "A location is required for offline or hybrid activities.",
        });
      }

      if (
        ["online", "hybrid"].includes(activityType) &&
        (typeof meetingLink !== "string" || !meetingLink.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "A meeting link is required for online or hybrid activities.",
        });
      }

      const activityData = {
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        tags: tags.map((tag) => tag.trim()).filter(Boolean),
        organizerType,
        organizer,
        organizerOrganization: organizerOrganizationId,
        startDateTime: start,
        endDateTime: end,
        isRecurring,
        recurringPeriod: isRecurring ? recurringPeriod : undefined,
        activityMode: activityType,
        meetingAddress:
          ["offline", "hybrid"].includes(activityType)
            ? {
                type: "meeting",
                addressLine1: location.trim(),
                country: "India",
              }
            : undefined,
        meetingLink:
          ["online", "hybrid"].includes(activityType)
            ? meetingLink.trim()
            : undefined,
        minParticipants: Number(minParticipants),
        maxParticipants: Number(maxParticipants),
        joinType:
          joinType === "request"
            ? "requestToApprove"
            : joinType === "invite"
              ? "inviteOnly"
              : "open",
        isPaid: pricingType === "paid",
        activityCost,
        requirements: requirements
          .map((item) => item.trim())
          .filter(Boolean),
        status:"published",
      };

      // Do not accept media metadata from the client as proof of an upload.
      const activity = await ActivityModel.create(activityData);

      return res.status(201).json({
        success: true,
        message: "Activity created successfully.",
        data: { activity },
      });
    } catch (error) {
      console.error("Create activity error:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create activity.",
      });
    }
  }

    static async getActivities(req, res) {
    try {
      const activities = await ActivityModel.find({
        status: "published",
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: activities.length,
        data: { activities },
      });
    } catch (error) {
      console.error("Get activities error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch activities.",
      });
    }
  }
}

export default ActivityController;
