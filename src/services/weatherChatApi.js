export const askWeatherChat = async ({ question, location }) => {
  const response = await fetch("/api/weather-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, location }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to answer this weather question.");
  }

  return payload;
};
