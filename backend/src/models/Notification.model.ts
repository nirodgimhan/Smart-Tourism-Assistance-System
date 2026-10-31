import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      default: "general"
    }
  },
  { timestamps: true }
);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", schema);