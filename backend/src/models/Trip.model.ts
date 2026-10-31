
import mongoose, { Schema } from "mongoose";

const tripSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    budgetLkr: {
      type: Number,
      required: true,
      min: 0
    },
    interests: [String],
    destinationIds: [{
      type: Schema.Types.ObjectId,
      ref: "Destination"
    }],
    startLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number]
      }
    },
    transportMode: {
      type: String,
      enum: ["driving", "walking"],
      default: "driving"
    },
    status: {
      type: String,
      enum: [
        "draft",
        "planned",
        "active",
        "completed",
        "cancelled"
      ],
      default: "draft"
    }
  },
  { timestamps: true }
);

tripSchema.index({
  userId: 1,
  startDate: -1
});

export const Trip = mongoose.model(
  "Trip",
  tripSchema
);
