
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Hotel } from "lucide-react";

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get("hotel") || "";

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [showSummary, setShowSummary] = useState(false);

  function review(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (checkOut <= checkIn) return;
    setShowSummary(true);
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          HOTEL BOOKING
        </span>
        <h1>Plan Your Hotel Stay</h1>
        <p>
          Review your preferred booking details.
        </p>
      </div>

      <form className="panel form-grid" onSubmit={review}>
        <label className="full-field">
          Hotel ID
          <input value={hotelId} readOnly />
        </label>

        <label>
          Check-in Date
          <input
            type="date"
            value={checkIn}
            onChange={e => {
              setCheckIn(e.target.value);
              setShowSummary(false);
            }}
            required
          />
        </label>

        <label>
          Check-out Date
          <input
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={e => {
              setCheckOut(e.target.value);
              setShowSummary(false);
            }}
            required
          />
        </label>

        <label>
          Number of Guests
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
          />
        </label>

        <button className="btn btn-primary">
          <CalendarDays size={18} />
          Review Booking Details
        </button>
      </form>

      {showSummary && (
        <div className="panel">
          <Hotel size={25} />
          <h2>Booking Summary</h2>
          <p>Check-in: {checkIn}</p>
          <p>Check-out: {checkOut}</p>
          <p>Guests: {guests}</p>
          <p>
            Price and availability must be verified
            before any reservation can be confirmed.
          </p>

          <Link
            to={`/checkout?hotel=${encodeURIComponent(hotelId)}`}
            className="btn btn-outline"
          >
            View Checkout Status
          </Link>
        </div>
      )}

      <p className="content-note">
        This is a booking request preview only.
        Nothing is reserved or charged.
      </p>
    </div>
  );
}
