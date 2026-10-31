
import mongoose, { Schema } from "mongoose";

const destinationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    category: {
      type: String,
      required: true
    },
    district: String,
    province: String,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v: number[]) =>
            v.length === 2 &&
            v[0] >= -180 && v[0] <= 180 &&
            v[1] >= -90 && v[1] <= 90,
          message: "Invalid GeoJSON coordinates"
        }
      }
    },
    images: [String],
    openingHours: String,
    estimatedFeeLkr: {
      type: Number,
      default: 0
    },
    source: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

destinationSchema.index({
  location: "2dsphere"
});

destinationSchema.index({
  name: "text",
  description: "text"
});

export const Destination = mongoose.model(
  "Destination",
  destinationSchema
);
