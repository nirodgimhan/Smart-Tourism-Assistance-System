import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    destinationId: {
      type: Schema.Types.ObjectId,
      ref: "Destination"
    },
    language: {
      type: String,
      enum: ["en", "si"],
      default: "en"
    },
    content: {
      type: String,
      required: true
    },
    sourceUrl: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Heritage =
  mongoose.models.Heritage ||
  mongoose.model("Heritage", schema);