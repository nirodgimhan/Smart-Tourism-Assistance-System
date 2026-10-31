
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "test",
    "production"
  ]).default("development"),

  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().min(1),

  CLIENT_URL: z.string().default(
    "http://localhost:5173"
  ),

  JWT_SECRET: z.string().min(32),

  AI_SERVICE_URL: z.string().default(
    "http://localhost:8000"
  )
});

export const env = envSchema.parse(process.env);
