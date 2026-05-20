
const TravelSuggestion = ({ weather, darkMode, city, user, onAuthRequired }) => {
  const params = new URLSearchParams({
    city: weather.name || city,
    temp: Math.round(weather.main.temp).toString(),
    feels: Math.round(weather.main.feels_like).toString(),
    humidity: weather.main.humidity.toString(),
    wind: Math.round(weather.wind.speed * 3.6).toString(),
    condition: weather.weather[0].description,
  });

  const travelUrl = `/travel?${params.toString()}`;

  const handleClick = (e) => {
    if (!user) {
      e.preventDefault();
      onAuthRequired();
    }
  };

  return (
    <div className={`travel-card ${darkMode ? "travel-card--dark" : "travel-card--light"}`}>
      <a
        href={travelUrl}
        onClick={handleClick}
        className="travel-card__cta"
        aria-label={`Open travel suggestions for ${city}`}
      >
        Travel Suggestion
      </a>
    </div>
  );
};

export default TravelSuggestion;
