import supabase from "../config/supabase.js";

export const testSupabase = async () => {
  try {
    const { error } = await supabase.from("profils_admin").select("count").limit(1);
    if (error) throw error;
    console.log("✅ Supabase connecté");
  } catch (error) {
    console.error("❌ Supabase erreur :", error.message);
  }
};