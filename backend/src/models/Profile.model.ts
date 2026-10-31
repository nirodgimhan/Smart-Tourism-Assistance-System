
import mongoose, { Schema } from "mongoose";

const profileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true
    },
    phone: String,
    country: String,
    interests: [String],
    budgetLkr: {
      type: Number,
      default: 10000,
      min: 0
    },
    travelPace: {
      type: String,
      enum: ["relaxed", "normal", "fast"],
      default: "normal"
    },
    transport: {
      type: String,
      default: "car"
    },
    consent: {
      location: {
        type: Boolean,
        default: false
      },
      receipt: {
        type: Boolean,
        default: false
      },
      notifications: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

export const Profile = mongoose.model(
  "Profile",
  profileSchema
);
