
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  BookOpen,
  CloudSun,
  ShieldCheck,
  Navigation,
  MapPin,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "Smart Travel Planner",
    description:
      "Create trips based on your dates, interests, destinations and budget.",
    link: "/planner"
  },
  {
    icon: BookOpen,
    title: "AI Cultural Tour Guide",
    description:
      "Explore Sri Lanka's heritage with multilingual cultural assistance.",
    link: "/guide"
  },
  {
    icon: CloudSun,
    title: "Weather & Hotel Finder",
    description:
      "View weather information and discover accommodation options.",
    link: "/weather"
  },
  {
    icon: ShieldCheck,
    title: "Tourist Safety",
    description:
      "Access GPS navigation and developing safety research tools.",
    link: "/safety"
  }
];

export default function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-overlay" />

        <div className="container hero-content">
          <span className="hero-badge">
            <Sparkles size={16} />
            YOUR SMART SRI LANKAN TRAVEL COMPANION
          </span>

          <h1>
            Explore Sri Lanka.
            <br />
            <span>Experience More.</span>
          </h1>

          <p>
            Discover beautiful destinations, plan unforgettable
            journeys, explore cultural heritage and navigate
            the island with Gocelone.
          </p>

          <div className="hero-buttons">
            <Link to="/planner" className="btn btn-gold">
              Plan Your Journey
              <ArrowRight size={18} />
            </Link>

            <Link to="/explore" className="btn btn-glass">
              Explore Destinations
              <MapPin size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-eyebrow">
              INTELLIGENT TOURISM
            </span>

            <h2>Travel Smarter with Gocelone</h2>

            <p>
              One digital travel companion bringing
              together four tourism research modules.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  to={feature.link}
                  className="feature-card"
                >
                  <div className="feature-top">
                    <span className="feature-icon">
                      <Icon size={28} />
                    </span>

                    <span className="feature-number">
                      0{index + 1}
                    </span>
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>

                  <span className="feature-link">
                    Explore
                    <ArrowRight size={17} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section navigation-promo">
        <div className="container navigation-promo-inner">
          <div className="navigation-promo-icon">
            <Navigation size={52} />
          </div>

          <div>
            <span className="section-eyebrow light">
              LIVE GPS NAVIGATION
            </span>

            <h2>Find Your Way Around Sri Lanka</h2>

            <p>
              Enable your GPS location, choose a destination,
              and view the available road route with distance
              and estimated driving time.
            </p>

            <Link
              to="/maps/navigation"
              className="btn btn-gold"
            >
              Open GPS Map
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section final-cta">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-eyebrow">
              START EXPLORING
            </span>

            <h2>Your Adventure Begins Here</h2>

            <p>
              Create your account and start planning
              your journey across Sri Lanka.
            </p>

            <Link to="/signup" className="btn btn-primary">
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
