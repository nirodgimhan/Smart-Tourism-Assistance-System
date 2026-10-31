
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  MapPin,
  Hotel,
  CalendarDays,
  ShieldCheck,
  Settings
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface AdminStats {
  users: number;
  destinations: number;
  hotels: number;
  bookings: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats")
      .then(({ data }) => setStats(data.stats))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: "Registered Users",
      value: stats?.users,
      icon: Users
    },
    {
      title: "Destinations",
      value: stats?.destinations,
      icon: MapPin
    },
    {
      title: "Hotels",
      value: stats?.hotels,
      icon: Hotel
    },
    {
      title: "Bookings",
      value: stats?.bookings,
      icon: CalendarDays
    }
  ];

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          GOCELONE ADMIN
        </span>
        <h1>Administration Dashboard</h1>
        <p>Manage Gocelone tourism platform data.</p>
      </div>

      {loading && <p>Loading administrator statistics...</p>}

      {error && (
        <div className="form-error">{error}</div>
      )}

      <div className="dashboard-cards">
        {cards.map(card => {
          const Icon = card.icon;

          return (
            <article
              className="dashboard-module-card"
              key={card.title}
            >
              <Icon size={27} />
              <h3>{card.title}</h3>
              <strong style={{ fontSize: 30 }}>
                {card.value ?? "—"}
              </strong>
            </article>
          );
        })}
      </div>

      <div className="dashboard-cards">
        <Link
          className="dashboard-module-card"
          to="/admin/users"
        >
          <Users />
          <h3>Manage Users</h3>
          <p>Review user accounts.</p>
        </Link>

        <Link
          className="dashboard-module-card"
          to="/admin/destinations"
        >
          <MapPin />
          <h3>Manage Destinations</h3>
          <p>Review destination data.</p>
        </Link>

        <Link
          className="dashboard-module-card"
          to="/admin/hotels"
        >
          <Hotel />
          <h3>Manage Hotels</h3>
          <p>Review accommodation records.</p>
        </Link>

        <Link
          className="dashboard-module-card"
          to="/admin/settings"
        >
          <Settings />
          <h3>Admin Settings</h3>
          <p>Platform administration settings.</p>
        </Link>
      </div>

      <div className="panel">
        <ShieldCheck />
        <p>
          Every administrator operation must also be
          authorized by the backend.
        </p>
      </div>
    </div>
  );
}
