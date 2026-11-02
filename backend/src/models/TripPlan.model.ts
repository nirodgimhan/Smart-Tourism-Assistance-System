import mongoose, { Schema } from "mongoose";

const schema = new Schema({
  tripId: {
    type: Schema.Types.ObjectId,
    ref: "Trip",
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  days: {
    type: [Schema.Types.Mixed],
    default: []
  },
  overrides: {
    type: [Schema.Types.Mixed],
    default: []
  },
  totals: {
    type: Schema.Types.Mixed,
    default: {}
  },
  algorithm: {
    type: String,
    default: "rule-based-demo-v1"
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const TripPlan =
  mongoose.models.TripPlan ||
  mongoose.model("TripPlan", schema);