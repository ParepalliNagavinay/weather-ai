import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaCamera,
  FaCloudSun,
  FaImage,
  FaMapMarkedAlt,
  FaSeedling,
  FaTemperatureHigh,
  FaTint,
  FaTimes,
  FaUpload,
  FaWind,
} from "react-icons/fa";

const analyzeScene = (imageSrc) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 160;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, size, size);

      const { data } = ctx.getImageData(0, 0, size, size);
      let brightness = 0;
      let greenPixels = 0;
      let skyPixels = 0;
      let warmPixels = 0;
      let contrastTotal = 0;
      let previousLum = null;
      const pixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const lum = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
        brightness += lum;

        if (green > red * 1.08 && green > blue * 1.08 && green > 70) greenPixels += 1;
        if (blue > red * 1.05 && blue > green * 0.92 && lum > 0.45) skyPixels += 1;
        if (red > blue * 1.18 && green > blue * 0.88 && lum > 0.38) warmPixels += 1;
        if (previousLum !== null) contrastTotal += Math.abs(lum - previousLum);
        previousLum = lum;
      }

      resolve({
        brightness: brightness / pixels,
        greenery: greenPixels / pixels,
        sky: skyPixels / pixels,
        warmLight: warmPixels / pixels,
        contrast: contrastTotal / pixels,
      });
    };
    image.onerror = reject;
    image.src = imageSrc;
  });

const getSceneLabel = (analysis) => {
  if (!analysis) return "Image ready";
  if (analysis.greenery > 0.22) return "Green outdoor scene";
  if (analysis.sky > 0.2) return "Open sky scene";
  if (analysis.warmLight > 0.18) return "Warm light scene";
  if (analysis.brightness < 0.34) return "Low-light scene";
  return "Mixed outdoor scene";
};

const buildSuggestions = ({ weather, analysis }) => {
  if (!weather || !analysis) return null;

  const temp = weather.main.temp;
  const humidity = weather.main.humidity;
  const windKmh = weather.wind.speed * 3.6;
  const condition = weather.weather[0].description.toLowerCase();
  const rainy = condition.includes("rain") || condition.includes("drizzle") || condition.includes("storm");
  const foggy = condition.includes("fog");
  const hot = temp >= 33;
  const windy = windKmh >= 28;
  const greenScene = analysis.greenery > 0.22;
  const skyScene = analysis.sky > 0.18;
  const warmScene = analysis.warmLight > 0.16;
  const lowLight = analysis.brightness < 0.34;

  const travel = [];
  if (rainy) travel.push("Keep the route flexible and prefer covered stops; roads may slow down near this location.");
  else if (hot) travel.push("Plan outdoor movement earlier or later in the day and carry extra water.");
  else if (windy) travel.push("Avoid exposed viewpoints and secure loose bags or hats.");
  else travel.push("Weather looks comfortable for short outdoor stops around this location.");

  if (skyScene) travel.push("The open sky in the image suits viewpoints, lakesides, and walking routes.");
  else if (greenScene) travel.push("The greenery suggests a park or field visit; use shoes that can handle damp ground.");
  else travel.push("Use the current city forecast as the main planning signal for timing and comfort.");

  const photoshoot = [];
  if (rainy) photoshoot.push("Use covered frames, reflections, and a rain-safe camera setup.");
  else if (foggy) photoshoot.push("Use the mist for soft portraits and keep subjects close to the lens.");
  else if (warmScene) photoshoot.push("Warm tones in the image are good for portraits, silhouettes, and backlit shots.");
  else if (lowLight) photoshoot.push("Use a tripod or wider aperture; the scene may need steadier exposure.");
  else photoshoot.push("Natural light looks workable; place the subject facing soft light.");

  if (windy) photoshoot.push("Keep shutter speed faster and avoid lightweight stands.");
  if (skyScene && !rainy) photoshoot.push("Include the sky for wide compositions and golden-hour framing.");

  const farming = [];
  if (greenScene) farming.push("The field/greenery cue suggests checking soil moisture before watering.");
  else farming.push("Use weather data first; the image does not show strong crop or field coverage.");

  if (rainy || humidity >= 75) farming.push("Watch for fungal risk and avoid spraying unless the crop plan allows it.");
  else if (hot) farming.push("Irrigate during cooler hours and protect young plants from heat stress.");
  else if (windy) farming.push("Delay pesticide or nutrient spray because wind can cause drift.");
  else farming.push("Conditions look manageable for inspection, light weeding, and routine crop checks.");

  return { travel, photoshoot, farming };
};

