import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaArrowRight,
  FaCloudSun,
  FaExchangeAlt,
  FaListUl,
  FaLocationArrow,
  FaSave,
  FaSearch,
  FaTemperatureHigh,
  FaTint,
  FaWind,
} from "react-icons/fa";
import { saveWeatherComparison } from "../services/database";
import { getWeather } from "../services/weatherApi";

const DEFAULT_COMPARE_CITY = "Mumbai";

const formatTemp = (value) => (Number.isFinite(value) ? `${Math.round(value)}C` : "--C");

const getCityMetrics = (weather) => {
  if (!weather) return null;

  return {
    city: weather.name,
    temp: weather.main?.temp ?? null,
    feelsLike: weather.main?.feels_like ?? null,
    humidity: weather.main?.humidity ?? null,
    windKmh: Math.round((weather.wind?.speed ?? 0) * 3.6),
    condition: weather.weather?.[0]?.description ?? "Weather unavailable",
  };
};

const getComparisonSummary = (first, second) => {
  if (!first || !second) return "Search two cities to compare live weather side by side.";

  const tempDiff = Math.round((first.temp ?? 0) - (second.temp ?? 0));
  const windDiff = Math.round((first.windKmh ?? 0) - (second.windKmh ?? 0));
  const humidityDiff = (first.humidity ?? 0) - (second.humidity ?? 0);

  if (Math.abs(tempDiff) >= 3) {
    const warmer = tempDiff > 0 ? first.city : second.city;
    return `${warmer} is warmer by ${Math.abs(tempDiff)}C right now.`;
  }

  if (Math.abs(windDiff) >= 8) {
    const windier = windDiff > 0 ? first.city : second.city;
    return `${windier} has stronger wind by ${Math.abs(windDiff)} km/h.`;
  }

  if (Math.abs(humidityDiff) >= 12) {
    const humid = humidityDiff > 0 ? first.city : second.city;
    return `${humid} feels more humid by ${Math.abs(humidityDiff)}%.`;
  }

  return `${first.city} and ${second.city} have fairly similar weather right now.`;
};

