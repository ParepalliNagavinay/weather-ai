import { useState, useEffect, useMemo } from "react";
import { FaBell, FaClock, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { MdWbTwilight } from "react-icons/md";
import { supabase } from "../services/supabase";
import {
  checkPhotographyConditions,
  sendPhotographyAlert,
} from "../services/emailService";

// ── Compute golden-hour window from sunset unix timestamp ──────────────────
const getGoldenHourWindow = (sunsetUnix) => {
  if (!sunsetUnix) return null;
  const sunset = new Date(sunsetUnix * 1000);
  const goldenStart = new Date(sunset.getTime() - 40 * 60 * 1000); // 40 min before
  const goldenEnd   = new Date(sunset.getTime() + 20 * 60 * 1000); // 20 min after

  const fmt = (d) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return {
    start: fmt(goldenStart),
    end: fmt(goldenEnd),
    startDate: goldenStart,
    endDate: goldenEnd,
  };
};

// ── Compute sunset quality score (0-100) ──────────────────────────────────
const getSunsetQuality = (condition, humidity, wind) => {
  const cond = condition.toLowerCase();
  const hasRain = cond.includes("rain") || cond.includes("storm") || cond.includes("drizzle");
  const hasFog  = cond.includes("fog");
  const hasClouds = cond.includes("cloud") || cond.includes("overcast");
  const isClear   = cond.includes("clear");

  let score = 65;
  if (isClear)    score += 15;
  if (hasClouds && !hasRain) score += 20; // dramatic clouds = great sunset
  if (hasRain)    score -= 30;
  if (hasFog)     score -= 15;
  if (humidity < 50) score += 5;
  if (wind < 15)     score += 5;
  score = Math.max(10, Math.min(100, score));

  let label = "Poor";
  if (score >= 85) label = "Excellent";
  else if (score >= 70) label = "Good";
  else if (score >= 50) label = "Moderate";

  return { score, label };
};

// ── Multi-stage alert times relative to sunset ────────────────────────────
const getAlertStages = (sunsetUnix) => {
  if (!sunsetUnix) return [];
  const sunset = new Date(sunsetUnix * 1000);
  const goldenStart = new Date(sunset.getTime() - 40 * 60 * 1000);

  const early = new Date(sunset.getTime() - 2.5 * 60 * 60 * 1000);
  const prep  = new Date(goldenStart.getTime() - 60 * 60 * 1000);
  const live  = new Date(sunset.getTime() - 15 * 60 * 1000);

  const fmt = (d) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return [
    {
      id: "early-prediction",
      step: 1,
      color: "#6366f1",
      title: "Early Prediction",
      when: "2–3 hours before",
      time: fmt(early),
      alertAt: early,
      desc: "Strong chance of beautiful sunset.",
    },
    {
      id: "preparation-alert",
      step: 2,
      color: "#10b981",
      title: "Preparation Alert",
      when: "1 hour before",
      time: fmt(prep),
      alertAt: prep,
      desc: "Golden hour begins in 1 hour. Get ready!",
    },
    {
      id: "live-alert",
      step: 3,
      color: "#f59e0b",
      title: "Live Alert",
      when: "15 minutes before",
      time: fmt(live),
      alertAt: live,
      desc: "Perfect lighting window approaching!",
    },
  ];
};

const stageStatusLabels = {
  scheduled: "Email scheduled",
  due: "Sending now",
  sending: "Sending...",
  sent: "Email sent",
  failed: "Email failed",
  expired: "Expired",
  "login-required": "Login required",
};

const modeImages = {
  single:  { src: "/mode-single.jpg",  alt: "Solo golden hour portrait silhouette" },
  couple:  { src: "/mode-couple.jpg",  alt: "Couple golden hour silhouette" },
  family:  { src: "/mode-family.jpg",  alt: "Family golden hour silhouette" },
  friends: { src: "/mode-friends.jpg", alt: "Friends golden hour silhouette" },
  kids:    { src: "/mode-kids.jpg",    alt: "Child playing in golden hour light" },
};

const PhotoWeatherAlert = ({ condition, humidity, wind, city, sunsetUnix, mode }) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [alertStatus, setAlertStatus] = useState("idle");
  const [stageStatuses, setStageStatuses] = useState({});
  const goldenHour = useMemo(() => getGoldenHourWindow(sunsetUnix), [sunsetUnix]);
  const quality = useMemo(
    () => getSunsetQuality(condition, humidity, wind),
    [condition, humidity, wind]
  );
  const stages = useMemo(() => getAlertStages(sunsetUnix), [sunsetUnix]);
  const heroImg    = modeImages[mode] || modeImages.single;
  const conditionMatch = useMemo(
    () => checkPhotographyConditions(condition, humidity, wind, mode),
    [condition, humidity, wind, mode]
  );
  const activeStage = selectedStage;

  useEffect(() => {
    if (!sunsetUnix || !conditionMatch.match || !goldenHour) {
      queueMicrotask(() => setStageStatuses({}));
      return undefined;
    }

    const timeoutIds = [];
    let cancelled = false;

    const schedulePhotographyAlert = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;

      if (error || !data.user?.email) {
        setAlertStatus("login-required");
        setStageStatuses(
          stages.reduce((next, stage) => {
            next[stage.id] = "login-required";
            return next;
          }, {})
        );
        return;
      }

      const user = data.user;
      const now = Date.now();
      const todayKey = new Date(sunsetUnix * 1000).toISOString().slice(0, 10);

      if (now >= goldenHour.endDate.getTime()) {
        setAlertStatus("expired");
        setStageStatuses(
          stages.reduce((next, stage) => {
            next[stage.id] = "expired";
            return next;
          }, {})
        );
        return;
      }

      const setStageStatus = (stageId, status) => {
        setStageStatuses((current) => ({
          ...current,
          [stageId]: status,
        }));
      };

      let hasPendingStage = false;

      stages.forEach((stage) => {
        const alertKey = [
          "photo_alert_sent",
          user.id,
          city.toLowerCase(),
          mode,
          todayKey,
          stage.id,
          stage.alertAt.getTime(),
        ].join("_");

        if (localStorage.getItem(alertKey)) {
          setStageStatus(stage.id, "sent");
          return;
        }

        const sendStageAlert = async () => {
          if (cancelled || localStorage.getItem(alertKey)) return;

          setAlertStatus("sending");
          setStageStatus(stage.id, "sending");

          const sent = await sendPhotographyAlert({
            email: user.email,
            city,
            mode,
            condition,
            humidity,
            wind,
            goldenStart: goldenHour.start,
            goldenEnd: goldenHour.end,
            sunsetQuality: quality.score,
            stage: {
              step: stage.step,
              title: stage.title,
              when: stage.when,
              time: stage.time,
              desc: stage.desc,
            },
            alertTime: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          });

          if (sent) {
            localStorage.setItem(alertKey, "true");
            setStageStatus(stage.id, "sent");
            setAlertStatus("scheduled");
          } else {
            setStageStatus(stage.id, "failed");
            setAlertStatus("failed");
          }
        };

        const delay = stage.alertAt.getTime() - now;
        hasPendingStage = true;
        setStageStatus(stage.id, delay <= 0 ? "due" : "scheduled");
        timeoutIds.push(window.setTimeout(sendStageAlert, Math.max(delay, 0)));
      });

      setAlertStatus(hasPendingStage ? "scheduled" : "sent");
    };

    schedulePhotographyAlert();

    return () => {
      cancelled = true;
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [
    city,
    condition,
    conditionMatch.match,
    goldenHour,
    humidity,
    mode,
    quality.score,
    stages,
    sunsetUnix,
    wind,
  ]);

  const modeLabel =
    mode === "couple"  ? "couple photoshoot" :
    mode === "family"  ? "family photoshoot" :
    mode === "friends" ? "friends photoshoot" :
    mode === "kids"    ? "kids photoshoot" :
    "photoshoot";

  const statusText = {
    idle: "Waiting for sunset timing",
    scheduled: "Multi-stage email alerts scheduled",
    due: "Sending alert now",
    sending: "Sending alert...",
    sent: "Email alerts already sent",
    failed: "Email alert failed",
    expired: "Today's golden hour has passed",
    "login-required": "Login required for email alert",
    "not-matched": conditionMatch.reason,
  }[conditionMatch.match ? alertStatus : "not-matched"];

  return (
    <section className="photo-alert">
      {/* Section heading */}
      <div className="photo-alert__heading">
        <MdWbTwilight className="photo-alert__heading-icon" />
        <div>
          <h2 className="photo-alert__title">AI Photography Weather Alerts</h2>
          <p className="photo-alert__subtitle">Get alerts for perfect photography conditions.</p>
        </div>
      </div>

      <div className="photo-alert__body">
        {/* ── Left: golden-hour card ── */}
        <div className="photo-alert__card">
          {/* Hero image */}
          <div className="photo-alert__img-wrap">
            <img
              key={heroImg.src}
              src={heroImg.src}
              alt={heroImg.alt}
              className="photo-alert__img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>

          {/* Info panel */}
          <div className="photo-alert__info">
            <h3 className="photo-alert__info-title">
              Golden Hour Alert <span className="photo-alert__sparkle">✨</span>
            </h3>
            <p className="photo-alert__info-desc">
              Perfect golden-hour conditions today for {modeLabel}!
            </p>

            {goldenHour && (
              <div className="photo-alert__row">
                <span className="photo-alert__row-label">
                  <FaClock style={{ marginRight: "0.4rem" }} />Best Time
                </span>
                <span className="photo-alert__row-value">
                  {goldenHour.start} – {goldenHour.end}
                </span>
              </div>
            )}

            <div className="photo-alert__row">
              <span className="photo-alert__row-label">
                <FaStar style={{ marginRight: "0.4rem" }} />Sunset Quality
              </span>
              <span className="photo-alert__row-value">
                {quality.score}&nbsp;/&nbsp;100&nbsp;
                <span
                  className="photo-alert__quality-tag"
                  style={{
                    color:
                      quality.score >= 85 ? "#f59e0b" :
                      quality.score >= 70 ? "#10b981" : "#94a3b8",
                  }}
                >
                  {quality.label}
                </span>
              </span>
            </div>

            <div className="photo-alert__row">
              <span className="photo-alert__row-label">
                <FaMapMarkerAlt style={{ marginRight: "0.4rem" }} />Location
              </span>
              <span className="photo-alert__row-value photo-alert__row-value--light">
                {city}
              </span>
            </div>

            <div className="photo-alert__bell-row">
              <FaBell className="photo-alert__bell-icon" />
              <span className="photo-alert__bell-label">Alert Emails</span>
              <span className="photo-alert__bell-value">{stages.length} Stages</span>
            </div>
            {statusText && (
              <p className="photo-alert__status">
                {statusText}
              </p>
            )}
          </div>
        </div>

        {/* ── Right: multi-stage timeline ── */}
        <div className="photo-alert__stages">
          <p className="photo-alert__stages-heading">
            <span className="photo-alert__stages-dot" />
            Multi-Stage Alerts
          </p>

          {stages.map((stage, idx) => (
            <div
              key={stage.step}
              className={`photo-alert__stage ${
                activeStage === idx ? "photo-alert__stage--active" : ""
              }`}
              onClick={() => setSelectedStage(idx === selectedStage ? null : idx)}
            >
              {/* connector line above (not for first) */}
              {idx > 0 && (
                <div
                  className="photo-alert__connector"
                  style={{ borderColor: stage.color }}
                />
              )}

              <div className="photo-alert__stage-header">
                <span
                  className="photo-alert__stage-num"
                  style={{ background: stage.color }}
                >
                  {stage.step}
                </span>
                <div className="photo-alert__stage-meta">
                  <span
                    className="photo-alert__stage-title"
                    style={{ color: stage.color }}
                  >
                    {stage.title}
                  </span>
                  <span className="photo-alert__stage-when">{stage.when}</span>
                  {stage.time && (
                    <span className="photo-alert__stage-time">⏰ {stage.time}</span>
                  )}
                </div>
              </div>
              <p className="photo-alert__stage-desc">{stage.desc}</p>
              {stageStatuses[stage.id] && (
                <span className="photo-alert__stage-status">
                  {stageStatusLabels[stageStatuses[stage.id]]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhotoWeatherAlert;
