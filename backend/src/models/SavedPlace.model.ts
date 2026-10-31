import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    destinationId: {
      type: Schema.Types.ObjectId,
      ref: "Destination",
      required: true
    },
    note: {
      type: String,
      maxlength: 500
    }
  },
  { timestamps: true }
);

schema.index(
  { userId: 1, destinationId: 1 },
  { unique: true }
);

export const SavedPlace =
  mongoose.models.SavedPlace ||
  mongoose.model("SavedPlace", schema);