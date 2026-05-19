import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="profile-page">
        <section className="profile-panel">
          <p className="profile-muted">Loading profile...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-panel">
          <Link to="/" className="profile-home-link">
            Back to Weather
          </Link>
          <h1 className="profile-title">Profile</h1>
          <p className="profile-muted">Please log in to view profile details.</p>
        </section>
      </main>
    );
  }

  const details = [
    ["Email", user.email],
    ["User ID", user.id],
    ["Account created", formatDate(user.created_at)],
    ["Last signed in", formatDate(user.last_sign_in_at)],
    ["Email confirmed", formatDate(user.email_confirmed_at)],
    ["Authentication provider", user.app_metadata?.provider ?? "email"],
  ];

  return (
    <main className="profile-page">
      <section className="profile-panel">
        <Link to="/" className="profile-home-link">
          Back to Weather
        </Link>

        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {user.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="profile-kicker">User Profile</p>
            <h1 className="profile-title">{user.email}</h1>
          </div>
        </div>

        <dl className="profile-details">
          {details.map(([label, value]) => (
            <div className="profile-detail" key={label}>
              <dt>{label}</dt>
              <dd>{value || "Not available"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
};

export default Profile;
