const ForecastCard = ({ forecast, darkMode }) => {
  const daily = [];
  const seen = new Set();

  for (const item of forecast) {
    const dateKey = item.dt_txt.split(" ")[0];
    if (!seen.has(dateKey)) {
      seen.add(dateKey);
      daily.push(item);
    }
    if (daily.length >= 7) break;
  }

  const getBarWidth = (temp, min = 20, max = 45) => {
    const pct = Math.min(Math.max(((temp - min) / (max - min)) * 100, 8), 100);
    return `${pct}%`;
  };

  return (
    <div className={`forecast-card ${darkMode ? "forecast-card--dark" : "forecast-card--light"}`}>
      <div className="forecast-card__header">
        <h2 className="forecast-card__title">7-Day Forecast</h2>
        <span className="forecast-card__badge">Daily</span>
      </div>

      <div className="forecast-card__list">
        {daily.map((day, index) => {
          const date = new Date(day.dt_txt);
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          const hi = Math.round(day.main.temp_max);
          const lo = Math.round(day.main.temp_min);
          const isToday = index === 0;

          return (
            <div
              key={index}
              className={`forecast-row ${isToday ? "forecast-row--today" : ""}`}
              style={{ "--delay": `${index * 60}ms` }}
            >
              {/* Day */}
              <div className="forecast-row__day">
                <span className="forecast-row__dayname">
                  {isToday ? "Today" : dayName}
                </span>
              </div>

              {/* Icon */}
              <div className="forecast-row__condition">
                <img
                  src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                  alt={day.weather[0].description}
                  className="forecast-row__icon"
                />
              </div>

              {/* Temp text */}
              <div className="forecast-row__temp">
                {hi}°C / {lo}°C
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastCard;
