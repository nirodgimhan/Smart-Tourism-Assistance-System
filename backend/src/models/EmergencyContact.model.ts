import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    district: String,
    phone: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    sourceUrl: String
  },
  { timestamps: true }
);

export const EmergencyContact =
  mongoose.models.EmergencyContact ||
  mongoose.model("EmergencyContact", schema);