import { Link, useSearchParams } from "react-router-dom";
import {
  FaCloudRain,
  FaCompass,
  FaMapMarkedAlt,
  FaMountain,
  FaRegClock,
  FaSun,
  FaUmbrella,
  FaWind,
} from "react-icons/fa";
import bgImage from "../assets/nature.jpg";

const getNumberParam = (params, key, fallback) => {
  const value = Number(params.get(key));
  return Number.isFinite(value) ? value : fallback;
};

const buildSuggestions = ({ temp, feels, humidity, wind, condition }) => {
  const atmosphere = condition.toLowerCase();
  const hasRain =
    atmosphere.includes("rain") ||
    atmosphere.includes("drizzle") ||
    atmosphere.includes("thunderstorm") ||
    atmosphere.includes("shower");
  const hasFog = atmosphere.includes("fog");
  const isHot = temp >= 32 || feels >= 35;
  const isCool = temp <= 18;
  const isHumid = humidity >= 70;
  const isWindy = wind >= 28;

  const timing = hasRain
    ? "Plan flexible indoor stops and travel between rain breaks."
    : isHot
      ? "Start early morning or after sunset to avoid the strongest heat."
      : hasFog
        ? "Keep sightseeing later in the day when visibility improves."
        : "The atmosphere looks friendly for city walks and outdoor sightseeing.";

  const transport = hasRain
    ? "Use cabs, metro, or covered transport for short hops between places."
    : isWindy
      ? "Choose sturdy transport and avoid open two-wheel rides on exposed roads."
      : "Walking, metro, and short rides should be comfortable for local exploring.";

  const packing = [
    hasRain ? "Carry an umbrella or light rain jacket." : "Carry sunglasses and water.",
    isHot ? "Wear breathable cotton clothes." : isCool ? "Add a light jacket." : "Dress in light layers.",
    isHumid ? "Keep a small towel and extra water handy." : "Comfortable shoes should be enough.",
  ];

  const activities = hasRain
    ? ["Museums", "Cafes", "Shopping streets with cover", "Indoor food spots"]
    : isHot
      ? ["Botanical gardens early", "Lakeside evenings", "Malls", "Shaded heritage walks"]
      : hasFog
        ? ["Late-morning viewpoints", "Cafes", "Markets", "Short city drives"]
        : ["Parks", "Viewpoints", "Street food areas", "Walking tours"];

  const alerts = [];

  if (hasRain) {
    alerts.push("Roads may be slow or slippery, so keep extra travel time.");
  }

  if (isHot) {
    alerts.push("Avoid long outdoor queues during afternoon hours.");
  }

  if (isWindy) {
    alerts.push("Skip exposed rooftop or high-viewpoint plans if gusts increase.");
  }

  if (alerts.length === 0) {
    alerts.push("No major weather concern. Keep your plan light and flexible.");
  }

  return { timing, transport, packing, activities, alerts };
};

const Travel = () => {
  const [params] = useSearchParams();
  const city = params.get("city") || "your location";
  const condition = params.get("condition") || "current weather";
  const temp = getNumberParam(params, "temp", 28);
  const feels = getNumberParam(params, "feels", temp);
  const humidity = getNumberParam(params, "humidity", 60);
  const wind = getNumberParam(params, "wind", 12);
  const suggestions = buildSuggestions({ temp, feels, humidity, wind, condition });

  return (
    <main
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="min-h-screen bg-slate-950/88 px-4 py-8 backdrop-blur-md sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="inline-flex min-h-[3.5rem] w-fit items-center justify-center rounded-full border border-white/25 px-8 text-base sm:text-lg font-bold text-sky-100 transition hover:bg-white/10 hover:border-white/50"
            >
              Back to weather
            </Link>

            <div className="grid grid-cols-2 gap-4 text-base sm:text-xl lg:text-2xl font-bold sm:grid-cols-4">
              <span className="flex items-center justify-center rounded-2xl bg-white/15 px-6 py-4 shadow-md backdrop-blur-sm transition-transform hover:scale-105">{temp}&deg;C</span>
              <span className="flex items-center justify-center rounded-2xl bg-white/15 px-6 py-4 shadow-md backdrop-blur-sm transition-transform hover:scale-105">Feels {feels}&deg;C</span>
              <span className="flex items-center justify-center rounded-2xl bg-white/15 px-6 py-4 shadow-md backdrop-blur-sm transition-transform hover:scale-105">Humidity {humidity}%</span>
              <span className="flex items-center justify-center rounded-2xl bg-white/15 px-6 py-4 shadow-md backdrop-blur-sm transition-transform hover:scale-105">Wind {wind} km/h</span>
            </div>
          </header>

          <section className="py-6 lg:py-8">
            <p className="text-sm sm:text-base font-extrabold uppercase tracking-[0.16em] text-emerald-300">
              Travel suggestions
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight sm:text-7xl">
              {city}
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-semibold text-slate-200 sm:text-2xl leading-relaxed">
              Current atmosphere is {condition}. Here is a weather-aware travel plan for
              comfort, timing, and safer movement around the location.
            </p>
          </section>

          <section className="grid gap-6 lg:gap-8 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/10 p-6 lg:p-8 shadow-2xl backdrop-blur-sm">
              <FaRegClock className="text-4xl text-emerald-300" />
              <h2 className="mt-5 text-2xl lg:text-3xl font-black">Best Travel Timing</h2>
              <p className="mt-3 text-lg lg:text-xl font-medium leading-relaxed text-slate-100">
                {suggestions.timing}
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/10 p-6 lg:p-8 shadow-2xl backdrop-blur-sm">
              <FaCompass className="text-4xl text-sky-300" />
              <h2 className="mt-5 text-2xl lg:text-3xl font-black">Getting Around</h2>
              <p className="mt-3 text-lg lg:text-xl font-medium leading-relaxed text-slate-100">
                {suggestions.transport}
              </p>
            </article>
          </section>

          <section className="grid gap-6 lg:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-2xl border border-white/10 bg-white/10 p-6 lg:p-8 shadow-2xl backdrop-blur-sm">
              <FaUmbrella className="text-4xl text-yellow-300" />
              <h2 className="mt-5 text-2xl lg:text-3xl font-black">Carry With You</h2>
              <ul className="mt-5 space-y-4">
                {suggestions.packing.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-950/40 px-5 py-4 text-lg font-medium">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/10 p-6 lg:p-8 shadow-2xl backdrop-blur-sm">
              <FaMapMarkedAlt className="text-4xl text-rose-300" />
              <h2 className="mt-5 text-2xl lg:text-3xl font-black">Recommended Plans</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {suggestions.activities.map((activity) => (
                  <div
                    key={activity}
                    className="flex min-h-[5rem] items-center gap-4 rounded-xl bg-slate-950/40 px-5 py-4 text-lg font-bold"
                  >
                    <FaMountain className="shrink-0 text-2xl text-emerald-300" />
                    <span>{activity}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/10 p-6 lg:p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {condition.toLowerCase().includes("rain") ? (
                <FaCloudRain className="text-4xl text-sky-300" />
              ) : wind >= 28 ? (
                <FaWind className="text-4xl text-sky-300" />
              ) : (
                <FaSun className="text-4xl text-yellow-300" />
              )}
              <h2 className="text-2xl lg:text-3xl font-black">Weather Notes</h2>
            </div>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {suggestions.alerts.map((alert) => (
                <li key={alert} className="rounded-xl bg-slate-950/40 px-5 py-4 text-lg font-medium">
                  {alert}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Travel;
