import { useState } from "react";
import {
  FaBiking,
  FaBolt,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCloudRain,
  FaDirections,
  FaRoad,
  FaRoute,
  FaShippingFast,
  FaSun,
  FaTruck,
  FaWalking,
} from "react-icons/fa";
import { getSmartRouteWeather } from "../services/weatherApi";
import { getAudienceAdvice, getORSRoute, profileForAudience } from "../services/orsApi";

const hazardMeta = {
  clear: { label: "Clear", icon: <FaSun />, color: "#22c55e" },
  rain: { label: "Rain zone", icon: <FaCloudRain />, color: "#38bdf8" },
  storm: { label: "Storm area", icon: <FaBolt />, color: "#a78bfa" },
  hot: { label: "Hot region", icon: <FaSun />, color: "#fb923c" },
  wind: { label: "Windy stretch", icon: <FaRoute />, color: "#94a3b8" },
};

const audienceConfig = {
  bikers: {
    label: "Bikers",
    icon: <FaBiking />,
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    glow: "rgba(249,115,22,0.35)",
  },
  travelers: {
    label: "Travelers",
    icon: <FaTruck />,
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
    glow: "rgba(20,184,166,0.35)",
  },
  logistics: {
    label: "Logistics",
    icon: <FaShippingFast />,
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    glow: "rgba(99,102,241,0.35)",
  },
};

const defaultZones = [
  { label: "Bangalore", progress: 0, hazard: "clear", temp: 32 },
  { label: "Route zone 1", progress: 0.25, hazard: "rain", temp: 29 },
  { label: "Route zone 2", progress: 0.5, hazard: "clear", temp: 31 },
  { label: "Route zone 3", progress: 0.75, hazard: "hot", temp: 36 },
  { label: "Hyderabad", progress: 1, hazard: "storm", temp: 34 },
];

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getRouteSummary = (route) => {
  if (!route) return "Enter two cities, then choose Bikers, Travelers, or Logistics.";
  if (route.hazards.storm > 0) return "Storm cells found. Delay or choose a safer travel window.";
  if (route.hazards.rain > 1) return "Multiple rain zones. Carry rain gear and add buffer time.";
  if (route.hazards.hot > 1) return "Heat risk is high. Prefer early morning or evening travel.";
  if (route.hazards.wind > 1) return "Windy sections may affect bikers and open-load logistics.";
  return "Route weather looks manageable with normal travel precautions.";
};

const fallbackMapPoints = [
  { x: 13, y: 78 },
  { x: 24, y: 65 },
  { x: 38, y: 68 },
  { x: 52, y: 45 },
  { x: 67, y: 42 },
  { x: 84, y: 22 },
];

