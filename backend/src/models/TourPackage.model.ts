import mongoose, { Schema } from "mongoose";

const schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  tripTypes: [{
    type: String
  }],
  districts: [{
    type: String
  }],
  interests: [{
    type: String
  }],
  days: {
    type: Number,
    min: 1,
    default: 2
  },
  indicativeFromLkr: {
    type: Number,
    min: 0,
    default: 0
  },
  featuredDestinations: [{
    type: String
  }],
  highlights: [{
    type: String
  }],
  inclusions: [{
    type: String
  }],
  exclusions: [{
    type: String
  }],
  minTravelers: {
    type: Number,
    min: 1,
    default: 1
  },
  maxTravelers: {
    type: Number,
    min: 1,
    default: 50
  },
  image: {
    type: String,
    default: ""
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const TourPackage =
  mongoose.models.TourPackage ||
  mongoose.model("TourPackage", schema);