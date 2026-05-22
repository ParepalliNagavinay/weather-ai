import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBookmark, FaMapMarkerAlt, FaTemperatureHigh } from "react-icons/fa";
import { getFavoriteCities } from "../services/database";
import { getWeather } from "../services/weatherApi";

const formatDate = (value) => {
  if (!value) return "Saved recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [status, setStatus] = useState("loading");

  const loadTemperature = async (favorite) => {
    if (Number.isFinite(favorite.temperature)) return favorite;

    try {
      const weather = await getWeather(favorite.city);
      return {
        ...favorite,
        temperature: weather.current.main.temp,
      };
    } catch (error) {
      console.error(error);
      return favorite;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadFavorites = async () => {
      try {
        setStatus("loading");
        const cities = await getFavoriteCities();
        const citiesWithTemperature = await Promise.all(cities.map(loadTemperature));
        if (!cancelled) {
          setFavorites(citiesWithTemperature);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message === "AUTH_REQUIRED" ? "auth-required" : "error");
        }
      }
    };

    loadFavorites();
    window.addEventListener("focus", loadFavorites);
    document.addEventListener("visibilitychange", loadFavorites);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadFavorites);
      document.removeEventListener("visibilitychange", loadFavorites);
    };
  }, []);

  const content = {
    loading: <p className="favorites-muted">Loading saved cities...</p>,
    "auth-required": <p className="favorites-muted">Please login to continue.</p>,
    error: <p className="favorites-muted">Could not load saved cities. Please try again.</p>,
    ready:
      favorites.length > 0 ? (
        <div className="favorites-list">
          {favorites.map((favorite, index) => (
            <article className="favorites-item" key={favorite.id ?? `${favorite.city}-${index}`}>
              <span className="favorites-item__icon">
                <FaMapMarkerAlt />
              </span>
              <div>
                <h2>{favorite.city}</h2>
                <p>{formatDate(favorite.created_at)}</p>
              </div>
              <span className="favorites-item__temp">
                <FaTemperatureHigh />
                {Number.isFinite(favorite.temperature)
                  ? `${Math.round(favorite.temperature)}°C`
                  : "--°C"}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="favorites-muted">No saved cities yet.</p>
      ),
  }[status];

  return (
    <main className="favorites-page">
      <section className="favorites-panel">
        <Link to="/" className="favorites-home-link">
          Back to Weather
        </Link>
        <div className="favorites-header">
          <span className="favorites-avatar">
            <FaBookmark />
          </span>
          <div>
            <p className="favorites-kicker">Saved Places</p>
            <h1 className="favorites-title">Saved Cities</h1>
          </div>
        </div>
        {content}
      </section>
    </main>
  );
};

export default Favorites;
