import mongoose, { Schema } from "mongoose";

const tripSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budgetLkr: {
    type: Number,
    required: true,
    min: 0
  },
  interests: [{
    type: String,
    trim: true
  }],
  destinationIds: [{
    type: Schema.Types.ObjectId,
    ref: "Destination"
  }],
  startLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [80.6337, 7.2906]
    }
  },
  transportMode: {
    type: String,
    enum: ["driving", "walking"],
    default: "driving"
  },
  status: {
    type: String,
    enum: [
      "draft",
      "planned",
      "active",
      "completed",
      "cancelled"
    ],
    default: "draft"
  },
  tripType: {
    type: String,
    enum: [
      "solo",
      "couple",
      "family",
      "friends",
      "group",
      "business"
    ],
    default: "family"
  },
  adults: {
    type: Number,
    min: 1,
    max: 30,
    default: 2
  },
  children: {
    type: Number,
    min: 0,
    max: 20,
    default: 0
  },
  pace: {
    type: String,
    enum: ["relaxed", "balanced", "active"],
    default: "balanced"
  },
  accommodation: {
    type: String,
    enum: ["budget", "standard", "premium"],
    default: "standard"
  },
  preferredDistricts: [{
    type: String,
    trim: true
  }],
  specialNotes: {
    type: String,
    maxlength: 500,
    default: ""
  },
  packageId: {
    type: Schema.Types.ObjectId,
    ref: "TourPackage",
    default: null
  }
}, {
  timestamps: true
});

tripSchema.index({
  userId: 1,
  startDate: -1
});

export const Trip =
  mongoose.models.Trip ||
  mongoose.model("Trip", tripSchema);