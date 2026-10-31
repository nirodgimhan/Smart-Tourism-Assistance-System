
import "dotenv/config";
import mongoose from "mongoose";

import { Destination } from
  "../models/Destination.model.js";

const destinations = [
  {
    name: "Sigiriya Rock Fortress",
    category: "culture",
    district: "Matale",
    province: "Central",
    location: {
      type: "Point",
      coordinates: [80.7597, 7.9570]
    },
    description: "Historical rock fortress",
    source: "Development sample",
    verified: false
  },
  {
    name: "Temple of the Tooth",
    category: "culture",
    district: "Kandy",
    province: "Central",
    location: {
      type: "Point",
      coordinates: [80.6413, 7.2936]
    },
    description: "Historic Buddhist temple",
    source: "Development sample",
    verified: false
  },
  {
    name: "Galle Fort",
    category: "culture",
    district: "Galle",
    province: "Southern",
    location: {
      type: "Point",
      coordinates: [80.2170, 6.0269]
    },
    description: "Historic fortified town",
    source: "Development sample",
    verified: false
  },
  {
    name: "Nine Arch Bridge",
    category: "nature",
    district: "Badulla",
    province: "Uva",
    location: {
      type: "Point",
      coordinates: [81.0610, 6.8768]
    },
    description: "Scenic railway bridge",
    source: "Development sample",
    verified: false
  },
  {
    name: "Mirissa Beach",
    category: "beach",
    district: "Matara",
    province: "Southern",
    location: {
      type: "Point",
      coordinates: [80.4540, 5.9483]
    },
    description: "Coastal destination",
    source: "Development sample",
    verified: false
  }
];

async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/gocelone"
    );

    for (const destination of destinations) {
      await Destination.updateOne(
        {
          name: destination.name,
          source: "Development sample"
        },
        { $set: destination },
        { upsert: true }
      );
    }

    console.log("Gocelone sample destinations inserted");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
