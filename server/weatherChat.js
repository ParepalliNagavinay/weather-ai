const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const weatherCodeMap = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  56: "light freezing drizzle",
  57: "dense freezing drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  66: "light freezing rain",
  67: "heavy freezing rain",
  71: "slight snow fall",
  73: "moderate snow fall",
  75: "heavy snow fall",
  77: "snow grains",
  80: "slight rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "slight snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with slight hail",
  99: "thunderstorm with heavy hail",
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    if (req.body) {
      if (typeof req.body === "string") {
        try {
          resolve(JSON.parse(req.body));
        } catch {
          reject(new Error("Request body must be valid JSON."));
        }
        return;
      }

      resolve(req.body);
      return;
    }

    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const fetchJson = async (url, params) => {
  const target = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });

  const response = await fetch(target);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

const geocodeCity = async (city) => {
  const data = await fetchJson(GEOCODING_URL, {
    name: city,
    count: "1",
    language: "en",
    format: "json",
  });
  const location = data.results?.[0];

  if (!location) {
    throw new Error(`No location found for "${city}".`);
  }

  return location;
};

const getWeatherSummary = async (city) => {
  const location = await geocodeCity(city);
  const forecast = await fetchJson(FORECAST_URL, {
    latitude: location.latitude,
    longitude: location.longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,cloud_cover,precipitation",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "5",
  });

  const current = forecast.current;
  const daily = forecast.daily;

  return {
    location: {
      name: location.name,
      country: location.country,
      region: location.admin1,
      timezone: forecast.timezone,
    },
    current: {
      time: current.time,
      temperatureC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidityPercent: current.relative_humidity_2m,
      windKmh: current.wind_speed_10m,
      pressureHpa: current.pressure_msl,
      cloudCoverPercent: current.cloud_cover,
      precipitationMm: current.precipitation,
      condition: weatherCodeMap[current.weather_code] ?? "weather unavailable",
    },
    daily: daily.time.map((date, index) => ({
      date,
      condition: weatherCodeMap[daily.weather_code[index]] ?? "weather unavailable",
      highC: daily.temperature_2m_max[index],
      lowC: daily.temperature_2m_min[index],
      rainChancePercent: daily.precipitation_probability_max?.[index],
      uvIndexMax: daily.uv_index_max?.[index],
      sunrise: daily.sunrise?.[index],
      sunset: daily.sunset?.[index],
    })),
  };
};

const getGeminiResponseText = (payload) =>
  payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

const isGeminiQuotaError = (error) => {
  const message = error.message?.toLowerCase() || "";

  return (
    message.includes("not configured") ||
    message.includes("api key") ||
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("rate limit") ||
    message.includes("rate-limits") ||
    message.includes("resource_exhausted")
  );
};

const getRainAdvice = (today) => {
  const chance = today.rainChancePercent ?? 0;
  const condition = today.condition.toLowerCase();

  if (chance >= 70 || condition.includes("rain") || condition.includes("thunderstorm")) {
    return `Rain is likely today with about ${chance}% precipitation chance. Carry an umbrella and avoid long outdoor plans during heavier showers.`;
  }

  if (chance >= 35) {
    return `There is a moderate rain chance today, around ${chance}%. Outdoor plans are possible, but keep rain cover nearby.`;
  }

  return `Rain looks unlikely today, with about ${chance}% precipitation chance. Conditions look mostly manageable for outdoor plans.`;
};

const getTravelAdvice = (current, today) => {
  const wind = Math.round(current.windKmh);
  const temp = Math.round(current.temperatureC);
  const feels = Math.round(current.feelsLikeC);
  const chance = today.rainChancePercent ?? 0;

  if (today.condition.toLowerCase().includes("thunderstorm") || chance >= 70) {
    return "Outdoor travel is possible only with caution. Thunderstorm or heavy rain risk means you should check local alerts, avoid exposed areas, and keep plans flexible.";
  }

  if (feels >= 38) {
    return `Outdoor travel may feel uncomfortable because it feels like ${feels}°C. Prefer morning/evening travel, hydrate often, and take shade breaks.`;
  }

  if (wind >= 35) {
    return `Outdoor travel is okay, but wind is strong at about ${wind} km/h. Be careful with two-wheelers, umbrellas, and loose items.`;
  }

  return `Outdoor travel looks generally safe right now: ${temp}°C, feels like ${feels}°C, ${wind} km/h wind, and about ${chance}% rain chance. Still check local alerts before a long trip.`;
};

