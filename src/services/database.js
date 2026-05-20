import { supabase } from "./supabase";

export const saveFavoriteCity = async (city) => {
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

  return true;
};