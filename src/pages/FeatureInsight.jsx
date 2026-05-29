import { Link, useSearchParams } from "react-router-dom";
import {
  FaCamera,
  FaCloudSun,
  FaLeaf,
  FaMapMarkedAlt,
  FaSeedling,
  FaSmog,
  FaTint,
  FaWind,
} from "react-icons/fa";

const getNumberParam = (params, key, fallback) => {
  const value = Number(params.get(key));
  return Number.isFinite(value) ? value : fallback;
};

const getAqiAdvice = (city, aqi, label) => {
  if (!Number.isFinite(aqi) || aqi <= 0) return "AQI readings are unavailable for this city right now.";
  if (aqi <= 50) return `${city} has clean air right now. Outdoor activity is comfortable for most people.`;
  if (aqi <= 100) return `${city} has acceptable air, though sensitive users should pace long outdoor activity.`;
  if (aqi <= 150) return `${city} may affect sensitive groups. Reduce heavy outdoor exertion if you have breathing concerns.`;
  if (aqi <= 200) return `${city} air is ${label.toLowerCase()}. Keep outdoor time short and avoid busy traffic corridors.`;
  return `${city} air quality is serious today. Prefer indoor plans and keep windows closed.`;
};

const getInsight = ({ type, city, temp, feels, humidity, wind, condition, aqi, aqiLabel }) => {
  const atmosphere = condition.toLowerCase();
  const rainy = atmosphere.includes("rain") || atmosphere.includes("drizzle") || atmosphere.includes("storm");
  const cloudy = atmosphere.includes("cloud") || atmosphere.includes("overcast");
  const hot = temp >= 33 || feels >= 36;
  const windy = wind >= 28;
  const humid = humidity >= 70;

  const common = {
    city,
    stats: [
      `${Math.round(temp)}°C temperature`,
      `${humidity}% humidity`,
      `${wind} km/h wind`,
      condition,
    ],
  };

  const insights = {
    weather: {
      icon: <FaCloudSun />,
      title: "Weather Lens",
      kicker: "Live city scan",
      tone: "#38bdf8",
      summary: rainy
        ? `${city} needs a rain-aware plan today. Keep outdoor tasks flexible and protect devices.`
        : hot
          ? `${city} is running hot today. Prioritize shade, hydration, and cooler time windows.`
          : `${city} has workable weather for outdoor plans with normal precautions.`,
      cards: [
        ["Comfort", hot ? "High heat load; avoid long direct-sun exposure." : "Comfort is manageable for normal outdoor movement."],
        ["Visibility", cloudy ? "Cloud cover may soften light and reduce harsh glare." : "Open light is useful for clear views and outdoor activity."],
        ["Action", rainy ? "Carry rain protection and delay non-urgent outdoor tasks." : "Use the current window for short outdoor plans."],
      ],
    },
    image: {
      icon: <FaCamera />,
      title: "Image AI",
      kicker: "Camera + upload",
      tone: "#a78bfa",
      summary: `Use a photo of ${city} to combine visible scene cues with today's weather for smarter local advice.`,
      cards: [
        ["Capture", "Open the camera icon on the dashboard and click a fresh place photo."],
        ["Upload", "Upload an existing image to scan sky, greenery, brightness, and warm light."],
        ["Result", "The advisor gives travel, photoshoot, and farming suggestions from image plus weather."],
      ],
    },
    travel: {
      icon: <FaMapMarkedAlt />,
      title: "Travel",
      kicker: "Route comfort",
      tone: "#10b981",
      summary: rainy
        ? `Travel around ${city} should stay flexible because wet roads and slower movement are likely.`
        : hot
          ? `Travel around ${city} is best planned outside peak heat hours.`
          : `Travel around ${city} looks suitable for short outdoor stops and flexible routes.`,
      cards: [
        ["Best Timing", hot ? "Move early morning or evening." : "Midday movement is acceptable if conditions stay stable."],
        ["Packing", rainy ? "Umbrella, waterproof bag, and spare time." : "Water, sunglasses, and comfortable footwear."],
        ["Route Note", windy ? "Avoid exposed viewpoints." : "Open routes and short walks are reasonable."],
      ],
    },
    photoshoot: {
      icon: <FaLeaf />,
      title: "Photoshoot",
      kicker: "Light guide",
      tone: "#f59e0b",
      summary: rainy
        ? `${city} is better for covered, reflective, cinematic shots today.`
        : cloudy
          ? `${city} has softer light, useful for portraits with lower contrast.`
          : `${city} can support warm outdoor portraits and golden-hour framing.`,
      cards: [
        ["Lighting", cloudy ? "Use clouds as a natural diffuser." : "Backlight subjects for warm edges and depth."],
        ["Camera Care", rainy ? "Use a rain sleeve and avoid lens swaps." : "Carry lens cloth and watch heat shimmer."],
        ["Shot Ideas", "Portraits, silhouettes, street frames, and scenic wide shots."],
      ],
    },
    farming: {
      icon: <FaSeedling />,
      title: "Farming",
      kicker: "Field advice",
      tone: "#34d399",
      summary: humid || rainy
        ? `${city} fields need moisture and fungal-risk checks today.`
        : hot
          ? `${city} crops may need cooler-hour irrigation and heat-stress monitoring.`
          : `${city} conditions look manageable for routine crop checks.`,
      cards: [
        ["Irrigation", rainy ? "Pause watering and inspect drainage." : hot ? "Water during cooler hours." : "Check soil before watering."],
        ["Spraying", windy ? "Delay sprays to avoid drift." : humid ? "Avoid unnecessary spray during high humidity." : "Light spray work is more manageable."],
        ["Inspection", "Check leaves, soil moisture, pests, and exposed young plants."],
      ],
    },
    aqi: {
      icon: <FaSmog />,
      title: "AQI",
      kicker: "Air quality",
      tone: "#10b981",
      summary: getAqiAdvice(city, aqi, aqiLabel),
      cards: [
        ["AQI Level", Number.isFinite(aqi) && aqi > 0 ? `${aqi} - ${aqiLabel}` : "Live AQI unavailable."],
        ["Outdoor Plan", aqi > 150 ? "Prefer indoor plans and avoid long exposure." : "Normal outdoor movement is reasonable with personal comfort checks."],
        ["Health Cue", aqi > 100 ? "Sensitive users should carry medication or a mask if needed." : "Air quality is not a major limiter right now."],
      ],
    },
  };

  return { ...common, ...(insights[type] || insights.weather) };
};

