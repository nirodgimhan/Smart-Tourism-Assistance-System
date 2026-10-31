
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Hotel, MapPin } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";

interface HotelDetails {
  _id: string;
  name: string;
  description?: string;
  district?: string;
  address?: string;
  amenities?: string[];
  images?: string[];
  indicativePriceLkr?: number;
  providerUrl?: string;
  source?: string;
}

export default function HotelDetailsPage() {
  const { id } = useParams();
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    api.get(`/hotels/${id}`)
      .then(({ data }) => setHotel(data.hotel))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="container inner-page">
      {loading && <p>Loading hotel...</p>}
      {error && <div className="form-error">{error}</div>}

      {hotel && (
        <>
          <div className="page-title">
            <span className="section-eyebrow">
              HOTEL FINDER
            </span>
            <h1>{hotel.name}</h1>
            <p>
              <MapPin size={16} />
              {" "}{hotel.address || hotel.district || "Sri Lanka"}
            </p>
          </div>

          {hotel.images?.[0] && (
            <img
              className="destination-detail-hero"
              src={hotel.images[0]}
              alt={hotel.name}
            />
          )}

          <div className="panel">
            <Hotel size={28} />
            <h2>Hotel Information</h2>

            <p>
              {hotel.description ||
                "Description is not available."}
            </p>

            <h3>Amenities</h3>
            <p>
              {hotel.amenities?.join(" · ") ||
                "Not available"}
            </p>

            <h3>Indicative Price</h3>
            <p>
              {hotel.indicativePriceLkr == null
                ? "Price not available"
                : `LKR ${hotel.indicativePriceLkr.toLocaleString()}`}
            </p>

            <div className="button-row">
              {hotel.providerUrl && (
                <a
                  href={hotel.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Visit Hotel Provider
                </a>
              )}

              <Link
                to={`/bookings/new?hotel=${hotel._id}`}
                className="btn btn-primary"
              >
                Booking Details
              </Link>
            </div>
          </div>
        </>
      )}

      <p className="content-note">
        Prices are indicative. Bookings require verified
        hotel availability and backend integration.
      </p>
    </div>
  );
}
