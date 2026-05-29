import axios from "axios";
import { geocodeCity } from "./geocoding";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

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

const toCurrentWeather = (forecast, location) => {
  const current = forecast.current;
  const details = getWeatherDetails(current.weather_code);

  // Sunset for today (index 0 of daily array) – returned as ISO date-time string
  const sunsetIso = forecast.daily?.sunset?.[0];
  const sunsetUnix = sunsetIso ? Math.floor(new Date(sunsetIso).getTime() / 1000) : null;

  return {
    name: location.name,
    coord: {
      lat: location.latitude,
      lon: location.longitude,
    },
    sys: {
      country: location.country_code,
      sunset: sunsetUnix,
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

const getAqiStatus = (aqi) => {
  if (!Number.isFinite(aqi)) return { label: "Unavailable", level: "unknown" };
  if (aqi <= 50) return { label: "Good", level: "good" };
  if (aqi <= 100) return { label: "Moderate", level: "moderate" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", level: "sensitive" };
  if (aqi <= 200) return { label: "Unhealthy", level: "unhealthy" };
  if (aqi <= 300) return { label: "Very Unhealthy", level: "very-unhealthy" };
  return { label: "Hazardous", level: "hazardous" };
};

const getClosestHourlyIndex = (times) => {
  if (!Array.isArray(times) || times.length === 0) return 0;

  const now = Date.now();
  return times.reduce((closestIndex, time, index) => {
    const currentDistance = Math.abs(new Date(time).getTime() - now);
    const closestDistance = Math.abs(new Date(times[closestIndex]).getTime() - now);
    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);
};

const getAirQuality = async (location) => {
  try {
    const { data } = await axios.get(AIR_QUALITY_URL, {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        hourly:
          "us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide",
        timezone: "auto",
        forecast_days: 1,
      },
    });

    const hourly = data.hourly ?? {};
    const index = getClosestHourlyIndex(hourly.time);
    const aqi = Math.round(hourly.us_aqi?.[index]);
    const status = getAqiStatus(aqi);

    return {
      aqi: Number.isFinite(aqi) ? aqi : null,
      label: status.label,
      level: status.level,
      pollutants: {
        pm25: hourly.pm2_5?.[index] ?? null,
        pm10: hourly.pm10?.[index] ?? null,
        o3: hourly.ozone?.[index] ?? null,
        no2: hourly.nitrogen_dioxide?.[index] ?? null,
        so2: hourly.sulphur_dioxide?.[index] ?? null,
        co: hourly.carbon_monoxide?.[index] ?? null,
      },
      updatedAt: hourly.time?.[index] ?? null,
    };
  } catch (error) {
    console.log("Air quality unavailable:", error);
    return null;
  }
};

const getRouteForecast = async (point) => {
  const { data } = await axios.get(FORECAST_URL, {
    params: {
      latitude: point.latitude,
      longitude: point.longitude,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
      hourly:
        "temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m",
      timezone: "auto",
      forecast_days: 2,
    },
  });

  return data;
};

const getRoutePointStatus = (forecast) => {
  const current = forecast.current ?? {};
  const code = current.weather_code;
  const details = getWeatherDetails(code);
  const temp = current.temperature_2m;
  const feels = current.apparent_temperature;
  const wind = current.wind_speed_10m;
  const precipitation = current.precipitation ?? 0;
  const description = details.description.toLowerCase();

  const storm = description.includes("thunder") || code >= 95;
  const rain = precipitation > 0.2 || description.includes("rain") || description.includes("drizzle");
  const hot = temp >= 35 || feels >= 38;
  const windy = wind >= 30;

  return {
    temp,
    feels,
    wind,
    humidity: current.relative_humidity_2m,
    precipitation,
    condition: details.description,
    hazard: storm ? "storm" : rain ? "rain" : hot ? "hot" : windy ? "wind" : "clear",
  };
};

const scoreRouteHour = (forecasts, index) => {
  return forecasts.reduce((total, forecast) => {
    const hourly = forecast.hourly ?? {};
    const code = hourly.weather_code?.[index];
    const details = getWeatherDetails(code).description.toLowerCase();
    const temp = hourly.temperature_2m?.[index] ?? 28;
    const feels = hourly.apparent_temperature?.[index] ?? temp;
    const rainChance = hourly.precipitation_probability?.[index] ?? 0;
    const wind = hourly.wind_speed_10m?.[index] ?? 0;
    const stormPenalty = details.includes("thunder") || code >= 95 ? 55 : 0;
    const rainPenalty = details.includes("rain") || details.includes("drizzle") ? 25 : 0;
    const heatPenalty = temp >= 35 || feels >= 38 ? 24 : 0;
    const windPenalty = wind >= 30 ? 12 : 0;

    return total + rainChance + stormPenalty + rainPenalty + heatPenalty + windPenalty;
  }, 0);
};

const getBestRouteTiming = (forecasts) => {
  const times = forecasts[0]?.hourly?.time ?? [];
  if (times.length === 0) {
    return {
      window: "Next clear window",
      reason: "Live hourly timing is unavailable, so keep your plan flexible.",
    };
  }

  const now = Date.now();
  const candidates = times
    .map((time, index) => ({ time, index, date: new Date(time) }))
    .filter(({ date }) => date.getTime() >= now)
    .slice(0, 24)
    .filter((_, index) => index % 3 === 0);

  const best = candidates.reduce((lowest, candidate) => {
    const score = scoreRouteHour(forecasts, candidate.index);
    return !lowest || score < lowest.score ? { ...candidate, score } : lowest;
  }, null);

  if (!best) {
    return {
      window: "Next clear window",
      reason: "Check again closer to departure for a safer timing window.",
    };
  }

  const window = best.date.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    window,
    reason:
      best.score >= 110
        ? "This is the least risky window, though route weather still needs caution."
        : best.score >= 55
          ? "This window has lower route risk than nearby hours."
          : "This window has the best mix of lower rain, heat, storm, and wind risk.",
  };
};

const buildRouteSamples = (origin, destination) => {
  const steps = 5;
  return Array.from({ length: steps }, (_, index) => {
    const ratio = index / (steps - 1);
    return {
      latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio,
      longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio,
      label:
        index === 0
          ? origin.name
          : index === steps - 1
            ? destination.name
            : `Route zone ${index}`,
      progress: ratio,
    };
  });
};

export const getSmartRouteWeather = async (originCity, destinationCity) => {
  const [origin, destination] = await Promise.all([
    geocodeCity(originCity),
    geocodeCity(destinationCity),
  ]);

  const samples = buildRouteSamples(origin, destination);
  const forecasts = await Promise.all(samples.map(getRouteForecast));
  const zones = samples.map((sample, index) => ({
    ...sample,
    ...getRoutePointStatus(forecasts[index]),
  }));
  const hazards = zones.reduce(
    (totals, zone) => ({
      rain: totals.rain + (zone.hazard === "rain" ? 1 : 0),
      hot: totals.hot + (zone.hazard === "hot" ? 1 : 0),
      storm: totals.storm + (zone.hazard === "storm" ? 1 : 0),
      wind: totals.wind + (zone.hazard === "wind" ? 1 : 0),
    }),
    { rain: 0, hot: 0, storm: 0, wind: 0 }
  );

  return {
    origin: origin.name,
    destination: destination.name,
    zones,
    hazards,
    timing: getBestRouteTiming(forecasts),
  };
};

export const getWeather = async (city) => {
  const location = await geocodeCity(city);

  const { data: forecast } = await axios.get(FORECAST_URL, {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
      timezone: "auto",
      forecast_days: 7,
    },
  });

  return {
    current: toCurrentWeather(forecast, location),
    forecast: toDailyForecast(forecast),
    airQuality: await getAirQuality(location),
  };
};
