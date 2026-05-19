import axios from "axios";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const weatherCodeMap = {
  0: { description: "clear sky", icon: "01d" },
  1: { description: "mainly clear", icon: "02d" },
  2: { description: "partly cloudy", icon: "03d" },
  3: { description: "overcast", icon: "04d" },
  45: { description: "fog", icon: "50d" },
  48: { description: "depositing rime fog", icon: "50d" },
  51: { description: "light drizzle", icon: "09d" },
  53: { description: "moderate drizzle", icon: "09d" },
  55: { description: "dense drizzle", icon: "09d" },
  56: { description: "light freezing drizzle", icon: "09d" },
  57: { description: "dense freezing drizzle", icon: "09d" },
  61: { description: "slight rain", icon: "10d" },
  63: { description: "moderate rain", icon: "10d" },
  65: { description: "heavy rain", icon: "10d" },
  66: { description: "light freezing rain", icon: "13d" },
  67: { description: "heavy freezing rain", icon: "13d" },
  71: { description: "slight snow fall", icon: "13d" },
  73: { description: "moderate snow fall", icon: "13d" },
  75: { description: "heavy snow fall", icon: "13d" },
  77: { description: "snow grains", icon: "13d" },
  80: { description: "slight rain showers", icon: "09d" },
  81: { description: "moderate rain showers", icon: "09d" },
  82: { description: "violent rain showers", icon: "09d" },
  85: { description: "slight snow showers", icon: "13d" },
  86: { description: "heavy snow showers", icon: "13d" },
  95: { description: "thunderstorm", icon: "11d" },
  96: { description: "thunderstorm with slight hail", icon: "11d" },
  99: { description: "thunderstorm with heavy hail", icon: "11d" },
};

const getWeatherDetails = (code) =>
  weatherCodeMap[code] ?? { description: "weather unavailable", icon: "03d" };

const geocodeCity = async (city) => {
  const { data } = await axios.get(GEOCODING_URL, {
    params: {
      name: city,
      count: 1,
      language: "en",
      format: "json",
    },
  });

  const location = data.results?.[0];

  if (!location) {
    throw new Error(`No location found for "${city}"`);
  }

  return location;
};

const toCurrentWeather = (forecast, location) => {
  const current = forecast.current;
  const details = getWeatherDetails(current.weather_code);

  return {
    name: location.name,
    sys: {
      country: location.country_code,
    },
    main: {
      temp: current.temperature_2m,
      feels_like: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
    },
    wind: {
      speed: current.wind_speed_10m / 3.6,
    },
    weather: [
      {
        id: current.weather_code,
        description: details.description,
        icon: details.icon,
      },
    ],
  };
};

const toDailyForecast = (forecast) => ({
  list: forecast.daily.time.map((date, index) => {
    const details = getWeatherDetails(forecast.daily.weather_code[index]);
    const max = forecast.daily.temperature_2m_max[index];
    const min = forecast.daily.temperature_2m_min[index];
    const rainChance = forecast.daily.precipitation_probability_max?.[index];

    return {
      dt_txt: date,
      main: {
        temp: (max + min) / 2,
        temp_max: max,
        temp_min: min,
      },
      precipitation_probability: rainChance,
      weather: [
        {
          id: forecast.daily.weather_code[index],
          description: details.description,
          icon: details.icon,
        },
      ],
    };
  }),
});

export const getWeather = async (city) => {
  const location = await geocodeCity(city);

  const { data: forecast } = await axios.get(FORECAST_URL, {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "auto",
      forecast_days: 7,
    },
  });

  return {
    current: toCurrentWeather(forecast, location),
    forecast: toDailyForecast(forecast),
  };
};
