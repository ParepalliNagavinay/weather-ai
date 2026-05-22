export const askWeatherChat = async ({ question, location }) => {
  const apiUrl = window.location.hostname.endsWith(".netlify.app")
    ? "/.netlify/functions/weather-chat"
    : "/api/weather-chat";

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

  if (!response.ok) {
    throw new Error(
      payload.error && contentType.includes("application/json")
        ? payload.error
        : "Weather chatbot service is unavailable."
    );
  }

  return payload;
};
