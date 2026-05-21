import emailjs from '@emailjs/browser';

export const sendTemperatureAlert = async (
  email,
  city,
  temperature,
  humidity,
  condition
) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("EmailJS configuration is missing. Cannot send alert email.");
    return false;
  }
  
  let message;

if (temperature > 35) {
  message =
    "It's very hot outside. Stay hydrated and avoid afternoon travel.";
}
else if (condition.toLowerCase().includes("rain")) {
  message =
    "Rain expected today. Carry an umbrella before travelling.";
}
else if (condition.toLowerCase().includes("thunderstorm")) {
  message =
    "Thunderstorm alert. Avoid outdoor activities if possible.";
}
else {
  message =
    "Weather looks pleasant today. Good time for travel.";
}
 const templateParams = {
  
  to_email: email,
  user_name: "Vinay",
  city: city,
  temp: temperature.toFixed(1),
  humidity: humidity,
  condition: condition,
  message: message,
};

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    console.log("SUCCESS!", response.status, response.text);
    return true;
  } catch (error) {
    console.error("FAILED to send email.", error);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Photography Golden Hour Alert
// ─────────────────────────────────────────────────────────────────────────────

const MODE_TIPS = {
  single: {
    label: "Single Photoshoot",
    emoji: "👤",
    tips: "Use an 85mm or 50mm prime lens for dramatic side-lighting portraits. Find a spot with a clean background and use the golden backlight to create a glowing rim effect.",
    gear: "85mm/50mm prime lens, wireless shutter remote, reflector.",
  },
  couple: {
    label: "Couple Photoshoot",
    emoji: "❤️",
    tips: "Position the couple with the sun behind them for a romantic rim-light glow. Use a 70-200mm telephoto from a distance to capture candid, unposed moments.",
    gear: "70-200mm telephoto lens, warm gold reflector, Bluetooth speaker for ambiance.",
  },
  family: {
    label: "Family Photoshoot",
    emoji: "👨‍👩‍👧",
    tips: "Keep lighting even across the whole group. A 35mm or 24-70mm zoom is ideal. Scout a spot with open shade nearby for backup.",
    gear: "24-70mm f/2.8 zoom, sturdy tripod, extra batteries.",
  },
  friends: {
    label: "Friends Photoshoot",
    emoji: "👫",
    tips: "Use a wide-angle lens to capture the whole group dynamically. Try jumping shots and silhouettes against the sunset. Candid laughter in golden light looks stunning.",
    gear: "16-35mm wide-angle, extra memory cards, tripod for group shots.",
  },
  kids: {
    label: "Kids Photoshoot",
    emoji: "🧒",
    tips: "Use a fast telephoto (70-200mm f/2.8) so you can shoot from a distance without distracting them. Keep shutter speed above 1/500s to freeze movement.",
    gear: "70-200mm f/2.8, high-speed burst mode, toys or treats for attention.",
  },
};

/**
 * Checks whether current weather conditions are a good match for the
 * selected photoshoot mode and golden hour shooting.
 *
 * Returns { match: boolean, reason: string }
 */
export const checkPhotographyConditions = (condition, humidity, wind, mode) => {
  const cond = condition.toLowerCase();
  const hasRain = cond.includes("rain") || cond.includes("storm") || cond.includes("drizzle");
  const hasFog  = cond.includes("fog");
  const isWindy = wind >= 35;
  const isOvercast = cond.includes("overcast");

  // Universal blockers
  if (hasRain) return { match: false, reason: "Rain is expected — not ideal for outdoor photography." };
  if (hasFog && mode !== "single" && mode !== "couple") {
    return { match: false, reason: "Foggy conditions limit visibility for group photoshoots." };
  }

  // Mode-specific checks
  if (mode === "kids" && isWindy) {
    return { match: false, reason: "High winds make it difficult to keep kids comfortable outdoors." };
  }
  if (mode === "family" && isWindy) {
    return { match: false, reason: "Strong winds may disrupt a comfortable family photoshoot." };
  }

  // Positive matches
  if (cond.includes("clear") || cond.includes("mainly clear")) {
    return { match: true, reason: "Clear skies mean perfect golden hour light — excellent conditions!" };
  }
  if (cond.includes("partly cloudy") || cond.includes("cloud")) {
    return { match: true, reason: "Partial clouds add drama to the sky — great for dynamic shots!" };
  }
  if (hasFog && (mode === "single" || mode === "couple")) {
    return { match: true, reason: "Misty fog creates a romantic, atmospheric mood — perfect for your shoot!" };
  }
  if (isOvercast && humidity < 70) {
    return { match: true, reason: "Soft overcast light is great for even, flattering skin tones." };
  }

  return { match: true, reason: "Conditions look suitable for your photoshoot." };
};

/**
 * Sends a photography golden-hour alert email via EmailJS.
 */
export const sendPhotographyAlert = async ({
  email,
  city,
  mode,
  condition,
  humidity,
  wind,
  goldenStart,
  goldenEnd,
  sunsetQuality,
  stage,
  alertTime,
}) => {
  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("EmailJS configuration is missing.");
    return false;
  }

  const modeInfo = MODE_TIPS[mode] || MODE_TIPS.single;
  const stageInfo = stage || {
    step: 1,
    title: "Golden Hour Alert",
    when: "before golden hour",
    time: alertTime,
    desc: "Perfect lighting window approaching!",
  };
  const stageAdvice = {
    "Early Prediction":
      "Review the location, confirm the shoot plan, and keep batteries charging.",
    "Preparation Alert":
      "Pack your camera, lens, memory cards, reflector, and weather protection now.",
    "Live Alert":
      "Move to your shooting spot and start testing exposure. The best light is close.",
  }[stageInfo.title] || "Get your camera ready and keep an eye on the light.";

  const message = `
📸 PHOTOGRAPHY GOLDEN HOUR ALERT ${modeInfo.emoji}

Hi! Your ${stageInfo.title} for ${city} is ready.

MULTI-STAGE ALERT
Stage ${stageInfo.step}: ${stageInfo.title}
Scheduled Time : ${stageInfo.time}
Timing         : ${stageInfo.when}
Message        : ${stageInfo.desc}

🌅 Photoshoot Type : ${modeInfo.label}
📍 Location        : ${city}
☁️  Weather        : ${condition}
💧 Humidity        : ${humidity}%
💨 Wind Speed      : ${wind} km/h

⏰ BEST GOLDEN HOUR WINDOW
   ${goldenStart} – ${goldenEnd}

⭐ Sunset Quality   : ${sunsetQuality} / 100
🔔 Alert Sent At   : ${alertTime}

WHAT TO DO NOW:
${stageAdvice}

📷 PRO TIPS FOR YOUR SHOOT:
${modeInfo.tips}

🎒 RECOMMENDED GEAR:
${modeInfo.gear}

Get your camera ready — the perfect light is approaching!
  `.trim();

  const templateParams = {
    to_email:  email,
    user_name: email.split("@")[0],
    city,
    subject: `${stageInfo.title} - ${city} photography alert`,
    temp:      "-",
    humidity,
    condition,
    alert_stage: stageInfo.title,
    alert_time: stageInfo.time,
    message,
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log("Photography alert sent!", response.status);
    return true;
  } catch (error) {
    console.error("Failed to send photography alert.", error);
    return false;
  }
};
