
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Hotel } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";

interface Booking {
  _id: string;
  hotelName?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalLkr?: number;
  createdAt?: string;
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings")
      .then(({ data }) => setBookings(data.items || []))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          MY RESERVATIONS
        </span>
        <h1>Booking History</h1>
        <p>View your saved hotel booking records.</p>
      </div>

      {loading && <p>Loading bookings...</p>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="panel">
          <Hotel size={30} />
          <h3>No bookings found</h3>
          <Link to="/hotels" className="btn btn-primary">
            Explore Hotels
          </Link>
        </div>
      )}

      {bookings.map(item => (
        <article className="panel" key={item._id}>
          <Hotel size={25} />
          <h3>{item.hotelName || "Hotel Booking"}</h3>

          <p>
            <CalendarDays size={16} />
            {" "}{new Date(item.checkIn).toLocaleDateString()}
            {" → "}
            {new Date(item.checkOut).toLocaleDateString()}
          </p>

          <p>
            <strong>Status:</strong> {item.status}
          </p>

          <p>
            <strong>Recorded Amount:</strong>{" "}
            {item.totalLkr == null
              ? "Unavailable"
              : `LKR ${item.totalLkr.toLocaleString()}`}
          </p>

          <small>Booking ID: {item._id}</small>
        </article>
      ))}

      <p className="content-note">
        A stored booking record does not establish
        a confirmed hotel reservation unless verified
        through the hotel provider.
      </p>
    </div>
  );
}
