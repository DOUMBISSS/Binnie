import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Email invalide" });
    }

    // Récupérer l'IP et le user-agent
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const { data, error } = await supabase
      .from("newsletter")
      .insert({
        email: email.toLowerCase(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      // Gérer le cas où l'email existe déjà (violation unique)
      if (error.code === "23505") {
        return res.status(409).json({ error: "Cet email est déjà inscrit." });
      }
      console.error("Erreur Supabase :", error);
      return res.status(500).json({ error: "Erreur lors de l'inscription" });
    }

    res.status(201).json({ message: "Inscription réussie à la newsletter", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;