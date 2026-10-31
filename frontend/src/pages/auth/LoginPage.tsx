
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/login", {
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
            WELCOME BACK
          </span>

          <h1>Continue Your Sri Lankan Adventure.</h1>

          <p>
            Log in to access your trips, personal profile,
            AI guide and smart travel tools.
          </p>
        </div>

        <small>
          Gocelone · Smart Tourism Assistance
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

            <h2>Welcome Back</h2>
            <p>Sign in to your Gocelone account.</p>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-fields" onSubmit={submit}>
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

              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() => setShowPassword(value => !value)}
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              className="btn btn-primary btn-full"
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing In..." : "Sign In"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-bottom">
            Don't have an account?{" "}
            <Link to="/signup">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
