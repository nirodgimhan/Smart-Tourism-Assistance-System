import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    algorithm: {
      type: String,
      required: true
    },
    datasetVersion: String,
    metrics: {
      type: Schema.Types.Mixed,
      default: {}
    },
    notes: String,
    status: {
      type: String,
      default: "draft"
    }
  },
  { timestamps: true }
);

export const ResearchExperiment =
  mongoose.models.ResearchExperiment ||
  mongoose.model("ResearchExperiment", schema);