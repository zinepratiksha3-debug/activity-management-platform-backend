import mongoose from "mongoose";

const ADDRESS_TYPES = ["home", "office", "organization", "meeting", "other"];
const COUNTRIES = ["India"];

const pinCodeValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^[1-9][0-9]{5}$/.test(value);
  },
  message: "Please provide a valid 6-digit PIN code.",
};

export const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: { values: ADDRESS_TYPES, message: "Invalid address type." },
      default: "other",
      trim: true,
    },
    addressLine1: { type: String, trim: true, maxlength: [200, "Address line 1 cannot exceed 200 characters."] },
    addressLine2: { type: String, trim: true, maxlength: [200, "Address line 2 cannot exceed 200 characters."] },
    landmark: { type: String, trim: true, maxlength: [150, "Landmark cannot exceed 150 characters."] },
    city: { type: String, trim: true, maxlength: [100, "City cannot exceed 100 characters."] },
    district: { type: String, trim: true, maxlength: [100, "District cannot exceed 100 characters."] },
    state: { type: String, trim: true, maxlength: [100, "State cannot exceed 100 characters."] },
    country: {
      type: String,
      trim: true,
      enum: { values: COUNTRIES, message: "Invalid country." },
      default: "India",
    },
    pinCode: { type: String, trim: true, validate: pinCodeValidator },
    location: {
      latitude: { type: Number, min: [-90, "Latitude must be between -90 and 90."], max: [90, "Latitude must be between -90 and 90."] },
      longitude: { type: Number, min: [-180, "Longitude must be between -180 and 180."], max: [180, "Longitude must be between -180 and 180."] },
    },
    label: { type: String, trim: true, maxlength: [50, "Address label cannot exceed 50 characters."] },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false, versionKey: false }
);