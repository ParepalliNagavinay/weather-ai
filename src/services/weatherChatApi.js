export const askWeatherChat = async ({ question, location }) => {
  const isNetlify = window.location.hostname.endsWith(".netlify.app");
  const apiUrls = isNetlify
    ? ["/.netlify/functions/weather-chat", "/api/weather-chat"]
    : ["/api/weather-chat", "/.netlify/functions/weather-chat"];

  let lastError;

  for (const apiUrl of apiUrls) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, location }),
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (response.ok) return payload;

      lastError =
        payload.error && contentType.includes("application/json")
          ? payload.error
          : "Weather chatbot service is unavailable.";

      if (response.status !== 404) break;
    } catch (error) {
      lastError = error.message;
    }
  }

  throw new Error(lastError || "Weather chatbot service is unavailable.");
};
