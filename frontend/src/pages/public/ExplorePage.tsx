
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  MapPin,
  Search,
  Navigation,
  ArrowRight
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface Destination {
  _id: string;
  name: string;
  description?: string;
  category: string;
  district?: string;
  province?: string;
  images?: string[];
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export default function ExplorePage() {
  const [destinations, setDestinations] =
    useState<Destination[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDestinations() {
      try {
        const { data } = await api.get("/destinations", {
          params: { limit: 100 }
        });

        if (active) {
          setDestinations(
            Array.isArray(data.items) ? data.items : []
          );
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDestinations();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      "all",
      ...new Set(destinations.map(d => d.category))
    ],
    [destinations]
  );

  const filteredDestinations = useMemo(() => {
    return destinations.filter(destination => {
      const content = [
        destination.name,
        destination.description,
        destination.district,
        destination.province
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = content.includes(
        search.trim().toLowerCase()
      );

      const matchesCategory =
        category === "all" ||
        destination.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [destinations, search, category]);

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          DISCOVER SRI LANKA
        </span>

        <h1>Explore Destinations</h1>

        <p>
          Discover beautiful destinations around Sri Lanka,
          explore their details and navigate to your
          favorite places.
        </p>
      </div>

      <div className="panel form-grid">
        <label>
          Search Destinations

          <div className="explore-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sigiriya, Galle, Kandy..."
            />
          </div>
        </label>

        <label>
          Filter by Category

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(value => (
              <option key={value} value={value}>
                {value === "all"
                  ? "All Categories"
                  : value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="panel">
          Loading Sri Lankan destinations...
        </div>
      )}

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="explore-results-heading">
            <h2>Discover Places</h2>

            <span>
              {filteredDestinations.length} destinations
            </span>
          </div>

          <div className="destination-results">
            {filteredDestinations.map(destination => (
              <article
                className="destination-result-card"
                key={destination._id}
              >
                {destination.images?.[0] ? (
                  <img
                    src={destination.images[0]}
                    alt={destination.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="destination-image-empty">
                    <Compass size={45} />
                  </div>
                )}

                <div className="destination-result-body">
                  <span className="section-eyebrow">
                    {destination.category}
                  </span>

                  <h3>{destination.name}</h3>

                  <p>
                    <MapPin size={16} />
                    {" "}
                    {destination.district ||
                      "Sri Lanka"}
                  </p>

                  <p>
                    {destination.description ||
                      "More destination information will be added soon."}
                  </p>

                  <div className="button-row">
                    <Link
                      to={`/destinations/${destination._id}`}
                      className="btn btn-outline"
                    >
                      View Details
                      <ArrowRight size={17} />
                    </Link>

                    <Link
                      to={`/maps/navigation?destination=${destination._id}`}
                      className="btn btn-primary"
                    >
                      <Navigation size={17} />
                      Navigate
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredDestinations.length === 0 && (
            <div className="panel">
              <Compass size={30} />
              <h3>No Destinations Found</h3>

              <p>
                Try changing your search or category.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
