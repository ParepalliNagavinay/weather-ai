import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaBookmark,
  FaCloudRain,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaTemperatureHigh,
  FaTint,
  FaWind,
} from "react-icons/fa";
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

const formatTemp = (value) => (Number.isFinite(value) ? `${Math.round(value)}C` : "--C");

const getWeatherAlerts = (weather) => {
  if (!weather) return ["Live weather is still loading."];

  const alerts = [];
  const condition = weather.weather?.[0]?.description?.toLowerCase() ?? "";
  const temp = weather.main?.temp;
  const feels = weather.main?.feels_like;
  const humidity = weather.main?.humidity;
  const windKmh = Math.round((weather.wind?.speed ?? 0) * 3.6);

  if (condition.includes("rain") || condition.includes("drizzle")) {
    alerts.push("Rain risk: carry an umbrella and protect devices.");
  }
  if (condition.includes("thunder")) {
    alerts.push("Storm alert: avoid exposed outdoor areas.");
  }
  if (temp >= 35 || feels >= 38) {
    alerts.push("Heat alert: hydrate often and avoid peak afternoon travel.");
  }
  if (windKmh >= 30) {
    alerts.push("Wind alert: be careful with two-wheelers and loose items.");
  }
  if (humidity >= 80) {
    alerts.push("High humidity: expect a heavier, sticky outdoor feel.");
  }

  return alerts.length > 0 ? alerts : ["No major alert. Conditions look manageable."];
};

const getComparisonSummary = (first, second) => {
  if (!first?.weather || !second?.weather) return "Select two saved cities to compare live weather.";

  const tempDiff = Math.round(first.weather.main.temp - second.weather.main.temp);
  const windDiff = Math.round(first.weather.wind.speed * 3.6 - second.weather.wind.speed * 3.6);
  const humidityDiff = first.weather.main.humidity - second.weather.main.humidity;

  if (Math.abs(tempDiff) >= 3) {
    const warmer = tempDiff > 0 ? first.city : second.city;
    return `${warmer} is warmer by ${Math.abs(tempDiff)}C right now.`;
  }
  if (Math.abs(windDiff) >= 8) {
    const windier = windDiff > 0 ? first.city : second.city;
    return `${windier} has stronger wind by ${Math.abs(windDiff)} km/h.`;
  }
  if (Math.abs(humidityDiff) >= 12) {
    const humid = humidityDiff > 0 ? first.city : second.city;
    return `${humid} feels more humid by ${Math.abs(humidityDiff)}%.`;
  }

  return `${first.city} and ${second.city} have fairly similar weather right now.`;
};

