
import { Routes, Route, Navigate } from "react-router-dom";

// ==========================================
// LAYOUTS
// ==========================================

import PublicLayout from "../components/layout/PublicLayout";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

// ==========================================
// PUBLIC PAGES
// ==========================================

import HomePage from "../pages/public/HomePage";
import ExplorePage from "../pages/public/ExplorePage";
import DestinationDetailsPage from "../pages/public/DestinationDetailsPage";

// ==========================================
// AUTHENTICATION
// ==========================================

import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";

// ==========================================
// TOURIST PAGES
// ==========================================

import DashboardPage from "../pages/tourist/DashboardPage";
import ProfilePage from "../pages/tourist/ProfilePage";

// ==========================================
// SMART TRAVEL PLANNER - UPDATED
// ==========================================

import CreateTripPage from "../pages/planner/CreateTripPage";
import MyTripsPage from "../pages/planner/MyTripsPage";
import TripDetailsPage from "../pages/planner/TripDetailsPage";

// ==========================================
// GPS NAVIGATION
// ==========================================

import RouteMapPage from "../pages/maps/RouteMapPage";

// ==========================================
// AI TOUR GUIDE
// ==========================================

import TourGuidePage from "../pages/guide/TourGuidePage";

// ==========================================
// WEATHER
// ==========================================

import WeatherPage from "../pages/weather/WeatherPage";
import VsiPage from "../pages/weather/VsiPage";
import WeatherAlertsPage from "../pages/weather/WeatherAlertsPage";

// ==========================================
// HOTELS
// ==========================================

import HotelSearchPage from "../pages/hotels/HotelSearchPage";
import HotelDetailsPage from "../pages/hotels/HotelDetailsPage";
import RecommendationsPage from "../pages/hotels/RecommendationsPage";

// ==========================================
// TOURIST SAFETY
// ==========================================

import SafetyDashboardPage from "../pages/safety/SafetyDashboardPage";
import ReceiptScannerPage from "../pages/safety/ReceiptScannerPage";
import FraudAlertsPage from "../pages/safety/FraudAlertsPage";
import SosPage from "../pages/safety/SosPage";

// ==========================================
// BOOKINGS & PAYMENTS
// ==========================================

import BookingPage from "../pages/payments/BookingPage";
import BookingHistoryPage from "../pages/payments/BookingHistoryPage";
import CheckoutPage from "../pages/payments/CheckoutPage";

// ==========================================
// ADMIN
// ==========================================

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";

// ==========================================
// RESEARCH
// ==========================================

import ResearchDashboardPage from "../pages/research/ResearchDashboardPage";

// ==========================================
// ADMIN RESOURCE TABLE
// ==========================================

type AdminResourceColumn = {
  key: string;
  label: string;
};

function AdminResourceTable({
  title,
  endpoint,
  columns
}: {
  title: string;
  endpoint: string;
  columns: AdminResourceColumn[];
}) {
  return (
    <main>
      <h1>{title}</h1>

      <p>Resource endpoint: {endpoint}</p>

      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody />
      </table>
    </main>
  );
}

// ==========================================
// FEATURE PENDING COMPONENT
// ==========================================

function Pending({
  title,
  description = "This feature is under development."
}: {
  title: string;
  description?: string;
}) {
  return (
    <main
      role="status"
      aria-labelledby="pending-title"
      className="feature-pending"
    >
      <h1 id="pending-title">{title}</h1>
      <p>{description}</p>
    </main>
  );
}

// ==========================================
// PENDING PUBLIC PAGES
// ==========================================

const publicPendingPages = [
  { path: "about", title: "About Gocelone" },
  { path: "features", title: "Platform Features" },
  { path: "research", title: "Research Overview" },
  { path: "contact", title: "Contact Our Team" },
  { path: "faq", title: "Frequently Asked Questions" },
  { path: "privacy", title: "Privacy Policy" },
  { path: "terms", title: "Terms of Service" }
];

// ==========================================
// PENDING PRIVATE PAGES
// ==========================================

const privatePendingPages = [
  { path: "settings", title: "Account Settings" },
  { path: "notifications", title: "Notifications" },
  { path: "saved-places", title: "Saved Places" },
  { path: "reviews", title: "My Reviews" },
  { path: "planner/results", title: "Trip Results" },
  { path: "planner/replan", title: "Trip Replanning" },
  { path: "guide/history", title: "Chat History" },
  { path: "guide/translation", title: "Translation" },
  { path: "safety/deviations", title: "Route Deviations" },
  { path: "safety/emergency", title: "Emergency Services" },
  { path: "payments/transactions", title: "Transactions" },
  { path: "payments/refunds", title: "Refund Status" }
];

// ==========================================
// PENDING RESEARCH PAGES
// ==========================================

const researchPendingPages = [
  "datasets",
  "experiments",
  "model-evaluation",
  "algorithm-comparison",
  "model-status"
];

// ==========================================
// MAIN APPLICATION ROUTES
// ==========================================