const FeatureInsight = () => {
  const [params] = useSearchParams();
  const type = params.get("type") || "weather";
  const city = params.get("city") || "your location";
  const temp = getNumberParam(params, "temp", 28);
  const feels = getNumberParam(params, "feels", temp);
  const humidity = getNumberParam(params, "humidity", 60);
  const wind = getNumberParam(params, "wind", 12);
  const aqi = getNumberParam(params, "aqi", 0);
  const aqiLabel = params.get("aqiLabel") || "Unavailable";
  const condition = params.get("condition") || "current weather";
  const insight = getInsight({ type, city, temp, feels, humidity, wind, condition, aqi, aqiLabel });

  return (
    <main className="feature-insight">
      <div className="feature-insight__bg" />
      <section className="feature-insight__panel" style={{ "--insight-tone": insight.tone }}>
        <header className="feature-insight__header">
          <Link to="/" className="feature-insight__back">Back to dashboard</Link>
          <div className="feature-insight__hero">
            <div className="feature-insight__icon">{insight.icon}</div>
            <div>
              <p>{insight.kicker}</p>
              <h1>{insight.title}</h1>
            </div>
          </div>
          <p className="feature-insight__summary">{insight.summary}</p>
        </header>

        <div className="feature-insight__stats">
          <span><FaCloudSun /> {city}</span>
          <span><FaTint /> {humidity}% humidity</span>
          <span><FaWind /> {wind} km/h wind</span>
          {type === "aqi" && <span><FaSmog /> AQI {aqi > 0 ? aqi : "--"}</span>}
          <span>{condition}</span>
        </div>

        <div className="feature-insight__cards">
          {insight.cards.map(([title, text]) => (
            <article key={title} className="feature-insight__card">
              <span>{title}</span>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default FeatureInsight;