const createLocalWeatherAnswer = ({ question, weatherSummary }) => {
  const lowerQuestion = question.toLowerCase();
  const current = weatherSummary.current;
  const today = weatherSummary.daily[0];
  const place = [
    weatherSummary.location.name,
    weatherSummary.location.region,
    weatherSummary.location.country,
  ]
    .filter(Boolean)
    .join(", ");
  const summary = `${place}: ${Math.round(current.temperatureC)}°C, feels like ${Math.round(
    current.feelsLikeC
  )}°C, ${current.condition}, humidity ${current.humidityPercent}%, wind ${Math.round(
    current.windKmh
  )} km/h, pressure ${Math.round(current.pressureHpa)} hPa.`;

  if (lowerQuestion.includes("rain")) {
    return `${getRainAdvice(today)}\n\n${summary}`;
  }

  if (
    lowerQuestion.includes("safe") ||
    lowerQuestion.includes("travel") ||
    lowerQuestion.includes("outdoor")
  ) {
    return `${getTravelAdvice(current, today)}\n\n${summary}`;
  }

  if (
    lowerQuestion.includes("atmosphere") ||
    lowerQuestion.includes("humidity") ||
    lowerQuestion.includes("pressure") ||
    lowerQuestion.includes("wind")
  ) {
    return `The atmosphere over ${place} is currently ${current.condition}. Humidity is ${current.humidityPercent}%, pressure is about ${Math.round(
      current.pressureHpa
    )} hPa, cloud cover is ${current.cloudCoverPercent}%, and wind is near ${Math.round(
      current.windKmh
    )} km/h. That points to ${current.humidityPercent >= 70 ? "a humid, heavier-feeling air mass" : "moderate humidity"} with ${current.cloudCoverPercent >= 65 ? "significant cloud cover" : "fairly open sky conditions"}.\n\n${summary}`;
  }

  return `Gemini is currently unavailable because of quota limits, so here is a live weather-based answer.\n\n${summary}\n\nToday: high ${Math.round(
    today.highC
  )}°C, low ${Math.round(today.lowC)}°C, ${today.condition}, rain chance ${
    today.rainChancePercent ?? 0
  }%, UV index ${today.uvIndexMax ?? "unavailable"}.`;
};

const buildGeminiRequest = ({ question, weatherSummary }) => ({
  systemInstruction: {
    parts: [
      {
        text:
          "You are Weather AI, a helpful chatbot for weather and atmospheric questions. Answer only using the supplied live weather context plus general meteorology knowledge. If the user asks for severe weather, health, or safety advice, be practical and recommend checking official local alerts. Keep answers clear, concise, and location-specific.",
      },
    ],
  },
  contents: [
    {
      role: "user",
      parts: [
        {
          text: `Location weather context:\n${JSON.stringify(
            weatherSummary,
            null,
            2
          )}\n\nQuestion: ${question}`,
        },
      ],
    },
  ],
  generationConfig: {
    maxOutputTokens: 500,
    temperature: 0.35,
  },
});

const callGeminiModel = async ({ apiKey, model, question, weatherSummary }) => {
  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGeminiRequest({ question, weatherSummary })),
  });
  const payload = await response.json();

  return { response, payload };
};

const askGemini = async ({ question, weatherSummary }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const requestedModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const fallbackModel = "gemini-2.5-flash";
  let { response, payload } = await callGeminiModel({
    apiKey,
    model: requestedModel,
    question,
    weatherSummary,
  });

  if (!response.ok && requestedModel !== fallbackModel && payload.error?.code === 404) {
    ({ response, payload } = await callGeminiModel({
      apiKey,
      model: fallbackModel,
      question,
      weatherSummary,
    }));
  }

  if (!response.ok) {
    throw new Error(payload.error?.message || "Google AI request failed.");
  }

  return getGeminiResponseText(payload) || "I could not generate an answer for that question.";
};

export const handleWeatherChat = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const { question, location } = await readJsonBody(req);
    const trimmedQuestion = question?.trim();
    const trimmedLocation = location?.trim();

    if (!trimmedQuestion || !trimmedLocation) {
      sendJson(res, 400, { error: "Question and location are required." });
      return;
    }

    const weatherSummary = await getWeatherSummary(trimmedLocation);
    let answer;
    let source = "gemini";

    try {
      answer = await askGemini({ question: trimmedQuestion, weatherSummary });
    } catch (error) {
      if (!isGeminiQuotaError(error)) {
        throw error;
      }

      answer = createLocalWeatherAnswer({
        question: trimmedQuestion,
        weatherSummary,
      });
      source = "local-weather-fallback";
    }

    sendJson(res, 200, {
      answer,
      source,
      resolvedLocation: [
        weatherSummary.location.name,
        weatherSummary.location.region,
        weatherSummary.location.country,
      ]
        .filter(Boolean)
        .join(", "),
      current: weatherSummary.current,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Unable to answer the weather question.",
    });
  }
};
