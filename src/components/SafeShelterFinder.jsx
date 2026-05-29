import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClinicMedical,
  FaCloudRain,
  FaCoffee,
  FaDirections,
  FaHospital,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaSubway,
  FaSyncAlt,
} from "react-icons/fa";
import { fetchNearbyShelters, shelterCategoryList } from "../services/shelterApi";

const categoryIcons = {
  all: <FaMapMarkerAlt />,
  cafe: <FaCoffee />,
  metro: <FaSubway />,
  mall: <FaShoppingBag />,
  hospital: <FaHospital />,
};

const isShelterWeather = (weather) => {
  const description = weather?.weather?.[0]?.description?.toLowerCase() ?? "";
  const code = weather?.weather?.[0]?.id;
  return (
    description.includes("rain") ||
    description.includes("drizzle") ||
    description.includes("thunder") ||
    code >= 95
  );
};

const getWeatherSignal = (weather) => {
  const description = weather?.weather?.[0]?.description ?? "current weather";
  if (isShelterWeather(weather)) {
    return {
      label: "Shelter mode active",
      message: `${description} detected. Prioritizing dry, public, and emergency-safe places nearby.`,
    };
  }

  return {
    label: "Shelter mode ready",
    message: "When rain or storms start, this finder highlights nearby indoor stops and emergency options.",
  };
};

const getCategoryCount = (shelters, category) => {
  if (category === "all") return shelters.length;
  return shelters.filter((shelter) => shelter.category === category).length;
};

const SafeShelterFinder = ({ city, weather, darkMode }) => {
  const [shelterResult, setShelterResult] = useState({ key: "", items: [] });
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isActiveWeather = isShelterWeather(weather);
  const coords = weather?.coord;
  const coordsKey = coords ? `${coords.lat},${coords.lon}` : "";
  const shelters = useMemo(
    () => (shelterResult.key === coordsKey ? shelterResult.items : []),
    [coordsKey, shelterResult]
  );
  const currentError = shelterResult.key === coordsKey ? error : "";
  const signal = getWeatherSignal(weather);

  const categories = useMemo(
    () => [{ key: "all", label: "All" }, ...shelterCategoryList],
    []
  );

  const filteredShelters = useMemo(() => {
    if (activeCategory === "all") return shelters;
    return shelters.filter((shelter) => shelter.category === activeCategory);
  }, [activeCategory, shelters]);

  const nearestShelter = shelters[0];

  const loadShelters = useCallback(async () => {
    if (!coords) return;

    setLoading(true);
    setError("");
    try {
      const data = await fetchNearbyShelters(coords);
      setShelterResult({ key: `${coords.lat},${coords.lon}`, items: data });
      if (data.length === 0) {
        setError("No mapped shelters found nearby. Try a wider city center or search again shortly.");
      }
    } catch (shelterError) {
      setError(
        shelterError.code === "SHELTER_API_UNAVAILABLE"
          ? "Overpass is busy right now. Please tap refresh again in a moment."
          : "Shelter map data is temporarily unavailable."
      );
      setShelterResult({ key: `${coords.lat},${coords.lon}`, items: [] });
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    if (isActiveWeather && coords) {
      const timerId = window.setTimeout(() => {
        loadShelters();
      }, 0);

      return () => window.clearTimeout(timerId);
    }
    return undefined;
  }, [city, coords, isActiveWeather, loadShelters]);

  return (
    <section className={`safe-shelter ${darkMode ? "safe-shelter--dark" : "safe-shelter--light"}`}>
      <div className="safe-shelter__header">
        <div className="safe-shelter__badge">
          <FaClinicMedical />
          <span>{signal.label}</span>
        </div>
        <button
          type="button"
          className="safe-shelter__refresh"
          onClick={loadShelters}
          disabled={loading || !coords}
          aria-label="Refresh nearby shelters"
        >
          <FaSyncAlt />
        </button>
      </div>

      <div className="safe-shelter__hero">
        <div>
          <p className="safe-shelter__eyebrow">Nearby Safe Shelter Finder</p>
          <h2>{city}</h2>
          <p>{signal.message}</p>
        </div>
        <div className="safe-shelter__storm-icon" aria-hidden="true">
          <FaCloudRain />
        </div>
      </div>

      {nearestShelter && (
        <div className="safe-shelter__nearest">
          <span>Closest safe stop</span>
          <strong>{nearestShelter.name}</strong>
          <small>
            {nearestShelter.categoryLabel} - {nearestShelter.distanceLabel}
          </small>
        </div>
      )}

      <div className="safe-shelter__filters" aria-label="Shelter categories">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            className={`safe-shelter__filter${activeCategory === category.key ? " safe-shelter__filter--active" : ""}`}
            onClick={() => setActiveCategory(category.key)}
          >
            {categoryIcons[category.key]}
            <span>{category.label}</span>
            <b>{getCategoryCount(shelters, category.key)}</b>
          </button>
        ))}
      </div>

      {loading && (
        <div className="safe-shelter__loading">
          <span />
          <p>Scanning Overpass for cafes, metro stations, malls, and hospitals...</p>
        </div>
      )}

      {!loading && currentError && <p className="safe-shelter__error">{currentError}</p>}

      {!loading && !currentError && shelters.length === 0 && (
        <div className="safe-shelter__standby">
          <FaMapMarkerAlt />
          <p>Automatic shelter scanning starts during rain or storm alerts.</p>
          <button type="button" onClick={loadShelters} disabled={!coords}>
            Scan nearby now
          </button>
        </div>
      )}

      {!loading && filteredShelters.length > 0 && (
        <div className="safe-shelter__list">
          {filteredShelters.slice(0, 6).map((shelter) => (
            <article className={`safe-shelter-item safe-shelter-item--${shelter.category}`} key={shelter.id}>
              <span className="safe-shelter-item__icon">{categoryIcons[shelter.category]}</span>
              <div className="safe-shelter-item__content">
                <div>
                  <h3>{shelter.name}</h3>
                  <p>{shelter.address || shelter.categoryLabel}</p>
                </div>
                <div className="safe-shelter-item__meta">
                  <span>{shelter.distanceLabel}</span>
                  <span>{shelter.openNow}</span>
                </div>
              </div>
              <a
                className="safe-shelter-item__route"
                href={shelter.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open directions to ${shelter.name}`}
              >
                <FaDirections />
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default SafeShelterFinder;
