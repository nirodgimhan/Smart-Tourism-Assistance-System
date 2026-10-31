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
    description: String,
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    status: {
      type: String,
      default: "unreviewed"
    },
    evidenceSource: String
  },
  { timestamps: true }
);

export const FraudAlert =
  mongoose.models.FraudAlert ||
  mongoose.model("FraudAlert", schema);