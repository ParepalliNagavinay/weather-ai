import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaHeart,
  FaUsers,
  FaUserFriends,
  FaChild,
  FaChevronDown,
  FaChevronUp,
  FaLock,
} from "react-icons/fa";

const PhotographySuggestion = ({ weather, darkMode, city, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const params = new URLSearchParams({
    city: weather.name || city,
    temp: Math.round(weather.main.temp).toString(),
    feels: Math.round(weather.main.feels_like).toString(),
    humidity: weather.main.humidity.toString(),
    wind: Math.round(weather.wind.speed * 3.6).toString(),
    condition: weather.weather[0].description,
    ...(weather.sys?.sunset ? { sunset: weather.sys.sunset.toString() } : {}),
  });

  const getPhotoUrl = (mode) => {
    const newParams = new URLSearchParams(params);
    newParams.set("mode", mode);
    return `/photography?${newParams.toString()}`;
  };

  const modes = [
    { id: "single",  label: "Single Photoshoot",  icon: <FaUser /> },
    { id: "couple",  label: "Couple Photoshoot",  icon: <FaHeart /> },
    { id: "family",  label: "Family Photoshoot",  icon: <FaUsers /> },
    { id: "friends", label: "Friends Photoshoot", icon: <FaUserFriends /> },
    { id: "kids",    label: "Kids Photoshoot",    icon: <FaChild /> },
  ];

  return (
    <div
      ref={containerRef}
      className={`photo-card ${darkMode ? "photo-card--dark" : "photo-card--light"}`}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="photo-card__cta"
        aria-expanded={isOpen}
        aria-label="Toggle photoshoot modes dropdown"
      >
        Photography Suggestion
        {isOpen ? (
          <FaChevronUp style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }} />
        ) : (
          <FaChevronDown style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }} />
        )}
      </button>

      {isOpen && (
        <div className="photo-card__dropdown">
          {user ? (
            /* ── Logged in: show all modes ── */
            modes.map((mode) => (
              <a
                key={mode.id}
                href={getPhotoUrl(mode.id)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="photo-card__dropdown-item"
              >
                <span className="photo-card__dropdown-icon">{mode.icon}</span>
                <span>{mode.label}</span>
              </a>
            ))
          ) : (
            /* ── Not logged in: show login prompt ── */
            <div className="photo-card__login-prompt">
              <FaLock className="photo-card__login-icon" />
              <p className="photo-card__login-text">Please login to continue</p>
              <div className="photo-card__login-actions">
                <Link
                  to="/login"
                  className="photo-card__login-btn photo-card__login-btn--primary"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="photo-card__login-btn photo-card__login-btn--secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotographySuggestion;
