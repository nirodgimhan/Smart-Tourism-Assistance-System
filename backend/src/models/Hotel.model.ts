import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true
    },
    address: String,
    description: String,
    amenities: [String],
    images: [String],
    indicativePriceLkr: {
      type: Number,
      min: 0
    },
    providerUrl: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Hotel =
  mongoose.models.Hotel ||
  mongoose.model("Hotel", schema);