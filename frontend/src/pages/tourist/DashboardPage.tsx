
import { Link } from "react-router-dom";
import {
  Compass,
  Route,
  BookOpen,
  CloudSun,
  Hotel,
  ShieldCheck,
  MapPin,
  ArrowRight
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

const modules = [
  {
    title: "Smart Travel Planner",
    description: "Create and manage your travel plans.",
    path: "/planner",
    icon: Route
  },
  {
    title: "AI Tour Guide",
    description: "Discover Sri Lankan culture and heritage.",
    path: "/guide",
    icon: BookOpen
  },
  {
    title: "Weather Intelligence",
    description: "Explore destination weather information.",
    path: "/weather",
    icon: CloudSun
  },
  {
    title: "Hotel Finder",
    description: "Browse accommodation options.",
    path: "/hotels",
    icon: Hotel
  },
  {
    title: "GPS Navigation",
    description: "Find the road route to your destination.",
    path: "/maps/navigation",
    icon: MapPin
  },
  {
    title: "Tourist Safety",
    description: "Access available safety tools.",
    path: "/safety",
    icon: ShieldCheck
  }
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="dashboard-welcome">
        <div>
          <span className="section-eyebrow light">
            YOUR TRAVEL COMPANION
          </span>

          <h1>
            Welcome, {user?.name || "Traveler"}!
          </h1>

          <p>
            Where would you like to explore today?
          </p>

          <Link to="/planner" className="btn btn-gold">
            Plan a New Trip
            <ArrowRight size={18} />
          </Link>
        </div>

        <Compass size={100} strokeWidth={1} />
      </div>

      <div className="dashboard-section-title">
        <h2>Your Travel Tools</h2>

        <p>
          Access Gocelone's main tourism features.
        </p>
      </div>

      <div className="dashboard-cards">
        {modules.map(module => {
          const Icon = module.icon;

          return (
            <Link
              to={module.path}
              className="dashboard-module-card"
              key={module.title}
            >
              <span className="dashboard-module-icon">
                <Icon size={27} />
              </span>

              <h3>{module.title}</h3>
              <p>{module.description}</p>

              <span className="feature-link">
                Open Feature
                <ArrowRight size={17} />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="dashboard-help-card">
        <h3>Personalize Your Experience</h3>

        <p>
          Update your profile and travel preferences
          before planning your next journey.
        </p>

        <Link to="/profile" className="btn btn-primary">
          Edit My Profile
        </Link>
      </div>
    </div>
  );
}
