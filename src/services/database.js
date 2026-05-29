import { supabase } from "./supabase";

const getFavoritesCacheKey = (userId) => `favorite_cities_${userId}`;

const readCachedFavoriteCities = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getFavoritesCacheKey(userId)) ?? "[]");
  } catch (error) {
    console.error(error);
    return [];
  }
};

const cacheFavoriteCity = (userId, city, temperature = null) => {
  const normalizedCity = city.trim();
  if (!normalizedCity) return;

  const cachedCities = readCachedFavoriteCities(userId);
  const withoutDuplicate = cachedCities.filter(
    (favorite) => favorite.city.toLowerCase() !== normalizedCity.toLowerCase()
  );

  localStorage.setItem(
    getFavoritesCacheKey(userId),
    JSON.stringify([
      {
        id: `local-${Date.now()}`,
        city: normalizedCity,
        temperature,
        created_at: new Date().toISOString(),
      },
      ...withoutDuplicate,
    ])
  );
};

const sortFavoriteCities = (favorites) =>
  [...favorites].sort((first, second) => {
    if (first.created_at && second.created_at) {
      return new Date(second.created_at) - new Date(first.created_at);
    }

    if (first.id && second.id) {
      return String(second.id).localeCompare(String(first.id), undefined, {
        numeric: true,
      });
    }

    return 0;
  });

export const saveFavoriteCity = async (city, temperature = null) => {
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { error } = await supabase
    .from("favorites")
    .insert([
      {
        city: city,
        user_id: user.id,
      },
    ]);

  if (error) {
    console.error(error);
    throw error;
  }

  cacheFavoriteCity(user.id, city, temperature);

  return true;
};

export const getFavoriteCities = async () => {
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return sortFavoriteCities(readCachedFavoriteCities(user.id));
  }

  const favorites = data?.length ? data : readCachedFavoriteCities(user.id);
  return sortFavoriteCities(favorites);
};

export const saveWeatherComparison = async (comparison) => {
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { error } = await supabase.from("cities_comparison").insert([
    {
      user_id: user.id,
      ...comparison,
    },
  ]);

  if (error) {
    console.error(error);
    throw error;
  }

  return true;
};

export const getWeatherComparisons = async () => {
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data, error } = await supabase
    .from("cities_comparison")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
};
