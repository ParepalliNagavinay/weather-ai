import { Link, useSearchParams } from "react-router-dom";
import {
  FaCloudRain,
  FaCompass,
  FaMapMarkedAlt,
  FaMountain,
  FaRegClock,
  FaSun,
  FaUmbrella,
  FaWind,
} from "react-icons/fa";
import bgImage from "../assets/nature.jpg";

const getNumberParam = (params, key, fallback) => {
  const value = Number(params.get(key));
  return Number.isFinite(value) ? value : fallback;
};

const buildSuggestions = ({ temp, feels, humidity, wind, condition }) => {
  const atmosphere = condition.toLowerCase();
  const hasRain =
    atmosphere.includes("rain") ||
    atmosphere.includes("drizzle") ||
    atmosphere.includes("thunderstorm") ||
    atmosphere.includes("shower");
  const hasFog = atmosphere.includes("fog");
  const isHot = temp >= 32 || feels >= 35;
  const isCool = temp <= 18;
  const isHumid = humidity >= 70;
  const isWindy = wind >= 28;

  const timing = hasRain
    ? "Plan flexible indoor stops and travel between rain breaks."
    : isHot
      ? "Start early morning or after sunset to avoid the strongest heat."
      : hasFog
        ? "Keep sightseeing later in the day when visibility improves."
        : "The atmosphere looks friendly for city walks and outdoor sightseeing.";

  const transport = hasRain
    ? "Use cabs, metro, or covered transport for short hops between places."
    : isWindy
      ? "Choose sturdy transport and avoid open two-wheel rides on exposed roads."
      : "Walking, metro, and short rides should be comfortable for local exploring.";

  const packing = [
    hasRain ? "Carry an umbrella or light rain jacket." : "Carry sunglasses and water.",
    isHot ? "Wear breathable cotton clothes." : isCool ? "Add a light jacket." : "Dress in light layers.",
    isHumid ? "Keep a small towel and extra water handy." : "Comfortable shoes should be enough.",
  ];

  const activities = hasRain
    ? ["Museums", "Cafes", "Shopping streets with cover", "Indoor food spots"]
    : isHot
      ? ["Botanical gardens early", "Lakeside evenings", "Malls", "Shaded heritage walks"]
      : hasFog
        ? ["Late-morning viewpoints", "Cafes", "Markets", "Short city drives"]
        : ["Parks", "Viewpoints", "Street food areas", "Walking tours"];

  const alerts = [];

  if (hasRain) {
    alerts.push("Roads may be slow or slippery, so keep extra travel time.");
  }

  if (isHot) {
    alerts.push("Avoid long outdoor queues during afternoon hours.");
  }

  if (isWindy) {
    alerts.push("Skip exposed rooftop or high-viewpoint plans if gusts increase.");
  }

  if (alerts.length === 0) {
    alerts.push("No major weather concern. Keep your plan light and flexible.");
  }

  return { timing, transport, packing, activities, alerts };
};

const Travel = () => {
  const [params] = useSearchParams();
  const city = params.get("city") || "your location";
  const condition = params.get("condition") || "current weather";
  const temp = getNumberParam(params, "temp", 28);
  const feels = getNumberParam(params, "feels", temp);
  const humidity = getNumberParam(params, "humidity", 60);
  const wind = getNumberParam(params, "wind", 12);
  const suggestions = buildSuggestions({ temp, feels, humidity, wind, condition });

  return (
    <main className="detail-page detail-page--travel">
      {/* Background Orbs */}
      <div className="detail-page__bg-effects">
        <div className="detail-page__orb detail-page__orb--1" />
        <div className="detail-page__orb detail-page__orb--2" />
      </div>

      <div className="detail-page__content">
        {/* Header */}
        <header className="detail-page__header">
          <Link to="/" className="detail-page__back-btn">
            &larr; Back to weather
          </Link>

          <div className="detail-page__stats">
            <div className="detail-page__stat-badge">
              <FaSun />
              <span>{temp}&deg;C</span>
            </div>
            <div className="detail-page__stat-badge">
              <FaSun />
              <span>Feels {feels}&deg;C</span>
            </div>
            <div className="detail-page__stat-badge">
              <FaUmbrella />
              <span>Humidity {humidity}%</span>
            </div>
            <div className="detail-page__stat-badge">
              <FaWind />
              <span>Wind {wind} km/h</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="detail-page__hero">
          <p className="detail-page__subtitle">Travel Suggestions</p>
          <h1 className="detail-page__title">{city}</h1>
          <p className="detail-page__desc">
            Current atmosphere is {condition}. Here is a weather-aware travel plan for comfort, timing, and safer movement around the location.
          </p>
        </section>

        {/* Content Grid */}
        <div className="detail-page__grid">
          {/* Card 1: Best Travel Timing */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaRegClock className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Best Travel Timing</h2>
            </div>
            <p className="detail-page__card-text">{suggestions.timing}</p>
          </article>

          {/* Card 2: Getting Around */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaCompass className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Getting Around</h2>
            </div>
            <p className="detail-page__card-text">{suggestions.transport}</p>
          </article>

          {/* Card 3: Carry With You */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaUmbrella className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Carry With You</h2>
            </div>
            <ul className="detail-page__list">
              {suggestions.packing.map((item) => (
                <li key={item} className="detail-page__list-item">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Card 4: Recommended Plans */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaMapMarkedAlt className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Recommended Plans</h2>
            </div>
            <div className="detail-page__pills-grid">
              {suggestions.activities.map((activity) => (
                <div key={activity} className="detail-page__pill-item">
                  <FaMountain className="detail-page__pill-icon" />
                  <span className="detail-page__pill-text">{activity}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Bottom Alert Card */}
        <section className="detail-page__alert-card">
          <div className="detail-page__alert-header">
            {condition.toLowerCase().includes("rain") ? (
              <FaCloudRain className="detail-page__alert-icon" />
            ) : wind >= 28 ? (
              <FaWind className="detail-page__alert-icon" />
            ) : (
              <FaSun className="detail-page__alert-icon" />
            )}
            <h2 className="detail-page__alert-title">Weather Notes</h2>
          </div>
          <div className="detail-page__alert-grid">
            {suggestions.alerts.map((alert) => (
              <div key={alert} className="detail-page__alert-item">
                {alert}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Travel;
