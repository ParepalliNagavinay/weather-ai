import { useEffect, useRef, useState } from "react";
import { FaLocationArrow, FaPaperPlane, FaRobot, FaTimes } from "react-icons/fa";
import { askWeatherChat } from "../services/weatherChatApi";

const starterPrompts = [
  "Will it rain today?",
  "Is it safe for outdoor travel?",
  "Explain today's atmosphere",
];

const WeatherChatbot = ({ city, weather, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState(city);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about weather, rain, humidity, wind, pressure, UV, or atmosphere for any location.",
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    setLocation(city);
  }, [city]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const sendQuestion = async (nextQuestion = question) => {
    const trimmedQuestion = nextQuestion.trim();
    const trimmedLocation = location.trim();

    if (!trimmedQuestion || !trimmedLocation || isThinking) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmedQuestion },
    ]);
    setQuestion("");
    setIsThinking(true);

    try {
      const result = await askWeatherChat({
        question: trimmedQuestion,
        location: trimmedLocation,
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.answer,
          meta:
            result.source === "local-weather-fallback"
              ? `${result.resolvedLocation} · Live weather fallback`
              : result.resolvedLocation,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error.message ||
            "I could not reach the weather chatbot service right now.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuestion();
  };

  const temp = weather ? `${Math.round(weather.main.temp)}°C` : "Live";
  const condition = weather?.weather?.[0]?.description || "weather context";

  return (
    <div className="weather-chatbot-shell">
      <button
        className="weather-chatbot-launcher"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close weather chatbot" : "Open weather chatbot"}
        aria-expanded={isOpen}
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
      </button>

      {isOpen && (
        <section
          className={`weather-chatbot ${
            darkMode ? "weather-chatbot--dark" : "weather-chatbot--light"
          }`}
          aria-label="Weather chatbot"
        >
          <div className="weather-chatbot__header">
            <div className="weather-chatbot__badge">
              <FaRobot />
            </div>
            <div>
              <span className="weather-chatbot__eyebrow">Google AI weather chat</span>
              <h2 className="weather-chatbot__title">Ask about the atmosphere</h2>
              <p className="weather-chatbot__context">
                {city} · {temp} · {condition}
              </p>
            </div>
          </div>

          <label className="weather-chatbot__location">
            <FaLocationArrow />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Enter location name"
              aria-label="Chat location"
            />
          </label>

          <div className="weather-chatbot__messages" ref={messagesRef}>
            {messages.map((message, index) => (
              <div
                className={`weather-chatbot__message weather-chatbot__message--${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.meta && (
                  <span className="weather-chatbot__meta">{message.meta}</span>
                )}
                <p>{message.text}</p>
              </div>
            ))}
            {isThinking && (
              <div className="weather-chatbot__message weather-chatbot__message--assistant">
                <p>Checking the latest weather and thinking...</p>
              </div>
            )}
          </div>

          <div className="weather-chatbot__prompts" aria-label="Suggested questions">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendQuestion(prompt)}
                disabled={isThinking}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className="weather-chatbot__form" onSubmit={handleSubmit}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about rain, pressure, humidity, wind..."
              aria-label="Weather question"
            />
            <button type="submit" disabled={isThinking || !question.trim()}>
              <FaPaperPlane />
              <span>Send</span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default WeatherChatbot;
