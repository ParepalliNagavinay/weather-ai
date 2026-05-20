import { useCallback, useEffect, useState } from "react";
import ForecastCard from "../components/ForecastCard";
import Navbar from "../components/Navbar";
import WeatherCard from "../components/WeatherCard";
import TravelSuggestion from "../components/TravelSuggestion";
import PhotographySuggestion from "../components/PhotographySuggestion";
import { saveFavoriteCity } from "../services/database";
import SearchBar from "../components/SearchBar";
import { getWeather } from "../services/weatherApi";
import { supabase } from "../services/supabase";
import { sendTemperatureAlert } from "../services/emailService";
import { FiBookmark } from "react-icons/fi";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const DEFAULT_CITY = "Bangalore";

const Home = () => {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [savedToast, setSavedToast] = useState(false);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleAuthRequired = () => {
    setShowAuthAlert(true);
    setTimeout(() => setShowAuthAlert(false), 3000);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const toggleTheme = () => setDarkMode(!darkMode);

  const fetchWeather = useCallback(async (cityToSearch = DEFAULT_CITY) => {
    const nextCity = cityToSearch.trim();
    if (!nextCity) return;

    setLoading(true);
    try {
      const data = await getWeather(nextCity);
      setWeather(data.current);
      setForecast(data.forecast.list);
      setCity(data.current.name || nextCity);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCity = async () => {
    try {
      await saveFavoriteCity(city);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (error) {
      if (error.message === "AUTH_REQUIRED") {
        handleAuthRequired();
      } else {
        console.log(error);
      }
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
        }
      } catch (error) {
        console.error("Failed to send automatic alert:", error);
      }
    };
    checkAndSendAlert();
  }, [user, weather, city]);

  useEffect(() => {
    fetchWeather(DEFAULT_CITY);
  }, [fetchWeather]);

  if (loading || !weather) {
    return (
      <div className={`loading-screen ${darkMode ? "loading-screen--dark" : "loading-screen--light"}`}>
        <div className="loading-screen__orb loading-screen__orb--1" />
        <div className="loading-screen__orb loading-screen__orb--2" />
        <div className="loading-screen__orb loading-screen__orb--3" />
        <div className="loading-screen__content">
          <div className="loading-spinner" />
          <p className="loading-screen__text">Fetching weather data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`home ${darkMode ? "home--dark" : "home--light"}`}>
      {/* Animated background */}
      <div className="home__bg">
        <div className="home__bg-orb home__bg-orb--1" />
        <div className="home__bg-orb home__bg-orb--2" />
        <div className="home__bg-orb home__bg-orb--3" />
        <div className="home__bg-grid" />
      </div>

      {/* Content */}
      <div className="home__content">
        <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />

        {/* Search row */}
        <div className="home__search-row">
          <SearchBar city={city} setCity={setCity} fetchWeather={fetchWeather} />
          <button
            onClick={saveCity}
            className="home__save-btn"
            aria-label="Save city"
          >
            <FiBookmark />
            <span>Save City</span>
          </button>
        </div>

        {/* Main grid */}
        <div className="home__grid">
          <div className="home__left">
            <WeatherCard weather={weather} darkMode={darkMode} />
            <TravelSuggestion
              weather={weather}
              darkMode={darkMode}
              city={city}
              user={user}
              onAuthRequired={handleAuthRequired}
            />
            <PhotographySuggestion
              weather={weather}
              darkMode={darkMode}
              city={city}
              user={user}
              onAuthRequired={handleAuthRequired}
            />
          </div>
          <div className="home__right">
            <ForecastCard forecast={forecast} darkMode={darkMode} />
          </div>
        </div>
      </div>

      {/* Toast */}
      {savedToast && (
        <div className="toast toast--success">
          <FaCheckCircle />
          <span>City saved successfully!</span>
        </div>
      )}
      {showAuthAlert && (
        <div className="toast toast--warning">
          <FaExclamationCircle />
          <span>Please login to continue</span>
        </div>
      )}
    </div>
  );
};

export default Home;
