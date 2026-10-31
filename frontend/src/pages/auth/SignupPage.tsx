
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  ArrowRight
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must have at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        name,
        email,
        password
      });

      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-visual">
        <Link to="/" className="brand auth-brand">
          <Compass size={30} />
          gocelone.
        </Link>

        <div className="auth-visual-content">
          <span className="hero-badge">
            JOIN GOCELONE
          </span>

          <h1>Discover Your Next Adventure.</h1>

          <p>
            Create your account and start exploring
            Sri Lanka with smart travel assistance.
          </p>
        </div>

        <small>
          Gocelone · AI-Powered Tourism Research
        </small>
      </div>

      <div className="auth-content">
        <div className="auth-box">
          <Link to="/" className="back-home">
            ← Back to Home
          </Link>

          <div className="auth-heading">
            <span className="auth-small-icon">
              <Compass />
            </span>

            <h2>Create Your Account</h2>
            <p>Start your journey with Gocelone.</p>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-fields" onSubmit={submit}>
            <label>
              Full Name
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-bottom">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
