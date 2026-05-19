import { useCallback, useEffect, useState } from "react";
import ForecastCard from "../components/ForecastCard";
import Navbar from "../components/Navbar";
import WeatherCard from "../components/WeatherCard";
import TravelSuggestion from "../components/TravelSuggestion";
import { saveFavoriteCity } from "../services/database";

import SearchBar from "../components/SearchBar";
import bgImage from "../assets/nature.jpg";
import { getWeather } from "../services/weatherApi";
import { supabase } from "../services/supabase";
import { sendTemperatureAlert } from "../services/emailService";

const Home = () => {
  const [city, setCity] = useState("Bangalore");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

const fetchWeather = useCallback(async () => {
  try {

    const data = await getWeather(city);

    setWeather(data.current);

    setForecast(data.forecast.list);

  } catch (error) {
    console.log(error);
  }
  }, [city]);
  const saveCity = async () => {
  try {

    await saveFavoriteCity(city);

    alert("City saved successfully");

  } catch (error) {

    console.log(error);

    alert("Error saving city");

  }
};

useEffect(() => {
  const checkAndSendAlert = async () => {
    if (!user || !weather) return;
    if (weather.main.temp <= 35) return;

    const alertKey = `weather_alert_sent_${user.id}`;
    if (sessionStorage.getItem(alertKey)) return;

    try {
      const success = await sendTemperatureAlert(
        user.email, 
        city, 
        weather.main.temp,
        weather.main.humidity,
        weather.weather[0].description
      );
      if (success) {
        sessionStorage.setItem(alertKey, "true");
        console.log("Automatic temperature alert sent successfully!");
        alert("alert send to your email");
      }
    } catch (error) {
      console.error("Failed to send automatic alert:", error);
    }
  };

  checkAndSendAlert();
}, [user, weather, city]);

useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchWeather();
}, [fetchWeather]);

  if (!weather) {
  return (
    <div className="text-white text-3xl flex justify-center items-center h-screen">
      Loading Weather Data...
    </div>
  );
}
return (
<div
  className={`
    min-h-screen
    flex
    bg-cover
    bg-center
    p-0
    transition-all
    duration-500
    ${darkMode ? "bg-black/40" : "bg-white/20"}
  `}
  style={{
    backgroundImage: `url(${bgImage})`,
  }}
>
<div
  className={`
  w-full
  min-h-screen
  rounded-none
  p-4
  sm:p-6
  lg:p-8
  backdrop-blur-xl
  border
  shadow-2xl
  flex
  flex-col
  gap-4
  lg:gap-6
  transition-all
  duration-500
  ${
    darkMode
      ? "bg-gradient-to-b from-gray-950 via-black to-slate-900"
      : "bg-gradient-to-b from-blue-400 via-sky-300 to-cyan-200"
  }
  `}
>
      <Navbar
  darkMode={darkMode}
  toggleTheme={toggleTheme}
/>



  <div className="flex items-center gap-3 w-full max-w-5xl mx-auto">

  <div className="flex-1">
    <SearchBar
      city={city}
      setCity={setCity}
      fetchWeather={fetchWeather}
    />
  </div>

  <button
    onClick={saveCity}
    className="
      h-14
      sm:h-16
      px-5
      rounded-full
      bg-blue-600
      hover:bg-blue-700
      text-white
      font-semibold
      whitespace-nowrap
      transition-all
      duration-300
      shrink-0
    "
  >
    Save City
  </button>

</div>
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">

  <div className="flex flex-col gap-4 h-full">

    <WeatherCard
      weather={weather}
      darkMode={darkMode}
    />

    <TravelSuggestion
      weather={weather}
      darkMode={darkMode}
      city={city}
    />

  </div>

  <div className="h-full">

    <div className="h-full">
  <ForecastCard forecast={forecast} darkMode={darkMode} />
</div>

  </div>

</div>
    </div>
  </div>
);
};

export default Home;
