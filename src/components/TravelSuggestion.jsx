const TravelSuggestion = ({ weather, darkMode, city }) => {
  const params = new URLSearchParams({
    city: weather.name || city,
    temp: Math.round(weather.main.temp).toString(),
    feels: Math.round(weather.main.feels_like).toString(),
    humidity: weather.main.humidity.toString(),
    wind: Math.round(weather.wind.speed * 3.6).toString(),
    condition: weather.weather[0].description,
  });

  const temp = weather.main.temp;

  let suggestion =
    temp > 35
      ? "Avoid outdoor travel during afternoon hours."
      : "Perfect weather for travel and sightseeing.";

  const travelUrl = `/travel?${params.toString()}`;

  return (
<div
  className={`
  rounded-2xl
  p-4
  text-center
  transition-all
  duration-500
  ${
    darkMode
      ? "bg-white/10 text-white"
      : "bg-black/10 text-gray-900"
  }
`}
>
      <a
        href={travelUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open travel suggestions for ${city}. ${suggestion}`}
        className={`
          inline-flex
          min-h-12
          items-center
          justify-center
          rounded-xl
          px-8
          py-3
          text-base
          font-semibold
          text-white
          shadow-lg
          transition
          hover:-translate-y-0.5
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          ${
            darkMode
              ? "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-300 focus:ring-offset-slate-950"
              : "bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 focus:ring-offset-sky-100"
          }
        `}
      >
        Travel Suggestion
      </a>
    </div>
  );
};

export default TravelSuggestion;
