import { Link, useSearchParams } from "react-router-dom";
import PhotoWeatherAlert from "../components/PhotoWeatherAlert";
import {
  FaCamera,
  FaImage,
  FaLightbulb,
  FaShieldAlt,
  FaSun,
  FaCloudRain,
  FaWind,
  FaUmbrella,
} from "react-icons/fa";

const getNumberParam = (params, key, fallback) => {
  const value = Number(params.get(key));
  return Number.isFinite(value) ? value : fallback;
};

const buildPhotoSuggestions = ({ temp, feels, humidity, wind, condition, mode }) => {
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

  // General lighting settings based on weather
  let light = "";
  if (hasRain) {
    light = "Soft, diffused, moody light. Low contrast with rich reflections on wet surfaces. Great for cinematic, reflective portraits.";
  } else if (hasFog) {
    light = "Mysterious, highly diffused light. Low visibility allows for atmospheric depth, isolating your subjects from the background.";
  } else if (isHot) {
    light = "Harsh mid-day sun. Focus on shooting during golden hours (early morning/late afternoon) for soft, warm side-lighting.";
  } else {
    light = "Clear, vibrant light. Excellent contrast. Perfect for sunset or sunrise silhouettes, backlighting, or dramatic shadow play.";
  }

  // Customize lighting suggestion slightly based on mode
  if (mode === "couple") {
    light += " Aim for warm backlighting (sunset rim light) to create a romantic, glowing aura around the couple.";
  } else if (mode === "kids") {
    light += " Use high-key, bright lighting. If shooting in harsh sun, find shade to prevent kids squinting or harsh shadows under their eyes.";
  } else if (mode === "single") {
    light += " Look for dramatic side-lighting to highlight facial structures and create moody, high-contrast portraits.";
  } else if (mode === "family" || mode === "friends") {
    light += " Keep lighting even across the entire group. Avoid putting some people in shadows and others in direct sunlight.";
  }

  // Recommended Gear based on weather & mode
  let gear = "";
  if (hasRain) {
    gear = "Camera rain sleeve, lens hood (to block rain drops), microfiber cloths.";
  } else if (isWindy) {
    gear = "Sturdy tripod, sandbag to weigh it down, remote shutter trigger.";
  } else {
    gear = "ND filter (for long exposure skies), circular polariser.";
  }

  // Add lens recommendations based on photoshoot mode
  if (mode === "single") {
    gear += " Use a fast prime lens (85mm or 50mm f/1.4 or f/1.8) for shallow depth-of-field and creamy background bokeh.";
  } else if (mode === "couple") {
    gear += " Use an 85mm prime or 70-200mm telephoto lens to keep distance and capture candid, unposed moments.";
  } else if (mode === "family") {
    gear += " Use a standard zoom lens (24-70mm f/2.8) or a 35mm prime to fit the whole family comfortably in the frame.";
  } else if (mode === "friends") {
    gear += " Use a wide-angle lens (24mm or 16-35mm) to capture fun, wide perspectives of your group of friends.";
  } else if (mode === "kids") {
    gear += " Use a fast-focusing telephoto lens (e.g. 70-200mm f/2.8) so you can shoot from afar without distracting them.";
  }

  // Packing list
  const packing = [
    hasRain ? "Camera rain cover & silica gel packs in bag." : "UV filter & lens hood for glare protection.",
  ];

  if (mode === "kids") {
    packing.push("Toys or treats to grab kids' attention towards the camera.");
    packing.push("Shutter speed: 1/500s or faster to freeze rapid movements.");
  } else if (mode === "couple") {
    packing.push("A portable Bluetooth speaker for music to help the couple relax.");
    packing.push("Warm/Gold reflector to enhance sunset skin tones.");
  } else if (mode === "family") {
    packing.push("Coordinating outfits/colors (avoid busy matching patterns).");
    packing.push("A tripod so the photographer can jump in or guide poses.");
  } else if (mode === "friends") {
    packing.push("Matching or complementary accessories for a cohesive group look.");
    packing.push("An extra wide tripod or selfie extension mount.");
  } else {
    // Single
    packing.push("A wireless shutter remote or intervalometer for self-portraits.");
    packing.push(isHot ? "Extra batteries (heat drains them faster)." : isCool ? "Keep batteries in pockets near body heat." : "Standard cleaning kit (air blower, wipes).");
  }

  // Recommended subjects/compositions
  let subjects = [];
  if (mode === "single") {
    if (hasRain) {
      subjects = ["Solitary traveler with a vibrant umbrella", "Rain droplets on window with face in soft focus", "Reflections in street puddles", "Walking away down empty wet streets"];
    } else if (hasFog) {
      subjects = ["Minimalist portrait emerging from fog", "Mysterious silhouette against streetlights", "Moody portrait sitting on a park bench", "Stark vertical compositions"];
    } else {
      subjects = ["Golden hour close-up portraits", "Dramatic shadows casting across face", "Sun-drenched lens flare portrait", "Silhouette against sunset sky"];
    }
  } else if (mode === "couple") {
    if (hasRain) {
      subjects = ["Couple sharing a single umbrella close-up", "Romantic embrace under falling rain", "Walking hand-in-hand through neon wet streets", "Backlit raindrops forming a halo around them"];
    } else if (hasFog) {
      subjects = ["Cozy coffee shop window portraits", "Holding hands fading into misty paths", "Cozy cuddle wrapped in a blanket in fog", "Moody silhouette profile shot"];
    } else {
      subjects = ["Romantic sunset silhouette kiss", "Dancing under golden hour flares", "Candid laughter running together", "Backlit hand holding close-up"];
    }
  } else if (mode === "family") {
    if (hasRain) {
      subjects = ["Family huddled under a giant golf umbrella", "Kids jumping in puddles, parents watching", "Cozy indoor window lighting group portrait", "Spontaneous laughter running to shelter"];
    } else if (hasFog) {
      subjects = ["Family walking down a misty forest path", "Huddled close together in soft fog", "Fun group portraits with mist background", "Atmospheric silhouette holding hands"];
    } else {
      subjects = ["Family walking abreast holding hands", "Parents lifting small kids in golden light", "Candid group laugh seated on a picnic blanket", "Interactive playtime shots"];
    }
  } else if (mode === "friends") {
    if (hasRain) {
      subjects = ["Group of friends splashing in rain puddles", "Sharing umbrellas and laughing in streets", "Warm coffee shop group selfies", "Cinematic night neon rain group shot"];
    } else if (hasFog) {
      subjects = ["Group emerging from foggy landscape", "Atmospheric silhouettes on misty bridge", "Fun group stack in fog", "Mysterious moody street walk"];
    } else {
      subjects = ["Jumping in unison against sunset silhouette", "Group selfie backlit by warm sun", "Friends sitting in a row pointing at horizon", "Action sports/games in open field"];
    }
  } else if (mode === "kids") {
    if (hasRain) {
      subjects = ["Child in bright yellow raincoat splashing", "Staring in wonder at raindrops falling", "Holding a small colorful umbrella", "Pressing face against rainy window"];
    } else if (hasFog) {
      subjects = ["Child running into misty fields", "Spooky-fun fog hide and seek", "Candid portrait with soft foggy background", "Child holding a light in mist"];
    } else {
      subjects = ["Chasing bubbles in golden sunset light", "Running towards camera laughing", "Close-up child smile in soft shadows", "Playing in autumn leaves or flower field"];
    }
  }

  // Warnings
  const warnings = [];
  if (hasRain) {
    warnings.push("Wipe camera immediately if wet. Never swap lenses outdoors in wet conditions.");
  }
  if (isWindy) {
    warnings.push("Watch out for blowing dust or sand getting into lens barrels. Use filter.");
  }
  if (isHumid) {
    warnings.push("Acclimatize lens slowly when moving from AC to prevent glass condensation.");
  }

  // Photoshoot type warnings
  if (mode === "kids") {
    warnings.push("Keep sessions short (under 45 minutes) to avoid temper tantrums or fatigue.");
  } else if (mode === "family") {
    warnings.push("Ensure comfortable footwear; family members might get tired of walking between spots.");
  }

  if (warnings.length === 0) {
    warnings.push("No immediate gear concerns. Happy shooting!");
  }

  return { light, gear, packing, subjects, warnings };
};

