
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";

// ==========================================
// EXISTING CORE ROUTES
// ==========================================

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import destinationRoutes from "./routes/destination.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import mapRoutes from "./routes/map.routes.js";

// ==========================================
// ADMIN, BOOKING, CONSENT, CONTACT
// ==========================================

import adminRoutes from "./routes/admin.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import consentRoutes from "./routes/consent.routes.js";
import contactRoutes from "./routes/contact.routes.js";

// ==========================================
// NEW GOCELONE MODULE ROUTES
// ==========================================

import dashboardRoutes from "./routes/dashboard.routes.js";
import emergencyRoutes from "./routes/emergency.routes.js";
import fraudRoutes from "./routes/fraud.routes.js";
import guideRoutes from "./routes/guide.routes.js";
import heritageRoutes from "./routes/heritage.routes.js";
import hotelRoutes from "./routes/hotel.routes.js";
import itineraryRoutes from "./routes/itinerary.routes.js";
import navigationRoutes from "./routes/navigation.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import poiRoutes from "./routes/poi.routes.js";
import receiptRoutes from "./routes/receipt.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import refundRoutes from "./routes/refund.routes.js";
import replanRoutes from "./routes/replan.routes.js";
import researchRoutes from "./routes/research.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import routeRoutes from "./routes/route.routes.js";
import savedPlaceRoutes from "./routes/savedPlace.routes.js";
import sosRoutes from "./routes/sos.routes.js";
import translationRoutes from "./routes/translation.routes.js";
import userRoutes from "./routes/user.routes.js";
import vsiRoutes from "./routes/vsi.routes.js";
import weatherRoutes from "./routes/weather.routes.js";

// ==========================================
// EXPRESS APPLICATION
// ==========================================

const app = express();

app.disable("x-powered-by");

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);

app.use(cookieParser());

// ==========================================
// GLOBAL RATE LIMITER
// ==========================================

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message:
        "Too many requests. Please try again later."
    }
  })
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    application: "Gocelone",
    status: "running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// CORE API ROUTES
// ==========================================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/profile", profileRoutes);

app.use("/api/v1/destinations", destinationRoutes);

app.use("/api/v1/trips", tripRoutes);

app.use("/api/v1/maps", mapRoutes);

// ==========================================
// ADMIN + BOOKINGS + PRIVACY + CONTACT
// ==========================================

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/bookings", bookingRoutes);

app.use("/api/v1/consent", consentRoutes);

app.use("/api/v1/contact", contactRoutes);

// ==========================================
// MODULE 01 - SMART TRAVEL PLANNER
// ==========================================

// Tourist dashboard
app.use("/api/v1/dashboard", dashboardRoutes);

// AI itinerary optimization
app.use("/api/v1/itineraries", itineraryRoutes);

// Adaptive trip replanning
app.use("/api/v1/replan", replanRoutes);

// Points of interest
app.use("/api/v1/pois", poiRoutes);

// Optimized multi-stop routing
app.use("/api/v1/routing", routeRoutes);

// Saved destinations
app.use("/api/v1/saved-places", savedPlaceRoutes);

// ==========================================
// MODULE 02 - AI CULTURAL TOUR GUIDE
// ==========================================

// AI tour guide chat
app.use("/api/v1/guide", guideRoutes);

// Cultural and heritage information
app.use("/api/v1/heritage", heritageRoutes);

// Sinhala-English translation
app.use("/api/v1/translation", translationRoutes);

// ==========================================
// MODULE 03 - WEATHER + HOTEL INTELLIGENCE
// ==========================================

// Weather information and alerts
app.use("/api/v1/weather", weatherRoutes);

// Visit Suitability Index
app.use("/api/v1/vsi", vsiRoutes);

// Hotel search and details
app.use("/api/v1/hotels", hotelRoutes);

// Personalized recommendations
app.use(
  "/api/v1/recommendations",
  recommendationRoutes
);

// Hotel reviews
app.use("/api/v1/reviews", reviewRoutes);

// ==========================================
// MODULE 04 - TOURIST SAFETY
// ==========================================

// Emergency contacts
app.use("/api/v1/emergency", emergencyRoutes);

// GPS route deviation analysis
app.use("/api/v1/navigation", navigationRoutes);

// Receipt OCR
app.use("/api/v1/receipts", receiptRoutes);

// Fraud anomaly alerts
app.use("/api/v1/fraud", fraudRoutes);

// Emergency SOS
app.use("/api/v1/sos", sosRoutes);

// ==========================================
// PAYMENTS + REFUNDS
// ==========================================

// Payment requests
app.use("/api/v1/payments", paymentRoutes);

// Refund requests
app.use("/api/v1/refunds", refundRoutes);

// ==========================================
// USER + NOTIFICATIONS
// ==========================================

// User account management
app.use("/api/v1/users", userRoutes);

// Notification management
app.use(
  "/api/v1/notifications",
  notificationRoutes
);

// ==========================================
// RESEARCH MODULE
// ==========================================

// Research experiments and model records
app.use("/api/v1/research", researchRoutes);

// ==========================================
// 404 - ENDPOINT NOT FOUND
// ==========================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Gocelone API error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
);

export default app;
