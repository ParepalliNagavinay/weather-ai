import { supabase } from "./supabase";

export const saveFavoriteCity = async (
  city
) => {
  const user =
    (await supabase.auth.getUser()).data.user;

  if (!user) {
    alert("Please login first");
    return;
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
    console.log(error);
    alert("Error saving city");
  } else {
    alert("City saved successfully");
  }
};