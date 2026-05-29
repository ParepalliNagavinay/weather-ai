import axios from "axios";
import { geocodeCity } from "./geocoding";

const ORS_BASE = "https://api.openrouteservice.org/v2";
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY;

const routeTypeLabels = ["Recommended", "Fastest", "Safer weather"];
const MAX_ROUTE_POINTS = 22;

const getRoutePoints = (coordinates = []) => {
  if (!coordinates.length) return [];

  const sampleEvery = Math.max(1, Math.floor(coordinates.length / MAX_ROUTE_POINTS));
  const sampled = coordinates.filter((_, index) => index % sampleEvery === 0);
  const points = sampled.at(-1) === coordinates.at(-1)
    ? sampled
    : [...sampled, coordinates.at(-1)];
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const lonRange = maxLon - minLon || 1;
  const latRange = maxLat - minLat || 1;

  return points.map(([longitude, latitude]) => ({
    x: Number((8 + ((longitude - minLon) / lonRange) * 84).toFixed(1)),
    y: Number((84 - ((latitude - minLat) / latRange) * 68).toFixed(1)),
  }));
};

const getMajorRoads = (steps) => {
  const roads = steps
    .map((step) => step.name)
    .filter((name) => name && name !== "-")
    .filter((name, index, list) => list.indexOf(name) === index);

  return roads.slice(0, 3);
};

const toRouteOption = (feature, index) => {
  const summary = feature?.properties?.summary ?? {};
  const segments = feature?.properties?.segments ?? [];
  const steps = segments[0]?.steps ?? [];
  const coordinates = feature?.geometry?.coordinates ?? [];

  return {
    id: feature?.properties?.id ?? `route-${index + 1}`,
    label: `Route zone ${index + 1}`,
    type: routeTypeLabels[index] ?? `Option ${index + 1}`,
    distanceKm: Number((summary.distance / 1000).toFixed(1)),
    durationMin: Math.round(summary.duration / 60),
    routePoints: getRoutePoints(coordinates),
    majorRoads: getMajorRoads(steps),
    steps: steps.slice(0, 8).map((s) => ({
      instruction: s.instruction,
      distanceKm: Number((s.distance / 1000).toFixed(1)),
      durationMin: Math.round(s.duration / 60),
    })),
  };
};

const buildFallbackRouteOptions = (route) => {
  if (!route) return [];

  const variants = [
    { distanceFactor: 1, durationFactor: 1 },
    { distanceFactor: 0.96, durationFactor: 0.92 },
    { distanceFactor: 1.08, durationFactor: 1.12 },
  ];

  return variants.map((variant, index) => ({
    ...route,
    id: `${route.id}-${index + 1}`,
    label: `Route zone ${index + 1}`,
    type: routeTypeLabels[index],
    distanceKm: Number((route.distanceKm * variant.distanceFactor).toFixed(1)),
    durationMin: Math.max(1, Math.round(route.durationMin * variant.durationFactor)),
  }));
};

const fetchDirections = async (profile, coordinates, includeAlternatives = true) => {
  const body = {
    coordinates,
    instructions: true,
  };

  if (includeAlternatives) {
    body.alternative_routes = {
      target_count: 3,
      weight_factor: 2,
      share_factor: 0.6,
    };
  }

  const { data } = await axios.post(
    `${ORS_BASE}/directions/${profile}/geojson`,
    body,
    {
      headers: {
        Authorization: ORS_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return data;
};

/**
 * Fetch ORS directions between two cities.
 * profile: "driving-car" | "cycling-regular" | "driving-hgv"
 */
export const getORSRoute = async (originCity, destinationCity, profile = "driving-car") => {
  if (!ORS_KEY) {
    throw new Error("OpenRouteService API key is missing.");
  }

  const [origin, destination] = await Promise.all([
    geocodeCity(originCity),
    geocodeCity(destinationCity),
  ]);

  const coordinates = [
    [origin.longitude, origin.latitude],
    [destination.longitude, destination.latitude],
  ];
  let data;

  try {
    data = await fetchDirections(profile, coordinates, true);
  } catch {
    data = await fetchDirections(profile, coordinates, false);
  }

  const routeOptions = (data.features ?? [])
    .map(toRouteOption)
    .filter((route) => Number.isFinite(route.distanceKm) && Number.isFinite(route.durationMin));
  const routes = routeOptions.length >= 3
    ? routeOptions.slice(0, 3)
    : buildFallbackRouteOptions(routeOptions[0]);
  const primaryRoute = routes[0];

  return {
    origin: origin.name,
    destination: destination.name,
    distanceKm: primaryRoute?.distanceKm ?? 0,
    durationMin: primaryRoute?.durationMin ?? 0,
    steps: primaryRoute?.steps ?? [],
    routes,
    profile,
  };
};

/**
 * Returns profile string for each audience type.
 */
export const profileForAudience = {
  bikers: "driving-car",
  travelers: "driving-car",
  logistics: "driving-hgv",
};

/**
 * Audience-specific advice based on route hazards.
 */
export const getAudienceAdvice = (audience, hazards, route) => {
  const { rain, storm, hot, wind } = hazards ?? {};

  const bikerTips = [];
  const travelerTips = [];
  const logisticsTips = [];

  if (storm > 0) {
    bikerTips.push("Storm detected. Postpone the ride if lightning risk stays high.");
    travelerTips.push("Storm on route. Check alerts and wait for a safer window.");
    logisticsTips.push("Storm conditions. Delay heavy vehicle dispatch if roads are unsafe.");
  }
  if (rain > 0) {
    bikerTips.push("Rain zones ahead. Wear waterproof gear and reduce speed on wet roads.");
    travelerTips.push("Pack rain gear and add a 20-30 minute buffer to the ETA.");
    logisticsTips.push("Protect cargo from moisture and check tarp seals before departure.");
  }
  if (hot > 0) {
    bikerTips.push("High heat. Hydrate often and avoid midday riding between 11 AM and 3 PM.");
    travelerTips.push("Heat alert. Keep water handy and use breaks to avoid fatigue.");
    logisticsTips.push("Heat may affect perishables. Confirm refrigeration is active.");
  }
  if (wind > 0) {
    bikerTips.push("Strong winds. Reduce speed and avoid risky overtakes.");
    travelerTips.push("Windy conditions. Reduce highway speed and secure rooftop cargo.");
    logisticsTips.push("High-sided vehicle wind risk. Keep speeds conservative.");
  }
  if (bikerTips.length === 0) bikerTips.push("Route conditions look good for a bike ride.");
  if (travelerTips.length === 0) travelerTips.push("Route conditions look good for travel.");
  if (logisticsTips.length === 0) logisticsTips.push("No major weather hazards for dispatch.");

  if (route) {
    const eta = `ETA: ${route.durationMin} min (${route.distanceKm} km)`;
    bikerTips.unshift(`${eta} via road route`);
    travelerTips.unshift(`${eta} via road route`);
    logisticsTips.unshift(`${eta} via heavy vehicle route`);
  }

  const map = { bikers: bikerTips, travelers: travelerTips, logistics: logisticsTips };
  return map[audience] ?? [];
};
