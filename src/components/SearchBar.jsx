import { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiX, FiMapPin } from "react-icons/fi";
import axios from "axios";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const SearchBar = ({ city, setCity, fetchWeather }) => {
  const [inputValue, setInputValue]   = useState(city);
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const debounceTimer = useRef(null);
  const containerRef  = useRef(null);

  // ── Close dropdown when clicking outside ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch city suggestions (debounced 400 ms) ─────────────────────────
  const fetchSuggestions = useCallback(async (query) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(GEOCODING_URL, {
        params: { name: query, count: 6, language: "en", format: "json" },
      });
      const results = data.results || [];
      setSuggestions(results);
      setShowDrop(results.length > 0);
    } catch {
      setSuggestions([]);
      setShowDrop(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Handle input change with debounce ─────────────────────────────────
  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const submitSearch = () => {
    const nextCity = inputValue.trim();
    if (!nextCity) return;
    clearTimeout(debounceTimer.current);
    setSuggestions([]);
    setShowDrop(false);
    fetchWeather(nextCity);
  };

  // ── Select a suggestion ───────────────────────────────────────────────
  const handleSelect = (suggestion) => {
    const name = suggestion.name;
    setInputValue(name);
    setCity(name);
    setSuggestions([]);
    setShowDrop(false);
    fetchWeather(name);
  };

  // ── Enter key search ──────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      submitSearch();
    }
    if (e.key === "Escape") {
      setShowDrop(false);
    }
  };

  // ── Clear input ───────────────────────────────────────────────────────
  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowDrop(false);
  };

  return (
    <div className="searchbar" ref={containerRef}>
      <div className="searchbar__icon">
        <FiSearch />
      </div>

      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowDrop(true)}
        placeholder="Search city..."
        className="searchbar__input"
        aria-label="Search city"
        autoComplete="off"
      />

      {/* Loading spinner or clear button */}
      {loading ? (
        <span className="searchbar__spinner" aria-hidden="true" />
      ) : inputValue ? (
        <button
          className="searchbar__clear"
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={-1}
        >
          <FiX />
        </button>
      ) : null}

      <button
        onClick={submitSearch}
        className="searchbar__btn"
        aria-label="Search"
      >
        <FiSearch />
        <span>Search</span>
      </button>

      {/* ── Autocomplete dropdown ── */}
      {showDrop && (
        <ul className="searchbar__dropdown" role="listbox">
          {suggestions.map((s) => (
            <li
              key={`${s.id}-${s.name}`}
              className="searchbar__option"
              role="option"
              onMouseDown={() => handleSelect(s)}
            >
              <FiMapPin className="searchbar__option-icon" />
              <span className="searchbar__option-name">{s.name}</span>
              {(s.admin1 || s.country) && (
                <span className="searchbar__option-meta">
                  {[s.admin1, s.country].filter(Boolean).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