const ImageWeatherAdvisor = ({ weather, city, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const locationName = weather?.name || city || "selected location";
  const conditionText = weather?.weather?.[0]?.description || "weather";
  const suggestions = useMemo(
    () => buildSuggestions({ weather, analysis }),
    [weather, analysis]
  );
  const sceneMetrics = analysis
    ? [
        { label: "Light", value: analysis.brightness, tone: "#f59e0b" },
        { label: "Greenery", value: analysis.greenery, tone: "#10b981" },
        { label: "Sky", value: analysis.sky, tone: "#38bdf8" },
        { label: "Warmth", value: analysis.warmLight, tone: "#f97316" },
      ]
    : [];

  const featureCards = suggestions
    ? [
        {
          title: "Travelling",
          icon: <FaMapMarkedAlt />,
          accent: "#38bdf8",
          items: suggestions.travel,
        },
        {
          title: "Photoshoot",
          icon: <FaImage />,
          accent: "#a78bfa",
          items: suggestions.photoshoot,
        },
        {
          title: "Farming",
          icon: <FaSeedling />,
          accent: "#34d399",
          items: suggestions.farming,
        },
      ]
    : [];

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    setCameraReady(false);
  };

  const startCamera = async () => {
    setStatus("Starting camera...");
    setCameraReady(false);
    setIsOpen(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera access is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      console.error(error);
      setStatus("Camera permission was blocked or no camera was found. Upload an image instead.");
    }
  };

  const waitForVideoFrame = (video) =>
    new Promise((resolve, reject) => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        resolve();
        return;
      }

      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Camera frame was not ready."));
      }, 2500);

      const cleanup = () => {
        window.clearTimeout(timeout);
        video.removeEventListener("loadeddata", handleReady);
        video.removeEventListener("canplay", handleReady);
      };

      const handleReady = () => {
        cleanup();
        resolve();
      };

      video.addEventListener("loadeddata", handleReady, { once: true });
      video.addEventListener("canplay", handleReady, { once: true });
    });

  const openPanel = () => {
    setStatus("");
    setIsOpen(true);
  };

  const closePanel = () => {
    stopCamera();
    setIsOpen(false);
  };

  const handleImage = async (src) => {
    setImageSrc(src);
    setStatus("Analyzing image...");
    try {
      const result = await analyzeScene(src);
      setAnalysis(result);
      setStatus("");
    } catch (error) {
      console.error(error);
      setAnalysis(null);
      setStatus("Could not analyze this image. Try another photo.");
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) {
      setStatus("Camera is not ready yet. Try again in a moment.");
      return;
    }

    try {
      setStatus("Capturing image...");
      await video.play();
      await waitForVideoFrame(video);

      const settings = streamRef.current.getVideoTracks()[0]?.getSettings?.() || {};
      canvas.width = video.videoWidth || settings.width || 1280;
      canvas.height = video.videoHeight || settings.height || 720;

      const ctx = canvas.getContext("2d");
      if (!ctx || canvas.width <= 0 || canvas.height <= 0) {
        throw new Error("Could not read camera frame.");
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      await handleImage(canvas.toDataURL("image/jpeg", 0.92));
      stopCamera();
    } catch (error) {
      console.error(error);
      setStatus("Could not capture the camera image. Try Upload Image instead.");
    }
  };

  const uploadPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleImage(URL.createObjectURL(file));
    stopCamera();
    event.target.value = "";
  };

  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return;

    const video = videoRef.current;
    let cancelled = false;

    const attachStream = async () => {
      try {
        video.srcObject = streamRef.current;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");

        await video.play();
        await waitForVideoFrame(video);

        if (!cancelled) {
          setCameraReady(true);
          setStatus("");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCameraReady(false);
          setStatus("Camera opened, but the video preview is not ready yet.");
        }
      }
    };

    attachStream();

    return () => {
      cancelled = true;
    };
  }, [cameraActive]);

  useEffect(() => () => stopCamera(), []);

  return (
    <>
      <button
        type="button"
        className="image-advisor__fab"
        onClick={openPanel}
        aria-label="Open camera weather advisor"
        title="Open camera weather advisor"
      >
        <FaCamera />
      </button>

      {isOpen && (
        <div className="image-advisor" role="dialog" aria-modal="true">
          <div className={`image-advisor__panel ${darkMode ? "image-advisor__panel--dark" : "image-advisor__panel--light"}`}>
            <div className="image-advisor__header">
              <div>
                <p className="image-advisor__eyebrow">Image Weather Advisor</p>
                <h2 className="image-advisor__title">{locationName}</h2>
                <div className="image-advisor__weather-strip">
                  <span><FaTemperatureHigh />{Math.round(weather.main.temp)}&deg;C</span>
                  <span><FaTint />{weather.main.humidity}%</span>
                  <span><FaWind />{Math.round(weather.wind.speed * 3.6)} km/h</span>
                </div>
              </div>
              <button
                type="button"
                className="image-advisor__close"
                onClick={closePanel}
                aria-label="Close image weather advisor"
              >
                <FaTimes />
              </button>
            </div>

            <div className="image-advisor__hero-grid">
              <div className="image-advisor__media">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    className="image-advisor__video"
                    autoPlay
                    playsInline
                    muted
                  />
                ) : imageSrc ? (
                  <img src={imageSrc} alt="Selected weather scene" className="image-advisor__preview" />
                ) : (
                  <div className="image-advisor__empty">
                    <FaCloudSun />
                    <span>Capture or upload a place photo</span>
                  </div>
                )}
                <div className="image-advisor__media-overlay">
                  <span>{analysis ? getSceneLabel(analysis) : "Scene scan ready"}</span>
                  <strong>{conditionText}</strong>
                </div>
                <canvas ref={canvasRef} className="image-advisor__canvas" />
              </div>

              <div className="image-advisor__insight-panel">
                <p className="image-advisor__insight-label">Visual Signals</p>
                {analysis ? (
                  <div className="image-advisor__metrics">
                    {sceneMetrics.map((metric) => (
                      <div className="image-advisor__metric" key={metric.label}>
                        <div className="image-advisor__metric-top">
                          <span>{metric.label}</span>
                          <strong>{Math.round(metric.value * 100)}%</strong>
                        </div>
                        <div className="image-advisor__metric-track">
                          <span
                            style={{
                              width: `${Math.max(4, Math.round(metric.value * 100))}%`,
                              background: metric.tone,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="image-advisor__feature-preview">
                    <span><FaMapMarkedAlt /> Travel</span>
                    <span><FaImage /> Photo</span>
                    <span><FaSeedling /> Farm</span>
                  </div>
                )}
              </div>
            </div>

            <div className="image-advisor__actions">
              <button
                type="button"
                className="image-advisor__action image-advisor__action--primary"
                onClick={cameraActive ? capturePhoto : startCamera}
                disabled={cameraActive && !cameraReady}
              >
                <FaCamera />
                <span>
                  {cameraActive
                    ? cameraReady
                      ? "Click Photo"
                      : "Loading Camera"
                    : "Open Camera"}
                </span>
              </button>
              <button
                type="button"
                className="image-advisor__action"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaUpload />
                <span>Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                className="image-advisor__file"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={uploadPhoto}
              />
            </div>

            {status && <p className="image-advisor__status">{status}</p>}

            <div className="image-advisor__suggestions">
              {featureCards.length > 0 ? (
                featureCards.map((card) => (
                  <article
                    className="image-advisor__card"
                    key={card.title}
                    style={{ "--card-accent": card.accent }}
                  >
                    <div className="image-advisor__card-head">
                      <span className="image-advisor__card-icon">{card.icon}</span>
                      <h3>{card.title}</h3>
                    </div>
                    {card.items.map((item) => <p key={item}>{item}</p>)}
                  </article>
                ))
              ) : (
                <div className="image-advisor__placeholder-grid">
                  <div><FaMapMarkedAlt /><span>Travel route comfort</span></div>
                  <div><FaImage /><span>Photoshoot light quality</span></div>
                  <div><FaSeedling /><span>Farming field advice</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageWeatherAdvisor;
