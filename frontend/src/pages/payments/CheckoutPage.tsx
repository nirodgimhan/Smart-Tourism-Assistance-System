
import { Link, useSearchParams } from "react-router-dom";
import { CreditCard, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get("hotel");

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          CHECKOUT
        </span>
        <h1>Secure Booking Checkout</h1>
      </div>

      <div className="panel pending-card">
        <CreditCard size={44} />

        <h2>Payment Gateway Not Connected</h2>

        <p>
          Secure payments will be enabled only after
          integrating a supported payment provider,
          validating booking availability and
          implementing server-side payment verification.
        </p>

        {hotelId && <p>Selected Hotel ID: {hotelId}</p>}

        <div className="button-row" style={{
          justifyContent: "center"
        }}>
          <ShieldCheck size={20} />
          <span>No payment has been initiated.</span>
        </div>

        <Link to="/hotels" className="btn btn-primary">
          Back to Hotels
        </Link>
      </div>
    </div>
  );
}
