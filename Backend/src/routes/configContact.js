import express from "express";
import { createClient } from "@supabase/supabase-js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router  = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET public — lu par WhatsAppButton, Footer, Contact
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("config_contact")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT admin — enregistré depuis SuperAdminDashboard
router.put("/", authenticateAdmin, async (req, res) => {
  const {
    whatsapp_number, whatsapp_message, email_central, localisation, maps_embed_url,
    social_facebook,  social_facebook_visible,
    social_instagram, social_instagram_visible,
    social_linkedin,  social_linkedin_visible,
    social_tiktok,    social_tiktok_visible,
    social_twitter,   social_twitter_visible,
  } = req.body;
  const { data, error } = await supabase
    .from("config_contact")
    .upsert({
      id: 1,
      whatsapp_number,
      whatsapp_message,
      email_central,
      localisation:              localisation              ?? "",
      maps_embed_url:            maps_embed_url            ?? "",
      social_facebook:           social_facebook           ?? "",
      social_facebook_visible:   social_facebook_visible   !== false,
      social_instagram:          social_instagram          ?? "",
      social_instagram_visible:  social_instagram_visible  !== false,
      social_linkedin:           social_linkedin           ?? "",
      social_linkedin_visible:   social_linkedin_visible   !== false,
      social_tiktok:             social_tiktok             ?? "",
      social_tiktok_visible:     social_tiktok_visible     !== false,
      social_twitter:            social_twitter            ?? "",
      social_twitter_visible:    social_twitter_visible    !== false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
