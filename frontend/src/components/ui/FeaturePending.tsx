
import { Link } from "react-router-dom";
import {
  Construction,
  ArrowLeft,
  Clock3
} from "lucide-react";

interface FeaturePendingProps {
  title: string;
  description?: string;
}

export default function FeaturePending({
  title,
  description = "This feature is currently under development."
}: FeaturePendingProps) {
  return (
    <div className="container inner-page">
      <div className="panel pending-card">
        <div className="pending-icon">
          <Construction size={45} color="#167D85" />
        </div>

        <span className="section-eyebrow">
          GOCELONE RESEARCH PROJECT
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

        <div className="pending-status">
          <Clock3 size={18} />
          <span>Feature under development</span>
        </div>

        <p className="content-note">
          This module will be available after its
          frontend and backend functionality has been
          implemented and tested.
        </p>

        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