const Photography = () => {
  const [params] = useSearchParams();
  const city = params.get("city") || "your location";
  const condition = params.get("condition") || "current weather";
  const temp = getNumberParam(params, "temp", 28);
  const feels = getNumberParam(params, "feels", temp);
  const humidity = getNumberParam(params, "humidity", 60);
  const wind = getNumberParam(params, "wind", 12);
  const sunsetUnix = getNumberParam(params, "sunset", 0) || null;

  const photoshootMode = params.get("mode") || "single";

  const modeLabels = {
    single: { label: "Single Photoshoot", emoji: "👤" },
    couple: { label: "Couple Photoshoot", emoji: "❤️" },
    family: { label: "Family Photoshoot", emoji: "👨‍👩‍👧" },
    friends: { label: "Friends Photoshoot", emoji: "👫" },
    kids:   { label: "Kids Photoshoot",   emoji: "🧒" },
  };

  const activeMode = modeLabels[photoshootMode] || modeLabels.single;

  const suggestions = buildPhotoSuggestions({
    temp,
    feels,
    humidity,
    wind,
    condition,
    mode: photoshootMode,
  });

  return (
    <main className="detail-page detail-page--photo">
      {/* Background Orbs */}
      <div className="detail-page__bg-effects">
        <div className="detail-page__orb detail-page__orb--1" />
        <div className="detail-page__orb detail-page__orb--2" />
      </div>

      <div className="detail-page__content">
        {/* Header */}
        <header className="detail-page__header">
          <Link to="/" className="detail-page__back-btn">
            &larr; Back to weather
          </Link>

          <div className="detail-page__stats">
            <div className="detail-page__stat-badge">
              <FaSun />
              <span>{temp}&deg;C</span>
            </div>
            <div className="detail-page__stat-badge">
              <FaSun />
              <span>Feels {feels}&deg;C</span>
            </div>
            <div className="detail-page__stat-badge">
              <FaUmbrella />
              <span>Humidity {humidity}%</span>
            </div>
            <div className="detail-page__stat-badge">
              <FaWind />
              <span>Wind {wind} km/h</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="detail-page__hero">
          <p className="detail-page__subtitle">Photography Suggestions</p>
          <h1 className="detail-page__title">{city}</h1>
          <div className="detail-page__mode-badge">
            <span className="detail-page__mode-emoji">{activeMode.emoji}</span>
            <span className="detail-page__mode-label">{activeMode.label}</span>
          </div>
          <p className="detail-page__desc">
            Current weather is {condition}. Here is a weather-aware photography guide for lighting, gear protection, and recommended compositions.
          </p>
        </section>

        {/* Content Grid */}
        <div className="detail-page__grid">
          {/* Card 1: Lighting Conditions */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaLightbulb className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Lighting Conditions</h2>
            </div>
            <p className="detail-page__card-text">{suggestions.light}</p>
          </article>

          {/* Card 2: Recommended Gear */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaCamera className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Recommended Gear</h2>
            </div>
            <p className="detail-page__card-text">{suggestions.gear}</p>
          </article>

          {/* Card 3: Camera Care & Packing */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaShieldAlt className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Camera Care & Packing</h2>
            </div>
            <ul className="detail-page__list">
              {suggestions.packing.map((item) => (
                <li key={item} className="detail-page__list-item">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Card 4: Recommended Subjects */}
          <article className="detail-page__card">
            <div className="detail-page__card-header">
              <FaImage className="detail-page__card-icon" />
              <h2 className="detail-page__card-title">Recommended Subjects</h2>
            </div>
            <div className="detail-page__pills-grid">
              {suggestions.subjects.map((subject) => (
                <div key={subject} className="detail-page__pill-item">
                  <FaCamera className="detail-page__pill-icon" />
                  <span className="detail-page__pill-text">{subject}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Bottom Warning Card */}
        <section className="detail-page__alert-card">
          <div className="detail-page__alert-header">
            {condition.toLowerCase().includes("rain") ? (
              <FaCloudRain className="detail-page__alert-icon" />
            ) : wind >= 28 ? (
              <FaWind className="detail-page__alert-icon" />
            ) : (
              <FaSun className="detail-page__alert-icon" />
            )}
            <h2 className="detail-page__alert-title">Gear Warnings</h2>
          </div>
          <div className="detail-page__alert-grid">
            {suggestions.warnings.map((warning) => (
              <div key={warning} className="detail-page__alert-item">
                {warning}
              </div>
            ))}
          </div>
        </section>
        {/* AI Photography Weather Alerts */}
        <PhotoWeatherAlert
          condition={condition}
          humidity={humidity}
          wind={wind}
          city={city}
          sunsetUnix={sunsetUnix}
          mode={photoshootMode}
        />
      </div>
    </main>
  );
};

export default Photography;
