
import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import { Save, UserRound } from "lucide-react";

import { api, getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfilePage() {
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState<"en" | "si">("en");
  const [budgetLkr, setBudgetLkr] = useState(10000);
  const [travelPace, setTravelPace] = useState<
    "relaxed" | "normal" | "fast"
  >("normal");

  const [interests, setInterests] = useState("");
  const [locationConsent, setLocationConsent] = useState(false);
  const [receiptConsent, setReceiptConsent] = useState(false);
  const [notificationConsent, setNotificationConsent] =
    useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data } = await api.get("/profile");

        if (!active) return;

        setName(data.user?.name || "");
        setLanguage(data.user?.language || "en");
        setCountry(data.profile?.country || "");
        setBudgetLkr(data.profile?.budgetLkr ?? 10000);
        setTravelPace(data.profile?.travelPace || "normal");
        setInterests(
          (data.profile?.interests || []).join(", ")
        );
        setLocationConsent(
          !!data.profile?.consent?.location
        );
        setReceiptConsent(
          !!data.profile?.consent?.receipt
        );
        setNotificationConsent(
          !!data.profile?.consent?.notifications
        );
      } catch (err) {
        if (active) setMessage(getErrorMessage(err));
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.patch("/profile", {
        name,
        language,
        country,
        budgetLkr,
        travelPace,
        interests: interests
          .split(",")
          .map(item => item.trim())
          .filter(Boolean),
        consent: {
          location: locationConsent,
          receipt: receiptConsent,
          notifications: notificationConsent
        }
      });

      await refresh();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-title">
        <span className="section-eyebrow">
          ACCOUNT SETTINGS
        </span>
        <h1>My Profile</h1>
        <p>Manage your personal travel preferences.</p>
      </div>

      <form className="panel profile-form" onSubmit={save}>
        <div className="profile-avatar">
          <UserRound size={30} />
        </div>

        <h2>Personal Information</h2>

        <div className="form-grid">
          <label>
            Full Name
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
            />
          </label>

          <label>
            Email Address
            <input
              value={user?.email || ""}
              disabled
            />
          </label>

          <label>
            Country
            <input
              value={country}
              onChange={e => setCountry(e.target.value)}
            />
          </label>

          <label>
            Preferred Language
            <select
              value={language}
              onChange={e =>
                setLanguage(e.target.value as "en" | "si")
              }
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
            </select>
          </label>

          <label>
            Travel Budget (LKR)
            <input
              type="number"
              min={0}
              value={budgetLkr}
              onChange={e =>
                setBudgetLkr(Number(e.target.value))
              }
            />
          </label>

          <label>
            Travel Pace
            <select
              value={travelPace}
              onChange={e =>
                setTravelPace(
                  e.target.value as
                    "relaxed" | "normal" | "fast"
                )
              }
            >
              <option value="relaxed">Relaxed</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </label>

          <label className="full-field">
            Interests (Separate with commas)
            <input
              value={interests}
              onChange={e => setInterests(e.target.value)}
              placeholder="Culture, nature, beaches"
            />
          </label>
        </div>

        <h2>Privacy Preferences</h2>

        <div className="consent-list">
          <label>
            <input
              type="checkbox"
              checked={locationConsent}
              onChange={e =>
                setLocationConsent(e.target.checked)
              }
            />
            Enable optional location features
          </label>

          <label>
            <input
              type="checkbox"
              checked={receiptConsent}
              onChange={e =>
                setReceiptConsent(e.target.checked)
              }
            />
            Allow receipt processing
          </label>

          <label>
            <input
              type="checkbox"
              checked={notificationConsent}
              onChange={e =>
                setNotificationConsent(e.target.checked)
              }
            />
            Receive notifications
          </label>
        </div>

        {message && <p role="status">{message}</p>}

        <button
          className="btn btn-primary"
          disabled={loading}
        >
          <Save size={18} />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
