import { FaTemperatureHigh, FaTint, FaWind, FaEye, FaCompressAlt } from "react-icons/fa";
import { WiHumidity } from "react-icons/wi";

const getWeatherGradient = (description, temp) => {
  const desc = description.toLowerCase();
  if (desc.includes("rain") || desc.includes("drizzle")) return "weather-grad--rain";
  if (desc.includes("thunder")) return "weather-grad--storm";
  if (desc.includes("snow")) return "weather-grad--snow";
  if (desc.includes("cloud")) return "weather-grad--cloudy";
  if (desc.includes("fog") || desc.includes("mist")) return "weather-grad--fog";
  if (temp > 35) return "weather-grad--hot";
  if (temp < 15) return "weather-grad--cold";
  return "weather-grad--clear";
};

const WeatherCard = ({ weather, darkMode }) => {
  const gradClass = getWeatherGradient(
    weather.weather[0].description,
    weather.main.temp
  );

  const stats = [
    {
      icon: <FaTint />,
      label: "Humidity",
      value: `${weather.main.humidity}%`,
      color: "stat--blue",
    },
    {
      icon: <FaWind />,
      label: "Wind",
      value: `${Math.round(weather.wind.speed * 3.6)} km/h`,
      color: "stat--teal",
    },
    {
      icon: <FaTemperatureHigh />,
      label: "Feels Like",
      value: `${Math.round(weather.main.feels_like)}°C`,
      color: "stat--orange",
    },
  ];

  return (
    <div className={`weather-card ${gradClass} ${darkMode ? "weather-card--dark" : "weather-card--light"}`}>
      {/* Animated orbs */}
      <div className="weather-card__orb weather-card__orb--1" />
      <div className="weather-card__orb weather-card__orb--2" />

      {/* Icon */}
      <div className="weather-card__icon-wrap">
        <img
          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
          alt={weather.weather[0].description}
          className="weather-card__icon"
        />
        <div className="weather-card__icon-glow" />
      </div>

      {/* Main info */}
      <div className="weather-card__main">
        <div className="weather-card__temp">
          {Math.round(weather.main.temp)}
          <span className="weather-card__unit">°C</span>
        </div>
        <h2 className="weather-card__city">{weather.name}</h2>
        <p className="weather-card__desc">{weather.weather[0].description}</p>
      </div>

      {/* Divider */}
      <div className="weather-card__divider" />

      {/* Stats */}
      <div className="weather-card__stats">
        {stats.map((s) => (
          <div key={s.label} className={`stat-pill ${s.color}`}>
            <span className="stat-pill__icon">{s.icon}</span>
            <div className="stat-pill__info">
              <span className="stat-pill__label">{s.label}</span>
              <span className="stat-pill__value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherCard;
