import { FaExclamationTriangle, FaLeaf, FaSmog } from "react-icons/fa";

const pollutantRows = [
  ["PM2.5", "pm25", "ug/m3"],
  ["PM10", "pm10", "ug/m3"],
  ["O3", "o3", "ug/m3"],
  ["NO2", "no2", "ug/m3"],
  ["SO2", "so2", "ug/m3"],
  ["CO", "co", "ug/m3"],
];

const getAdvice = (level) => {
  if (level === "good") return "Air is clean. Outdoor plans look comfortable.";
  if (level === "moderate") return "Sensitive people should keep long outdoor activity lighter.";
  if (level === "sensitive") return "Children, seniors, and asthma-prone users should reduce exposure.";
  if (level === "unhealthy") return "Avoid long outdoor activity and prefer a mask near traffic.";
  if (level === "very-unhealthy" || level === "hazardous") {
    return "Stay indoors when possible and keep windows closed.";
  }
  return "AQI data is temporarily unavailable for this location.";
};

const formatPollutant = (value) => {
  if (!Number.isFinite(Number(value))) return "--";
  const number = Number(value);
  return number >= 100 ? Math.round(number) : number.toFixed(number >= 10 ? 1 : 2);
};

const AirQualityCard = ({ airQuality, city, darkMode }) => {
  const aqi = airQuality?.aqi;
  const score = Number.isFinite(aqi) ? Math.min(Math.max(aqi, 0), 300) : 0;
  const dialRotation = -120 + (score / 300) * 240;
  const level = airQuality?.level ?? "unknown";
  const label = airQuality?.label ?? "Unavailable";

  return (
    <section
      className={`aqi-card aqi-card--${level} ${darkMode ? "aqi-card--dark" : "aqi-card--light"}`}
      aria-label={`Air quality index for ${city}`}
    >
      <div className="aqi-card__header">
        <div>
          <h2>Air Quality Index</h2>
        </div>
        <div className="aqi-card__icon">
          {level === "good" ? <FaLeaf /> : <FaSmog />}
        </div>
      </div>

      <div className="aqi-card__body">
        <div className="aqi-card__score">
          <span className="aqi-card__location">AQI in {city}</span>
          <strong>{Number.isFinite(aqi) ? aqi : "--"}</strong>
          <span className="aqi-card__status">{label}</span>
        </div>

        <div className="aqi-card__dial" aria-hidden="true">
          <div className="aqi-card__dial-track" />
          <div className="aqi-card__needle" style={{ "--aqi-rotation": `${dialRotation}deg` }} />
          <span className="aqi-card__dial-dot" />
        </div>
      </div>

      <div className="aqi-card__pollutants">
        <span className="aqi-card__subhead">Pollutants</span>
        {pollutantRows.map(([labelText, key, unit]) => (
          <div className="aqi-card__pollutant" key={key}>
            <span>{labelText}</span>
            <strong>
              {formatPollutant(airQuality?.pollutants?.[key])} {unit}
            </strong>
          </div>
        ))}
      </div>

      <p className="aqi-card__advice">
        <FaExclamationTriangle />
        <span>{getAdvice(level)}</span>
      </p>
    </section>
  );
};

export default AirQualityCard;
