const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const SEARCH_RADII_METERS = [1200, 2200];
const EARTH_RADIUS_KM = 6371;

const shelterCategories = {
  cafe: {
    label: "Cafes",
    priority: 2,
    matcher: (tags) => tags.amenity === "cafe",
  },
  metro: {
    label: "Metro stations",
    priority: 1,
    matcher: (tags) =>
      tags.railway === "subway_entrance" ||
      tags.station === "subway" ||
      tags.subway === "yes" ||
      tags.public_transport === "station",
  },
  mall: {
    label: "Malls",
    priority: 3,
    matcher: (tags) => tags.shop === "mall" || tags.building === "retail",
  },
  hospital: {
    label: "Hospitals",
    priority: 0,
    matcher: (tags) => tags.amenity === "hospital",
  },
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const getDistanceKm = (from, to) => {
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const startLat = toRadians(from.lat);
  const endLat = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getElementCenter = (element) => {
  if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    return { lat: element.lat, lon: element.lon };
  }

  if (element.center && Number.isFinite(element.center.lat) && Number.isFinite(element.center.lon)) {
    return { lat: element.center.lat, lon: element.center.lon };
  }

  return null;
};

const getCategoryKey = (tags = {}) =>
  Object.entries(shelterCategories).find(([, category]) => category.matcher(tags))?.[0] ?? null;

const getFallbackName = (categoryKey) => {
  const label = shelterCategories[categoryKey]?.label ?? "Shelter";
  return label.replace(/s$/, "");
};

const categoryQueryParts = {
  cafe: ['node(around:{radius},{lat},{lon})["amenity"="cafe"];'],
  hospital: ['nwr(around:{radius},{lat},{lon})["amenity"="hospital"];'],
  mall: [
    'nwr(around:{radius},{lat},{lon})["shop"="mall"];',
    'nwr(around:{radius},{lat},{lon})["building"="retail"];',
  ],
  metro: [
    'node(around:{radius},{lat},{lon})["railway"="subway_entrance"];',
    'nwr(around:{radius},{lat},{lon})["station"="subway"];',
    'nwr(around:{radius},{lat},{lon})["subway"="yes"];',
    'nwr(around:{radius},{lat},{lon})["public_transport"="station"]["station"="subway"];',
  ],
};

const buildCategoryQuery = ({ lat, lon }, category, radius) => {
  const body = categoryQueryParts[category]
    .map((part) =>
      part
        .replaceAll("{radius}", radius)
        .replaceAll("{lat}", lat)
        .replaceAll("{lon}", lon)
    )
    .join("\n");

  return `
[out:json][timeout:10];
(
${body}
);
out center tags 12;
`;
};

const getRequestHeaders = () => ({
  "Content-Type": "application/x-www-form-urlencoded",
  ...(typeof window === "undefined" ? { "User-Agent": "weather-ai shelter finder" } : {}),
});

export const fetchNearbyShelters = async (coords) => {
  if (!Number.isFinite(coords?.lat) || !Number.isFinite(coords?.lon)) {
    return [];
  }

  const deduped = new Map();
  const categories = ["hospital", "metro", "cafe", "mall"];
  const failures = [];

  for (const radius of SEARCH_RADII_METERS) {
    for (const categoryName of categories) {
      let categoryLoaded = false;

      for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: getRequestHeaders(),
            body: new URLSearchParams({
              data: buildCategoryQuery(coords, categoryName, radius),
            }),
          });

          if (!response.ok) {
            throw new Error(`Overpass ${response.status}`);
          }

          const data = await response.json();

          (data.elements ?? []).forEach((element) => {
            const tags = element.tags ?? {};
            const category = getCategoryKey(tags);
            const center = getElementCenter(element);
            if (!category || !center) return;

            const distanceKm = getDistanceKm(coords, center);
            const key = `${category}-${tags.name ?? element.id}`;
            const shelter = {
              id: `${element.type}-${element.id}`,
              name: tags.name || getFallbackName(category),
              category,
              categoryLabel: shelterCategories[category].label,
              distanceKm,
              distanceLabel: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`,
              lat: center.lat,
              lon: center.lon,
              address: [tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", "),
              openNow: tags.opening_hours ? "Hours listed" : "Hours unavailable",
              priority: shelterCategories[category].priority,
              mapsUrl: `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lon}`,
            };

            const existing = deduped.get(key);
            if (!existing || shelter.distanceKm < existing.distanceKm) {
              deduped.set(key, shelter);
            }
          });

          categoryLoaded = true;
          break;
        } catch (error) {
          failures.push(`${categoryName}:${radius}:${error.message}`);
        }
      }

      if (!categoryLoaded && categoryName === "hospital") {
        continue;
      }
    }

    if (deduped.size >= 8) break;
  }

  if (deduped.size === 0 && failures.length > 0) {
    const error = new Error("Shelter map data is temporarily unavailable.");
    error.code = "SHELTER_API_UNAVAILABLE";
    throw error;
  }

  const byCategory = { hospital: [], metro: [], cafe: [], mall: [] };
  Array.from(deduped.values())
    .sort((a, b) => a.distanceKm - b.distanceKm || a.priority - b.priority)
    .forEach((shelter) => {
      byCategory[shelter.category]?.push(shelter);
    });

  const balanced = [];
  ["hospital", "metro", "cafe", "mall"].forEach((category) => {
    balanced.push(...byCategory[category].slice(0, 4));
  });

  if (balanced.length < 12) {
    for (const shelter of Array.from(deduped.values()).sort((a, b) => a.distanceKm - b.distanceKm)) {
      if (!balanced.some((item) => item.id === shelter.id)) {
        balanced.push(shelter);
      }
    }
  }

  return balanced
    .sort((a, b) => a.distanceKm - b.distanceKm || a.priority - b.priority)
    .slice(0, 16);
};

export const shelterCategoryList = Object.entries(shelterCategories).map(([key, value]) => ({
  key,
  label: value.label,
}));
