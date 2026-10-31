
import { Link } from "react-router-dom";
import {
  Compass,
  MapPin,
  Mail,
  Code2,
  ArrowRight,
  Heart
} from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">

        {/* ABOUT GOCELONE */}
        <div className="footer-about">
          <Link to="/" className="brand footer-brand">
            <span className="brand-icon">
              <Compass size={24} />
            </span>

            <span>
              goce
              <span className="brand-accent">lone</span>
              <span className="brand-dot">.</span>
            </span>
          </Link>

          <p>
            Gocelone is an AI-Powered Smart Tourism
            Assistance System designed to help travelers
            explore Sri Lanka with intelligent planning,
            cultural information, weather insights,
            GPS navigation and safety assistance.
          </p>

          <span className="footer-research-id">
            Research Project · J26-IT-464
          </span>
        </div>

        {/* EXPLORE LINKS */}
        <div>
          <h4>Explore</h4>

          <Link to="/explore">
            Explore Destinations
          </Link>

          <Link to="/planner">
            Smart Travel Planner
          </Link>

          <Link to="/guide">
            AI Tour Guide
          </Link>

          <Link to="/maps/navigation">
            GPS Navigation
          </Link>

          <Link to="/trips">
            My Trips
          </Link>
        </div>

        {/* SERVICES LINKS */}
        <div>
          <h4>Our Services</h4>

          <Link to="/weather">
            Weather Intelligence
          </Link>

          <Link to="/hotels">
            Hotel Finder
          </Link>

          <Link to="/safety">
            Tourist Safety
          </Link>

          <Link to="/bookings">
            Hotel Bookings
          </Link>

          <Link to="/research">
            Research & Innovation
          </Link>
        </div>

        {/* CONTACT SECTION */}
        <div>
          <h4>Get in Touch</h4>

          <p className="footer-contact">
            <MapPin size={17} />
            Sri Lanka
          </p>

          <Link
            to="/contact"
            className="footer-contact"
          >
            <Mail size={17} />
            Contact Our Team
            <ArrowRight size={14} />
          </Link>

          <div className="footer-social">
            <Code2 size={20} />
            <span>Research & Technology</span>
          </div>

          <div className="footer-social">
            <Heart size={19} />
            <span>Made for Sri Lankan Tourism</span>
          </div>
        </div>

      </div>

      {/* COPYRIGHT SECTION */}
      <div className="container footer-bottom">
        <p>
          © {year} Gocelone. All rights reserved.
        </p>

        <div>
          <Link to="/privacy">
            Privacy Policy
          </Link>

          <Link to="/terms">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
