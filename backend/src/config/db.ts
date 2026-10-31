
import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("================================");
    console.log("GOCELONE MongoDB Connected!");
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log("================================");

  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB Disconnected");
  } catch (error) {
    console.error("MongoDB Disconnect Failed:", error);
    throw error;
  }
};
