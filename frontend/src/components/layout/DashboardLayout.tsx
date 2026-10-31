
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  Route,
  Map,
  BookOpen,
  CloudSun,
  Hotel,
  ShieldCheck,
  CalendarDays,
  Bell
} from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/profile", icon: UserRound },
  { label: "Plan Trip", path: "/planner", icon: Route },
  { label: "My Trips", path: "/trips", icon: Map },
  { label: "AI Tour Guide", path: "/guide", icon: BookOpen },
  { label: "Weather", path: "/weather", icon: CloudSun },
  { label: "Hotels", path: "/hotels", icon: Hotel },
  { label: "GPS Navigation", path: "/maps/navigation", icon: Map },
  { label: "Safety", path: "/safety", icon: ShieldCheck },
  { label: "Bookings", path: "/bookings", icon: CalendarDays },
  { label: "Notifications", path: "/notifications", icon: Bell }
];

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Header />

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <h3>GOCELONE DASHBOARD</h3>

          <nav aria-label="Dashboard navigation">
            {menuItems.map(item => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebar-link active"
                      : "sidebar-link"
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
