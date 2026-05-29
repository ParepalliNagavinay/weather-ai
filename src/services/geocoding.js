import axios from "axios";

export const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const INDIA_ALIASES = new Map([
  ["bangalore", "bengaluru"],
  ["bengaluru", "bangalore"],
  ["bombay", "mumbai"],
  ["mumbai", "bombay"],
  ["calcutta", "kolkata"],
  ["kolkata", "calcutta"],
  ["madras", "chennai"],
  ["chennai", "madras"],
  ["poona", "pune"],
  ["pune", "poona"],
  ["baroda", "vadodara"],
  ["vadodara", "baroda"],
  ["cochin", "kochi"],
  ["kochi", "cochin"],
  ["trivandrum", "thiruvananthapuram"],
  ["thiruvananthapuram", "trivandrum"],
  ["pondicherry", "puducherry"],
  ["puducherry", "pondicherry"],
]);

export const normalizePlaceName = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const getEditDistance = (first, second) => {
  const rows = first.length + 1;
  const cols = second.length + 1;
  const distance = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) distance[row][0] = row;
  for (let col = 0; col < cols; col += 1) distance[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = first[row - 1] === second[col - 1] ? 0 : 1;
      distance[row][col] = Math.min(
        distance[row - 1][col] + 1,
        distance[row][col - 1] + 1,
        distance[row - 1][col - 1] + cost
      );
    }
  }

  return distance[first.length][second.length];
};

const getNameSimilarity = (first, second) => {
  if (!first || !second) return 0;
  const maxLength = Math.max(first.length, second.length);
  if (maxLength === 0) return 1;
  return 1 - getEditDistance(first, second) / maxLength;
};

const getLocationParts = (location) =>
  [
    location.name,
    location.admin1,
    location.admin2,
    location.admin3,
    location.country,
    location.country_code,
  ]
    .filter(Boolean)
    .map(normalizePlaceName);

const getQueryNames = (query) => {
  const normalized = normalizePlaceName(query);
  const alias = INDIA_ALIASES.get(normalized);
  return alias ? [normalized, alias] : [normalized];
};

export const isValidLocationMatch = (query, location) => {
  const queryNames = getQueryNames(query);
  const locationParts = getLocationParts(location);

  return queryNames.some((queryName) =>
    locationParts.some((part) => {
      if (!part) return false;
      if (part === queryName || part.includes(queryName) || queryName.includes(part)) {
        return true;
      }

      return queryName.length >= 4 && getNameSimilarity(queryName, part) >= 0.72;
    })
  );
};

export const createInvalidCityError = (city) => {
  const error = new Error(`Enter correct city name for "${city}".`);
  error.code = "INVALID_CITY";
  return error;
};

const scoreLocation = (query, location) => {
  const queryNames = getQueryNames(query);
  const name = normalizePlaceName(location.name);
  const parts = getLocationParts(location);
  const explicitRegionMatch = queryNames.some((queryName) =>
    parts.some((part) => part !== name && part.length > 2 && queryName.includes(part))
  );
  const exactNameScore = queryNames.some((queryName) => queryName === name) ? 100 : 0;
  const containsScore = queryNames.some((queryName) => name.includes(queryName) || queryName.includes(name)) ? 35 : 0;
  const fuzzyScore = Math.max(...queryNames.map((queryName) => getNameSimilarity(queryName, name))) * 30;
  const indiaScore = location.country_code === "IN" ? 60 : 0;
  const queryRegionScore = explicitRegionMatch ? 120 : 0;
  const populationScore = Math.min(Math.log10((location.population ?? 0) + 1) * 2, 15);

  return exactNameScore + containsScore + fuzzyScore + indiaScore + queryRegionScore + populationScore;
};

export const geocodeCity = async (city) => {
  const searchNames = [...new Set(getQueryNames(city))];
  const responses = await Promise.all(
    searchNames.map((name) =>
      axios.get(GEOCODING_URL, {
        params: {
          name,
          count: 10,
          language: "en",
          format: "json",
        },
      })
    )
  );
  const locations = responses.flatMap(({ data }) => data.results ?? []);
  const uniqueLocations = Array.from(
    new Map(locations.map((location) => [location.id ?? `${location.latitude},${location.longitude}`, location])).values()
  );
  const matches = uniqueLocations.filter((location) => isValidLocationMatch(city, location));

  if (matches.length === 0) {
    throw createInvalidCityError(city);
  }

  return matches
    .map((location) => ({ location, score: scoreLocation(city, location) }))
    .sort((a, b) => b.score - a.score)[0].location;
};