const WeatherComparison = () => {
  const [searchParams] = useSearchParams();
  const [cityA, setCityA] = useState(searchParams.get("city") || "Bengaluru");
  const [cityB, setCityB] = useState(DEFAULT_COMPARE_CITY);
  const [weatherA, setWeatherA] = useState(null);
  const [weatherB, setWeatherB] = useState(null);
  const [status, setStatus] = useState("idle");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const didLoadInitialComparison = useRef(false);

  const firstMetrics = useMemo(() => getCityMetrics(weatherA), [weatherA]);
  const secondMetrics = useMemo(() => getCityMetrics(weatherB), [weatherB]);
  const summary = useMemo(
    () => getComparisonSummary(firstMetrics, secondMetrics),
    [firstMetrics, secondMetrics]
  );

  const compareCities = useCallback(async (nextCityA = cityA, nextCityB = cityB) => {
    const firstCity = nextCityA.trim();
    const secondCity = nextCityB.trim();
    if (!firstCity || !secondCity) {
      setMessage("Enter both city names to compare.");
      return;
    }

    setStatus("loading");
    setMessage("");
    setSaveStatus("idle");

    try {
      const [first, second] = await Promise.all([
        getWeather(firstCity),
        getWeather(secondCity),
      ]);
      setWeatherA(first.current);
      setWeatherB(second.current);
      setCityA(first.current.name || firstCity);
      setCityB(second.current.name || secondCity);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error.code === "INVALID_CITY" ? "Enter correct city names." : "Could not compare these cities right now.");
    }
  }, [cityA, cityB]);

  const saveComparison = async () => {
    if (!weatherA || !weatherB || !firstMetrics || !secondMetrics) return;

    setSaveStatus("saving");
    try {
      await saveWeatherComparison({
        city_a: firstMetrics.city,
        city_b: secondMetrics.city,
        temp_a: firstMetrics.temp,
        temp_b: secondMetrics.temp,
        humidity_a: firstMetrics.humidity,
        humidity_b: secondMetrics.humidity,
        wind_a: firstMetrics.windKmh,
        wind_b: secondMetrics.windKmh,
        condition_a: firstMetrics.condition,
        condition_b: secondMetrics.condition,
        summary,
        weather_a: weatherA,
        weather_b: weatherB,
      });
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("error");
      setMessage(
        error.message === "AUTH_REQUIRED"
          ? "Please login before saving comparisons."
          : "Create the Supabase comparison table first, then save again."
      );
    }
  };

  const swapCities = () => {
    const nextCityA = cityB;
    const nextCityB = cityA;
    setCityA(nextCityA);
    setCityB(nextCityB);
    setWeatherA(weatherB);
    setWeatherB(weatherA);
  };

  useEffect(() => {
    if (didLoadInitialComparison.current) return undefined;
    didLoadInitialComparison.current = true;

    const timerId = window.setTimeout(() => {
      compareCities(searchParams.get("city") || "Bengaluru", DEFAULT_COMPARE_CITY);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [compareCities, searchParams]);

  const metricRows = [
    { label: "Temperature", icon: <FaTemperatureHigh />, first: formatTemp(firstMetrics?.temp), second: formatTemp(secondMetrics?.temp) },
    { label: "Feels like", icon: <FaCloudSun />, first: formatTemp(firstMetrics?.feelsLike), second: formatTemp(secondMetrics?.feelsLike) },
    { label: "Humidity", icon: <FaTint />, first: `${firstMetrics?.humidity ?? "--"}%`, second: `${secondMetrics?.humidity ?? "--"}%` },
    { label: "Wind", icon: <FaWind />, first: `${firstMetrics?.windKmh ?? "--"} km/h`, second: `${secondMetrics?.windKmh ?? "--"} km/h` },
  ];

  return (
    <main className="comparison-page">
      <section className="comparison-shell">
        <header className="comparison-header">
          <Link to="/" className="comparison-back">Back to Weather</Link>
          <div className="comparison-title-row">
            <span className="comparison-avatar">
              <FaExchangeAlt />
            </span>
            <div>
              <p className="comparison-kicker">Weather comparison</p>
              <h1>Compare cities live</h1>
              <p>Check temperature, humidity, wind, and comfort differences before you travel or plan your day.</p>
            </div>
          </div>
        </header>

        <form
          className="comparison-search"
          onSubmit={(event) => {
            event.preventDefault();
            compareCities();
          }}
        >
          <label>
            <span>City A</span>
            <input value={cityA} onChange={(event) => setCityA(event.target.value)} />
          </label>
          <button type="button" className="comparison-swap" onClick={swapCities} aria-label="Swap cities">
            <FaExchangeAlt />
          </button>
          <label>
            <span>City B</span>
            <input value={cityB} onChange={(event) => setCityB(event.target.value)} />
          </label>
          <button type="submit" className="comparison-primary" disabled={status === "loading"}>
            <FaSearch />
            <span>{status === "loading" ? "Comparing" : "Compare"}</span>
          </button>
        </form>

        {message && <p className="comparison-message">{message}</p>}

        <section className="comparison-board">
          {[firstMetrics, secondMetrics].map((metrics, index) => (
            <article className="comparison-city" key={index === 0 ? "first" : "second"}>
              <div className="comparison-city__top">
                <span><FaLocationArrow /></span>
                <p>{index === 0 ? "Origin city" : "Destination city"}</p>
              </div>
              <h2>{metrics?.city ?? "Search city"}</h2>
              <strong>{formatTemp(metrics?.temp)}</strong>
              <p>{metrics?.condition ?? "Waiting for weather data"}</p>
              <div className="comparison-city__chips">
                <span><FaTint /> {metrics?.humidity ?? "--"}%</span>
                <span><FaWind /> {metrics?.windKmh ?? "--"} km/h</span>
              </div>
            </article>
          ))}

          <article className="comparison-insight">
            <p className="comparison-kicker">Live insight</p>
            <h2>{summary}</h2>
            <div className="comparison-insight__rows">
              {metricRows.map((row) => (
                <div className="comparison-row" key={row.label}>
                  <span>{row.icon} {row.label}</span>
                  <strong>{row.first}</strong>
                  <FaArrowRight />
                  <strong>{row.second}</strong>
                </div>
              ))}
            </div>
            <div className="comparison-actions">
              <button
                type="button"
                className="comparison-save"
                onClick={saveComparison}
                disabled={!weatherA || !weatherB || saveStatus === "saving"}
              >
                <FaSave />
                <span>{saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Save comparison"}</span>
              </button>
              <Link to="/saved-comparisons" className="comparison-saved-link">
                <FaListUl />
                <span>Saved comparisons</span>
              </Link>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
};

export default WeatherComparison;
