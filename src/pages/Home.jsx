import { useCallback, useEffect, useState } from "react";
import ForecastCard from "../components/ForecastCard";
import Navbar from "../components/Navbar";
import WeatherCard from "../components/WeatherCard";
import TravelSuggestion from "../components/TravelSuggestion";
import PhotographySuggestion from "../components/PhotographySuggestion";
import ImageWeatherAdvisor from "../components/ImageWeatherAdvisor";
import WeatherChatbot from "../components/WeatherChatbot";
import { saveFavoriteCity } from "../services/database";
import SearchBar from "../components/SearchBar";
import { getWeather } from "../services/weatherApi";
import { supabase } from "../services/supabase";
import { sendTemperatureAlert } from "../services/emailService";
import { FiBookmark } from "react-icons/fi";
import {
  FaCamera,
  FaCheckCircle,
  FaCloudSun,
  FaExclamationCircle,
  FaLeaf,
  FaMapMarkedAlt,
  FaSeedling,
  FaTint,
  FaWind,
} from "react-icons/fa";

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
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

      const { data, error } = await supabase.auth.getUser();
      const currentUser = data?.user;
      if (error || !currentUser?.email) return;

      const alertKey = `weather_alert_sent_${currentUser.id}`;
      if (sessionStorage.getItem(alertKey)) return;
      try {
        const success = await sendTemperatureAlert(
          currentUser.email,
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
    const timeoutId = window.setTimeout(() => {
      fetchWeather(DEFAULT_CITY);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
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

  const condition = weather.weather[0].description;
  const windKmh = Math.round(weather.wind.speed * 3.6);
  const insightParams = new URLSearchParams({
    city: weather.name || city,
    temp: Math.round(weather.main.temp).toString(),
    feels: Math.round(weather.main.feels_like).toString(),
    humidity: weather.main.humidity.toString(),
    wind: windKmh.toString(),
    condition,
  });

  const getInsightUrl = (type) => {
    const params = new URLSearchParams(insightParams);
    params.set("type", type);
    return `/insight?${params.toString()}`;
  };

  const featureCards = [
    {
      type: "weather",
      title: "Weather Lens",
      label: "Live city scan",
      icon: <FaCloudSun />,
      metric: `${Math.round(weather.main.temp)}°C`,
      text: condition,
      tone: "#38bdf8",
    },
    {
      type: "image",
      title: "Image AI",
      label: "Camera + upload",
      icon: <FaCamera />,
      metric: "Scene",
      text: "Photo-based suggestions",
      tone: "#a78bfa",
    },
    {
      type: "travel",
      title: "Travel",
      label: "Route comfort",
      icon: <FaMapMarkedAlt />,
      metric: windKmh > 28 ? "Windy" : "Ready",
      text: "Plan timing and movement",
      tone: "#10b981",
    },
    {
      type: "photoshoot",
      title: "Photoshoot",
      label: "Light guide",
      icon: <FaLeaf />,
      metric: weather.sys?.sunset ? "Golden" : "Light",
      text: "Portrait and outdoor frames",
      tone: "#f59e0b",
    },
    {
      type: "farming",
      title: "Farming",
      label: "Field advice",
      icon: <FaSeedling />,
      metric: `${weather.main.humidity}%`,
      text: "Crop care from weather",
      tone: "#34d399",
    },
  ];

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
        <Navbar
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          leftAccessory={
            <ImageWeatherAdvisor
              weather={weather}
              city={city}
              darkMode={darkMode}
            />
          }
        />

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

        <section className="home-feature-board" aria-label="Weather AI features">
          <div className="home-feature-board__main">
            <div className="home-feature-board__copy">
              <span className="home-feature-board__kicker">Smart weather workspace</span>
              <h2>{city}</h2>
              <p>
                One dashboard for live weather, image-aware guidance, travel planning,
                photoshoot timing, and farming decisions.
              </p>
            </div>
            <div className="home-feature-board__stats">
              <span><FaTint /> Humidity {weather.main.humidity}%</span>
              <span><FaWind /> Wind {windKmh} km/h</span>
              <span><FaCloudSun /> {condition}</span>
            </div>
          </div>

          <div className="home-feature-board__cards">
            {featureCards.map((feature) => (
              <a
                key={feature.title}
                href={getInsightUrl(feature.type)}
                target="_blank"
                rel="noopener noreferrer"
                className="home-feature-card"
                style={{ "--feature-tone": feature.tone }}
                aria-label={`Open ${feature.title} insight for ${city}`}
              >
                <div className="home-feature-card__icon">{feature.icon}</div>
                <span className="home-feature-card__label">{feature.label}</span>
                <h3>{feature.title}</h3>
                <strong>{feature.metric}</strong>
                <p>{feature.text}</p>
                <span className="home-feature-card__cta">Open</span>
              </a>
            ))}
          </div>
        </section>

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
            <WeatherChatbot city={city} weather={weather} darkMode={darkMode} />
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