export default function AppRoutes() {
  return (
    <Routes>

      {/* ===================================
          PUBLIC WEBSITE
      =================================== */}

      <Route element={<PublicLayout />}>

        {/* HOME */}
        <Route
          path="/"
          element={<HomePage />}
        />

        {/* DESTINATIONS */}
        <Route
          path="/explore"
          element={<ExplorePage />}
        />

        <Route
          path="/destinations/:id"
          element={<DestinationDetailsPage />}
        />

        {/* ===================================
            AUTH
        =================================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        {/* ===================================
            GPS NAVIGATION
        =================================== */}

        <Route
          path="/maps/navigation"
          element={<RouteMapPage />}
        />

        {/* ===================================
            WEATHER MODULE
        =================================== */}

        <Route
          path="/weather"
          element={<WeatherPage />}
        />

        <Route
          path="/weather/vsi"
          element={<VsiPage />}
        />

        <Route
          path="/weather/alerts"
          element={<WeatherAlertsPage />}
        />

        {/* ===================================
            HOTEL MODULE
        =================================== */}

        <Route
          path="/hotels"
          element={<HotelSearchPage />}
        />

        <Route
          path="/hotels/recommendations"
          element={<RecommendationsPage />}
        />

        <Route
          path="/hotels/:id"
          element={<HotelDetailsPage />}
        />

        {/* ===================================
            SMART TRAVEL PLANNER - UPDATED
        =================================== */}

        {/* CREATE NEW TRIP */}
        <Route
          path="/planner"
          element={
            <ProtectedRoute>
              <CreateTripPage />
            </ProtectedRoute>
          }
        />

        {/* MY SAVED TRIPS - NEW */}
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <MyTripsPage />
            </ProtectedRoute>
          }
        />

        {/* COMPLETE TRIP DETAILS AND EDITOR */}
        <Route
          path="/trips/:id"
          element={
            <ProtectedRoute>
              <TripDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* ===================================
            AI CULTURAL TOUR GUIDE
        =================================== */}

        <Route
          path="/guide"
          element={
            <ProtectedRoute>
              <TourGuidePage />
            </ProtectedRoute>
          }
        />

        {/* ===================================
            TOURIST SAFETY
        =================================== */}

        <Route
          path="/safety"
          element={
            <ProtectedRoute>
              <SafetyDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/safety/receipts"
          element={
            <ProtectedRoute>
              <ReceiptScannerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/safety/fraud"
          element={
            <ProtectedRoute>
              <FraudAlertsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/safety/sos"
          element={<SosPage />}
        />

        {/* ===================================
            BOOKINGS
        =================================== */}

        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/new"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        {/* ===================================
            ADMIN DASHBOARD
        =================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ADMIN USERS */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminResourceTable
                title="Manage Users"
                endpoint="/admin/users"
                columns={[
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "role", label: "Role" },
                  { key: "isActive", label: "Active" }
                ]}
              />
            </ProtectedRoute>
          }
        />

        {/* ADMIN DESTINATIONS */}
        <Route
          path="/admin/destinations"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminResourceTable
                title="Manage Destinations"
                endpoint="/admin/destinations"
                columns={[
                  { key: "name", label: "Name" },
                  { key: "district", label: "District" },
                  { key: "category", label: "Category" },
                  { key: "verified", label: "Verified" }
                ]}
              />
            </ProtectedRoute>
          }
        />

        {/* ADMIN HOTELS */}
        <Route
          path="/admin/hotels"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminResourceTable
                title="Manage Hotels"
                endpoint="/admin/hotels"
                columns={[
                  { key: "name", label: "Hotel" },
                  { key: "district", label: "District" },
                  {
                    key: "indicativePriceLkr",
                    label: "Price (LKR)"
                  }
                ]}
              />
            </ProtectedRoute>
          }
        />

        {/* ADMIN BOOKINGS */}
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminResourceTable
                title="Manage Bookings"
                endpoint="/admin/bookings"
                columns={[
                  { key: "_id", label: "Booking ID" },
                  { key: "status", label: "Status" },
                  { key: "totalLkr", label: "Total" }
                ]}
              />
            </ProtectedRoute>
          }
        />

        {/* ADMIN SETTINGS */}
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Pending title="Admin Settings" />
            </ProtectedRoute>
          }
        />

        {/* ===================================
            RESEARCH MODULE
        =================================== */}

        <Route
          path="/research/dashboard"
          element={
            <ProtectedRoute
              roles={["admin", "researcher"]}
            >
              <ResearchDashboardPage />
            </ProtectedRoute>
          }
        />

        {researchPendingPages.map(path => (
          <Route
            key={path}
            path={`/research/${path}`}
            element={
              <ProtectedRoute
                roles={["admin", "researcher"]}
              >
                <Pending
                  title={`Research: ${path}`}
                />
              </ProtectedRoute>
            }
          />
        ))}

        {/* ===================================
            OTHER PUBLIC PAGES
        =================================== */}

        {publicPendingPages.map(page => (
          <Route
            key={page.path}
            path={`/${page.path}`}
            element={
              <Pending title={page.title} />
            }
          />
        ))}

        {/* ===================================
            OTHER PRIVATE PAGES
        =================================== */}

        {privatePendingPages.map(page => (
          <Route
            key={page.path}
            path={`/${page.path}`}
            element={
              <ProtectedRoute>
                <Pending title={page.title} />
              </ProtectedRoute>
            }
          />
        ))}
      </Route>

      {/* ===================================
          TOURIST DASHBOARD LAYOUT
      =================================== */}

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

      </Route>

      {/* ===================================
          404 PAGE
      =================================== */}

      <Route
        path="/404"
        element={
          <Pending
            title="404 — Page Not Found"
            description="The page you requested does not exist."
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/404"
            replace
          />
        }
      />

    </Routes>
  );
}
