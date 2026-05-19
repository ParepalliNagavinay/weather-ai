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
