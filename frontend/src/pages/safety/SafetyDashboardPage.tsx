
import { Link } from "react-router-dom";

import {
  ShieldCheck,
  Navigation,
  Receipt,
  AlertTriangle,
  Siren,
  ArrowRight
} from "lucide-react";

const safetyFeatures = [
  {
    title: "GPS Navigation",
    description:
      "View road routes and track your location while navigating.",
    path: "/maps/navigation",
    icon: Navigation,
    status: "Routing API required"
  },
  {
    title: "AI Receipt Scanner",
    description:
      "Upload a receipt for OCR and price anomaly analysis.",
    path: "/safety/receipts",
    icon: Receipt,
    status: "OCR backend required"
  },
  {
    title: "Fraud Alerts",
    description:
      "Review potential pricing anomalies identified by the system.",
    path: "/safety/fraud",
    icon: AlertTriangle,
    status: "Fraud backend required"
  },
  {
    title: "SOS Information",
    description:
      "View your GPS coordinates and emergency guidance.",
    path: "/safety/sos",
    icon: Siren,
    status: "Emergency dispatch not enabled"
  }
];

export default function SafetyDashboardPage() {
  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          MODULE 04 · SMART TOURIST SAFETY
        </span>

        <h1>Tourist Safety Companion</h1>

        <p>
          Explore Gocelone's GPS, receipt analysis
          and tourist safety features.
        </p>
      </div>

      <div className="dashboard-cards">
        {safetyFeatures.map(feature => {
          const Icon = feature.icon;

          return (
            <Link
              to={feature.path}
              className="dashboard-module-card"
              key={feature.title}
            >
              <span className="dashboard-module-icon">
                <Icon size={28} />
              </span>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <small>{feature.status}</small>

              <span className="feature-link">
                Open Feature
                <ArrowRight size={17} />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="panel">
        <ShieldCheck size={30} />

        <h2>Travel Safety Notice</h2>

        <p>
          Gocelone is a research prototype.
          Its routing and AI research features
          are not a replacement for official
          emergency services or local safety guidance.
        </p>

        <Link
          to="/safety/sos"
          className="btn btn-outline"
        >
          <Siren size={18} />
          Emergency Information
        </Link>
      </div>
    </div>
  );
}
