import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    merchant: String,
    total: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: "LKR"
    },
    extractedItems: [
      {
        name: String,
        quantity: Number,
        price: Number
      }
    ],
    processingStatus: {
      type: String,
      default: "pending"
    }
  },
  { timestamps: true }
);

export const Receipt =
  mongoose.models.Receipt ||
  mongoose.model("Receipt", schema);