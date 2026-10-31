import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true
    },
    days: [
      {
        date: Date,
        stops: [
          {
            destinationId: {
              type: Schema.Types.ObjectId,
              ref: "Destination"
            },
            order: Number,
            notes: String
          }
        ]
      }
    ],
    status: {
      type: String,
      default: "draft"
    },
    algorithm: {
      type: String,
      default: "manual"
    }
  },
  { timestamps: true }
);

export const Itinerary =
  mongoose.models.Itinerary ||
  mongoose.model("Itinerary", schema);