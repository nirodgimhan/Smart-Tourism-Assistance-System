
import mongoose, {
  Schema,
  model
} from "mongoose";

const bookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    hotelId: {
      type: String,
      required: true,
      trim: true
    },

    checkIn: {
      type: Date,
      required: true
    },

    checkOut: {
      type: Date,
      required: true
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    },

    status: {
      type: String,
      enum: ["pending", "cancelled"],
      default: "pending"
    },

    totalLkr: {
      type: Number,
      default: null,
      min: 0
    }
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, createdAt: -1 });

export const Booking =
  mongoose.models.Booking ||
  model("Booking", bookingSchema);
