import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bgImage from "../assets/nature.jpg";
import { supabase } from "../services/supabase";

const getAuthErrorMessage = (error, isSignup) => {
  const message = error?.message ?? "Something went wrong. Please try again.";
  const normalizedMessage = message.toLowerCase();

  if (error?.status === 429 || normalizedMessage.includes("rate limit")) {
    return isSignup
      ? "Supabase is temporarily limiting signup emails. Please wait before creating another account, then try once."
      : "Too many login attempts. Please wait before trying again.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "We could not log you in. Check your email and password, or create an account first.";
  }

  if (isSignup && normalizedMessage.includes("already registered")) {
    return "An account already exists for this email. Try logging in instead.";
  }

  return message;
};

const RATE_LIMIT_COOLDOWN_SECONDS = 60;
const getRateLimitStorageKey = (type) =>
  `weather-ai-auth-${type}-rate-limit-until`;

const getStoredCooldownSeconds = (type) => {
  const storedUntil = Number(
    window.localStorage.getItem(getRateLimitStorageKey(type))
  );

  if (!storedUntil) return 0;

  return Math.max(Math.ceil((storedUntil - Date.now()) / 1000), 0);
};

const storeCooldown = (type, seconds) => {
  window.localStorage.setItem(
    getRateLimitStorageKey(type),
    String(Date.now() + seconds * 1000)
  );
};

const clearStoredCooldown = (type) => {
  window.localStorage.removeItem(getRateLimitStorageKey(type));
};

const Auth = ({ type }) => {
  const isSignup = type === "signup";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(() => {
    const storedSeconds = getStoredCooldownSeconds(type);

    if (storedSeconds === 0) {
      clearStoredCooldown(type);
    }

    return storedSeconds;
  });
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!cooldownSeconds) return undefined;

    const timerId = window.setInterval(() => {
      setCooldownSeconds((seconds) => {
        const nextSeconds = Math.max(seconds - 1, 0);

        if (nextSeconds === 0) {
          clearStoredCooldown(type);
        }

        return nextSeconds;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [cooldownSeconds, type]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingRef.current || cooldownSeconds > 0) return;

    setMessage("");
    setMessageType("info");
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const credentials = {
      email: email.trim().toLowerCase(),
      password,
    };
    const trimmedName = name.trim();

    let data;
    let error;

    try {
      const response = isSignup
        ? await supabase.auth.signUp({
            ...credentials,
            options: {
              data: {
                full_name: trimmedName,
              },
              emailRedirectTo: window.location.origin,
            },
          })
        : await supabase.auth.signInWithPassword(credentials);

      data = response.data;
      error = response.error;
    } catch (requestError) {
      error = requestError;
    }

    isSubmittingRef.current = false;
    setIsSubmitting(false);

    if (error) {
      if (
        error?.status === 429 ||
        error?.message?.toLowerCase().includes("rate limit")
      ) {
        setCooldownSeconds(RATE_LIMIT_COOLDOWN_SECONDS);
        storeCooldown(type, RATE_LIMIT_COOLDOWN_SECONDS);
      }

      setMessage(getAuthErrorMessage(error, isSignup));
      setMessageType("error");
      return;
    }

    if (isSignup) {
      const needsConfirmation = data.user && !data.session;

      if (!needsConfirmation) {
        navigate("/", { replace: true });
        return;
      }

      setMessage(
        "Account created. Check your inbox, confirm your email, then log in."
      );
      setMessageType("success");
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <main
      className="auth-page text-white"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="auth-overlay">
        <section className="auth-card">
          <Link
            to="/"
            className="auth-home-link"
          >
            Back to Weather
          </Link>

          <div className="auth-header">
            <h1 className="auth-title">
              {isSignup ? "Create account" : "Login"}
            </h1>
            <p className="auth-subtitle">
              {isSignup
                ? "Sign up to keep your weather searches ready."
                : "Welcome back to your weather dashboard."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="auth-label">
                Name
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </label>
            )}

            <label className="auth-label">
              Email
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

            <label className="auth-label">
              Password
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={6}
                  required
                />
              </label>

            {message && (
              <p className={`auth-message auth-message-${messageType}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting || cooldownSeconds > 0}
            >
              {isSubmitting
                ? "Please wait..."
                : cooldownSeconds > 0
                ? `Try again in ${cooldownSeconds}s`
                : isSignup
                ? "Sign up"
                : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "Do not have an account?"}{" "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="auth-switch-link"
            >
              {isSignup ? "Login" : "Sign up"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default Auth;
