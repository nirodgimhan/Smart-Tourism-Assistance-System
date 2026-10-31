
import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import { Link } from "react-router-dom";
import {
  Hotel,
  Search,
  MapPin
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface HotelRecord {
  _id: string;
  name: string;
  district?: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  indicativePriceLkr?: number;
}

export default function HotelSearchPage() {
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [district, setDistrict] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadHotels(
    filters: { district?: string; maxPrice?: string } = {}
  ) {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/hotels", {
        params: filters
      });

      setHotels(data.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHotels();
  }, []);

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    void loadHotels({
      ...(district.trim() && { district: district.trim() }),
      ...(maxPrice && { maxPrice })
    });
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          GOCELONE HOTEL FINDER
        </span>

        <h1>Find Your Perfect Stay</h1>

        <p>
          Search accommodation from the Gocelone database.
        </p>
      </div>

      <form className="panel form-grid" onSubmit={search}>
        <label>
          District
          <input
            value={district}
            onChange={e => setDistrict(e.target.value)}
            placeholder="Kandy, Galle, Colombo..."
          />
        </label>

        <label>
          Maximum Price (LKR)
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder="e.g. 15000"
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          <Search size={18} />
          {loading ? "Searching..." : "Search Hotels"}
        </button>
      </form>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div className="destination-results">
        {hotels.map(hotel => (
          <article
            className="destination-result-card"
            key={hotel._id}
          >
            {hotel.images?.[0] ? (
              <img
                src={hotel.images[0]}
                alt={hotel.name}
              />
            ) : (
              <div className="destination-image-empty">
                <Hotel size={45} />
              </div>
            )}

            <div className="destination-result-body">
              <h3>{hotel.name}</h3>

              <p>
                <MapPin size={16} />
                {" "}{hotel.district || "Sri Lanka"}
              </p>

              <p>
                {hotel.description ||
                  "Hotel description is not available."}
              </p>

              <p>
                <strong>Indicative Price:</strong>{" "}
                {hotel.indicativePriceLkr === undefined
                  ? "Not available"
                  : `LKR ${hotel.indicativePriceLkr}`}
              </p>

              <Link
                className="btn btn-primary"
                to={`/hotels/${hotel._id}`}
              >
                View Hotel
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && hotels.length === 0 && (
        <div className="panel">
          No hotels found in the connected dataset.
        </div>
      )}

      <p className="content-note">
        Prices and availability are not guaranteed live.
        The hotel backend API and dataset must be connected.
      </p>
    </div>
  );
}
