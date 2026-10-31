import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking"
    },
    provider: String,
    providerReference: String,
    amountLkr: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "verified", "failed", "refunded"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export const Payment =
  mongoose.models.Payment ||
  mongoose.model("Payment", schema);