
import { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate
} from "react-router-dom";

import {
  Compass,
  Menu,
  X,
  LogOut,
  UserRound,
  LayoutDashboard
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

const links = [
  { label: "Home", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "AI Planner", to: "/planner" },
  { label: "Tour Guide", to: "/guide" },
  { label: "Weather", to: "/weather" },
  { label: "Hotels", to: "/hotels" },
  { label: "Safety", to: "/safety" },
  { label: "GPS Map", to: "/maps/navigation" }
];

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          to="/"
          className="brand"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-icon">
            <Compass size={25} />
          </span>
          <span>
            goce<span className="brand-accent">lone</span>
            <span className="brand-dot">.</span>
          </span>
        </Link>

        <nav className="desktop-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="header-user"
              >
                <UserRound size={17} />
                {user.name}
              </Link>

              <button
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">
                Login
              </Link>
              <Link
                to="/signup"
                className="btn btn-gold btn-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mobile-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <button onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