const SmartRouteWeather = ({ darkMode }) => {
  const [origin, setOrigin] = useState("Bangalore");
  const [destination, setDestination] = useState("Hyderabad");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeAudience, setActiveAudience] = useState(null);
  const [audienceRoute, setAudienceRoute] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceError, setAudienceError] = useState("");
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  const fetchWeatherRoute = async () => {
    const data = await getSmartRouteWeather(origin, destination);
    setRoute(data);
    return data;
  };

  const scanRoute = async (event) => {
    event.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    setLoading(true);
    setError("");
    setActiveAudience(null);
    setAudienceRoute(null);
    setActiveRouteIndex(0);

    try {
      await fetchWeatherRoute();
    } catch (routeError) {
      setRoute(null);
      setError(
        routeError.code === "INVALID_CITY"
          ? "Enter valid city names for both route points."
          : "Route weather is unavailable right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceClick = async (key) => {
    if (!origin.trim() || !destination.trim()) return;

    if (activeAudience === key) {
      setActiveAudience(null);
      setAudienceRoute(null);
      setActiveRouteIndex(0);
      return;
    }

    setActiveAudience(key);
    setAudienceError("");
    setAudienceRoute(null);
    setActiveRouteIndex(0);
    setAudienceLoading(true);

    try {
      const profile = profileForAudience[key];
      const [weatherData, orsData] = await Promise.all([
        route ? Promise.resolve(route) : fetchWeatherRoute(),
        getORSRoute(origin, destination, profile),
      ]);
      setRoute(weatherData);
      setAudienceRoute(orsData);
    } catch (routeError) {
      setAudienceError(
        routeError.message?.includes("API key")
          ? "OpenRouteService API key is missing. Add VITE_ORS_API_KEY in .env."
          : "ORS routing unavailable for these cities."
      );
      setAudienceRoute(null);
    } finally {
      setAudienceLoading(false);
    }
  };

  const displayZones = route?.zones ?? defaultZones;
  const routeOptions = audienceRoute?.routes ?? [];
  const selectedRoute = routeOptions[activeRouteIndex] ?? null;
  const selectedRoutePoints = selectedRoute?.routePoints?.length
    ? selectedRoute.routePoints
    : fallbackMapPoints;
  const selectedRoutePath = selectedRoutePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const advice = activeAudience
    ? getAudienceAdvice(activeAudience, route?.hazards, selectedRoute)
    : [];

  return (
    <section className={`smart-route ${darkMode ? "smart-route--dark" : "smart-route--light"}`}>
      <div className="smart-route__header">
        <div>
          <h2>Route Weather Scan</h2>
        </div>
        <FaRoute className="smart-route__header-icon" />
      </div>

      <form className="smart-route__form" onSubmit={scanRoute}>
        <label>
          <span>From</span>
          <input
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            placeholder="Bangalore"
          />
        </label>
        <span className="smart-route__arrow">to</span>
        <label>
          <span>To</span>
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Hyderabad"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Scanning..." : "Scan"}
        </button>
      </form>

      {error && <p className="smart-route__error">{error}</p>}

      <div className="smart-route__audience" aria-label="Route audience type">
        {Object.entries(audienceConfig).map(([key, cfg]) => (
          <button
            key={key}
            className={`smart-route__audience-btn smart-route__audience-btn--${key}${activeAudience === key ? " active" : ""}`}
            style={{
              "--btn-gradient": cfg.gradient,
              "--btn-glow": cfg.glow,
              "--btn-color": cfg.color,
            }}
            onClick={() => handleAudienceClick(key)}
            type="button"
            aria-pressed={activeAudience === key}
          >
            <span className="audience-btn__icon">{cfg.icon}</span>
            <span>{cfg.label}</span>
            <span className="audience-btn__arrow">
              {activeAudience === key ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </button>
        ))}
      </div>

      <div className="smart-route__map" aria-label="Route weather zones">
        <div className="smart-route__route-line" />
        {displayZones.map((zone) => {
          const meta = hazardMeta[zone.hazard] ?? hazardMeta.clear;
          const isRouteZone = zone.label.startsWith("Route zone");
          const zoneNumber = Number(zone.label.replace("Route zone ", "")) - 1;
          const isActive = activeAudience && isRouteZone && activeRouteIndex === zoneNumber;

          return (
            <button
              className={`smart-route__pin smart-route__pin--${zone.hazard}${isRouteZone ? " smart-route__pin--clickable" : ""}${isActive ? " smart-route__pin--active" : ""}`}
              style={{
                "--pin-left": `${8 + zone.progress * 84}%`,
                "--pin-top": `${54 - zone.progress * 14}%`,
              }}
              key={`${zone.label}-${zone.progress}`}
              title={`${zone.label}: ${meta.label}`}
              onClick={isRouteZone && activeAudience ? () => setActiveRouteIndex(zoneNumber) : undefined}
              type="button"
              aria-pressed={isRouteZone && activeAudience ? isActive : undefined}
              disabled={!isRouteZone || !activeAudience}
            >
              <span>{meta.icon}</span>
              {isRouteZone && <span className="smart-route__pin-badge">{zoneNumber + 1}</span>}
            </button>
          );
        })}
      </div>

      <div className="smart-route__legend">
        {["clear", "rain", "storm", "hot"].map((hazard) => (
          <span key={hazard} className={`smart-route__legend-item smart-route__legend-item--${hazard}`}>
            {hazardMeta[hazard].icon}
            {hazardMeta[hazard].label}
          </span>
        ))}
      </div>

      <div className="smart-route__timing">
        <span>Best travel timing</span>
        <strong>{route?.timing?.window ?? "Scan route first"}</strong>
        <p>{route?.timing?.reason ?? getRouteSummary(route)}</p>
      </div>

      {activeAudience && (
        <div className={`smart-route__audience-panel smart-route__audience-panel--${activeAudience}`}>
          <div className="audience-panel__header">
            <span className="audience-panel__icon">{audienceConfig[activeAudience].icon}</span>
            <strong>{audienceConfig[activeAudience].label} route zones</strong>
          </div>

          {audienceLoading && (
            <div className="audience-panel__loading">
              <div className="ors-spinner" />
              <span>Fetching OpenRouteService route data...</span>
            </div>
          )}

          {audienceError && !audienceLoading && (
            <p className="audience-panel__error">{audienceError}</p>
          )}

          {!audienceLoading && routeOptions.length > 0 && (
            <>
              {selectedRoute && (
                <div className="maps-route-ui">
                  <div className="maps-route-list" role="tablist" aria-label="Route zones">
                    {routeOptions.map((option, index) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`maps-route-card${activeRouteIndex === index ? " maps-route-card--active" : ""}`}
                        onClick={() => setActiveRouteIndex(index)}
                        role="tab"
                        aria-selected={activeRouteIndex === index}
                      >
                        <span className="maps-route-card__label">{option.label}</span>
                        <strong>{option.type}</strong>
                        <span className="maps-route-card__metrics">
                          <b>{formatDuration(option.durationMin)}</b>
                          <span>{option.distanceKm} km</span>
                        </span>
                        {option.majorRoads?.length > 0 && (
                          <small>via {option.majorRoads.join(", ")}</small>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="maps-route-map" aria-label="Google Maps style route preview">
                    <div className="maps-route-map__toolbar">
                      <span>{audienceRoute.origin}</span>
                      <FaDirections />
                      <span>{audienceRoute.destination}</span>
                    </div>

                    <svg className="maps-route-map__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline className="maps-route-map__shadow" points={selectedRoutePath} />
                      <polyline className="maps-route-map__path" points={selectedRoutePath} />
                    </svg>

                    <span
                      className="maps-route-map__marker maps-route-map__marker--origin"
                      style={{
                        "--marker-x": `${selectedRoutePoints[0]?.x ?? 13}%`,
                        "--marker-y": `${selectedRoutePoints[0]?.y ?? 78}%`,
                      }}
                    >
                      <span>A</span>
                    </span>
                    <span
                      className="maps-route-map__marker maps-route-map__marker--destination"
                      style={{
                        "--marker-x": `${selectedRoutePoints.at(-1)?.x ?? 84}%`,
                        "--marker-y": `${selectedRoutePoints.at(-1)?.y ?? 22}%`,
                      }}
                    >
                      <span>B</span>
                    </span>

                    <div className="maps-route-map__summary">
                      <span>
                        <FaClock /> {formatDuration(selectedRoute.durationMin)}
                      </span>
                      <span>
                        <FaRoad /> {selectedRoute.distanceKm} km
                      </span>
                    </div>

                    <div className="maps-route-map__controls" aria-hidden="true">
                      <span>+</span>
                      <span>-</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoute && (
                <div className="ors-route-info">
                  {selectedRoute.steps.length > 0 && (
                    <div className="ors-steps">
                      <p className="ors-steps__title">
                        <FaWalking /> Turn-by-turn directions
                      </p>
                      <ol className="ors-steps__list">
                        {selectedRoute.steps.map((step, index) => (
                          <li key={`${step.instruction}-${index}`} className="ors-step">
                            <span className="ors-step__num">{index + 1}</span>
                            <span className="ors-step__text">{step.instruction}</span>
                            <span className="ors-step__meta">
                              {step.distanceKm} km | {formatDuration(step.durationMin)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {advice.length > 0 && (
                <ul className="audience-panel__advice">
                  {advice.map((tip, index) => (
                    <li key={`${tip}-${index}`} className="audience-panel__tip">{tip}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <div className="smart-route__zones" aria-label="Weather checkpoints">
        {displayZones.map((zone) => {
          const meta = hazardMeta[zone.hazard] ?? hazardMeta.clear;
          return (
            <article key={`${zone.label}-zone`} className={`smart-route-zone smart-route-zone--${zone.hazard}`}>
              <span>{meta.icon}</span>
              <div className="smart-route-zone__content">
                <strong>{zone.label}</strong>
                <p>
                  {meta.label}
                  {Number.isFinite(zone.temp) ? `, ${Math.round(zone.temp)}C` : ""}
                </p>
                <div className="smart-route-zone__detail">
                  {zone.humidity != null && <span className="zone-stat">Humidity: {zone.humidity}%</span>}
                  {zone.wind != null && <span className="zone-stat">Wind: {zone.wind?.toFixed(1)} km/h</span>}
                  {zone.feels != null && <span className="zone-stat">Feels: {Math.round(zone.feels)}C</span>}
                  {zone.condition && <span className="zone-stat">{zone.condition}</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default SmartRouteWeather;