const Favorites = () => {
  const [cities, setCities] = useState([]);
  const [status, setStatus] = useState("loading");
  const [compareIds, setCompareIds] = useState(["", ""]);

  useEffect(() => {
    let cancelled = false;

    const loadFavorites = async () => {
      try {
        setStatus("loading");
        const favorites = await getFavoriteCities();
        const enriched = await Promise.all(
          favorites.map(async (favorite) => {
            try {
              const weatherData = await getWeather(favorite.city);
              return {
                ...favorite,
                city: weatherData.current.name || favorite.city,
                weather: weatherData.current,
                airQuality: weatherData.airQuality,
                temperature: weatherData.current.main.temp,
              };
            } catch {
              return favorite;
            }
          })
        );

        if (!cancelled) {
          setCities(enriched);
          setCompareIds((current) => [
            current[0] || enriched[0]?.id || "",
            current[1] || enriched[1]?.id || enriched[0]?.id || "",
          ]);
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

  const selectedCities = useMemo(
    () => compareIds.map((id) => cities.find((city) => String(city.id) === String(id))).filter(Boolean),
    [cities, compareIds]
  );
  const firstCity = selectedCities[0];
  const secondCity = selectedCities[1];
  const allAlerts = cities.flatMap((city) =>
    getWeatherAlerts(city.weather).map((alert) => ({
      city: city.city,
      alert,
      id: `${city.id}-${alert}`,
    }))
  );

  const updateCompare = (index, value) => {
    setCompareIds((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const swapCompare = () => {
    setCompareIds(([first, second]) => [second, first]);
  };

  const dashboard =
    status === "ready" && cities.length > 0 ? (
      <>
        <section className="favorites-dashboard">
          <div className="favorites-compare">
            <div className="favorites-section-heading">
              <span><FaExchangeAlt /></span>
              <div>
                <p>Live comparison</p>
                <h2>{firstCity && secondCity ? `${firstCity.city} vs ${secondCity.city}` : "Compare saved cities"}</h2>
              </div>
            </div>

            <div className="favorites-compare__controls">
              {[0, 1].map((index) => (
                <label key={index}>
                  <span>{index === 0 ? "City A" : "City B"}</span>
                  <select value={compareIds[index]} onChange={(event) => updateCompare(index, event.target.value)}>
                    {cities.map((city) => (
                      <option value={city.id} key={city.id}>
                        {city.city}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <button type="button" onClick={swapCompare} aria-label="Swap compared cities">
                <FaExchangeAlt />
              </button>
            </div>

            <div className="favorites-compare__cards">
              {[firstCity, secondCity].map((city) => (
                <article className="favorites-compare-card" key={city?.id ?? "empty"}>
                  <span className="favorites-compare-card__label">{city?.weather?.weather?.[0]?.description ?? "Weather loading"}</span>
                  <h3>{city?.city ?? "Select city"}</h3>
                  <strong>{formatTemp(city?.weather?.main?.temp)}</strong>
                  <div className="favorites-compare-card__stats">
                    <span><FaTint /> {city?.weather?.main?.humidity ?? "--"}%</span>
                    <span><FaWind /> {city?.weather ? Math.round(city.weather.wind.speed * 3.6) : "--"} km/h</span>
                    <span><FaTemperatureHigh /> {formatTemp(city?.weather?.main?.feels_like)}</span>
                  </div>
                </article>
              ))}
            </div>

            <p className="favorites-compare__summary">
              {getComparisonSummary(firstCity, secondCity)}
            </p>
          </div>

          <aside className="favorites-alerts">
            <div className="favorites-section-heading">
              <span><FaBell /></span>
              <div>
                <p>Weather alerts</p>
                <h2>Saved city watchlist</h2>
              </div>
            </div>
            <div className="favorites-alerts__list">
              {allAlerts.slice(0, 7).map((item) => (
                <article className="favorites-alert" key={item.id}>
                  <FaExclamationTriangle />
                  <div>
                    <strong>{item.city}</strong>
                    <p>{item.alert}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="favorites-city-grid" aria-label="Saved city weather cards">
          {cities.map((favorite, index) => {
            const condition = favorite.weather?.weather?.[0]?.description ?? "Weather unavailable";
            const windKmh = favorite.weather ? Math.round(favorite.weather.wind.speed * 3.6) : null;

            return (
              <article className="favorites-city-card" key={favorite.id ?? `${favorite.city}-${index}`}>
                <div className="favorites-city-card__top">
                  <span className="favorites-city-card__icon">
                    <FaMapMarkerAlt />
                  </span>
                  <span>{formatDate(favorite.created_at)}</span>
                </div>
                <h2>{favorite.city}</h2>
                <p>{condition}</p>
                <div className="favorites-city-card__temp">
                  <FaTemperatureHigh />
                  <strong>{formatTemp(favorite.temperature)}</strong>
                </div>
                <div className="favorites-city-card__metrics">
                  <span><FaTint /> {favorite.weather?.main?.humidity ?? "--"}%</span>
                  <span><FaWind /> {windKmh ?? "--"} km/h</span>
                  <span><FaCloudRain /> {favorite.forecastRain ?? "Live"}</span>
                </div>
              </article>
            );
          })}
        </section>
      </>
    ) : null;

  const fallbackContent = {
    loading: <p className="favorites-muted">Loading saved cities dashboard...</p>,
    "auth-required": <p className="favorites-muted">Please login to save, compare, and monitor cities.</p>,
    error: <p className="favorites-muted">Could not load saved cities. Please try again.</p>,
    ready: cities.length === 0 ? <p className="favorites-muted">No saved cities yet. Save Bangalore and Hyderabad from the home page to compare them here.</p> : null,
  }[status];

  return (
    <main className="favorites-page">
      <section className="favorites-panel favorites-panel--dashboard">
        <Link to="/" className="favorites-home-link">
          Back to Weather
        </Link>
        <div className="favorites-header favorites-header--dashboard">
          <span className="favorites-avatar">
            <FaBookmark />
          </span>
          <div>
            <p className="favorites-kicker">Saved Cities Dashboard</p>
            <h1 className="favorites-title">Compare weather and alerts</h1>
            <p className="favorites-subtitle">Save cities, compare live conditions, and track alerts from one place.</p>
          </div>
        </div>
        {fallbackContent}
        {dashboard}
      </section>
    </main>
  );
};

export default Favorites;
