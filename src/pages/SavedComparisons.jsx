import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCloudSun,
  FaExchangeAlt,
  FaHistory,
  FaTemperatureHigh,
  FaTint,
  FaWind,
} from "react-icons/fa";
import { getWeatherComparisons } from "../services/database";

const formatDate = (value) => {
  if (!value) return "Saved recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const formatTemp = (value) => (Number.isFinite(value) ? `${Math.round(value)}C` : "--C");

const SavedComparisons = () => {
  const [comparisons, setComparisons] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    const loadComparisons = async () => {
      try {
        setStatus("loading");
        const savedComparisons = await getWeatherComparisons();
        if (!cancelled) {
          setComparisons(savedComparisons);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message === "AUTH_REQUIRED" ? "auth-required" : "error");
        }
      }
    };

    loadComparisons();

    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackContent = {
    loading: "Loading saved comparisons...",
    "auth-required": "Please login to view saved comparisons.",
    error: "Could not load saved comparisons. Please check the Supabase table and try again.",
    ready: comparisons.length === 0 ? "No saved comparisons yet." : null,
  }[status];

  return (
    <main className="saved-comparisons-page">
      <section className="saved-comparisons-panel">
        <Link to="/comparison" className="comparison-back">Back to Comparison</Link>
        <header className="saved-comparisons-header">
          <span className="comparison-avatar">
            <FaHistory />
          </span>
          <div>
            <p className="comparison-kicker">Saved comparisons</p>
            <h1>Weather comparison history</h1>
            <p>Your saved city matchups from Supabase.</p>
          </div>
        </header>

        {fallbackContent && <p className="comparison-message">{fallbackContent}</p>}

        {comparisons.length > 0 && (
          <section className="saved-comparisons-grid" aria-label="Saved weather comparisons">
            {comparisons.map((item) => (
              <article className="saved-comparison-card" key={item.id}>
                <div className="saved-comparison-card__top">
                  <span><FaExchangeAlt /></span>
                  <time>{formatDate(item.created_at)}</time>
                </div>
                <div className="saved-comparison-card__cities">
                  <h2>{item.city_a}</h2>
                  <FaArrowRight />
                  <h2>{item.city_b}</h2>
                </div>
                <p>{item.summary}</p>
                <div className="saved-comparison-card__metrics">
                  <span><FaTemperatureHigh /> {formatTemp(item.temp_a)} / {formatTemp(item.temp_b)}</span>
                  <span><FaTint /> {item.humidity_a ?? "--"}% / {item.humidity_b ?? "--"}%</span>
                  <span><FaWind /> {item.wind_a ?? "--"} / {item.wind_b ?? "--"} km/h</span>
                  <span><FaCloudSun /> {item.condition_a ?? "--"} / {item.condition_b ?? "--"}</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
};

export default SavedComparisons;
