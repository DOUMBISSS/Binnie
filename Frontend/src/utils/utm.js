/* ─────────────────────────────────────────────────
   UTM Tracker — capture la source d'acquisition
   Stocke dans sessionStorage pour toute la visite.
   Appeler captureUTM() au démarrage de l'app.
───────────────────────────────────────────────── */

const KEY        = "bet_utm";
const TRACKED_KEY = "bet_utm_tracked"; // évite de tracker 2x la même session
const API         = "http://localhost:5001";

// Labels lisibles par source
const SOURCE_LABELS = {
  facebook:   "Facebook",
  instagram:  "Instagram",
  tiktok:     "TikTok",
  linkedin:   "LinkedIn",
  whatsapp:   "WhatsApp",
  google:     "Google",
  youtube:    "YouTube",
  twitter:    "Twitter / X",
  email:      "Email",
  sms:        "SMS",
  flyer:      "Flyer / Affichage",
  qrcode:     "QR Code",
  direct:     "Accès direct",
};

export function captureUTM() {
  const params   = new URLSearchParams(window.location.search);
  const source   = params.get("utm_source")   || null;
  const medium   = params.get("utm_medium")   || null;
  const campaign = params.get("utm_campaign") || null;
  const content  = params.get("utm_content")  || null;
  const page     = window.location.pathname;

  if (source) {
    const utm = { source, medium, campaign, content, captured_at: new Date().toISOString() };
    sessionStorage.setItem(KEY, JSON.stringify(utm));

    // Envoyer le ping de visite une seule fois par session
    if (!sessionStorage.getItem(TRACKED_KEY)) {
      sessionStorage.setItem(TRACKED_KEY, "1");
      fetch(`${API}/api/sondage/track-visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utm_source: source, utm_medium: medium, utm_campaign: campaign, page }),
      }).catch(() => {}); // silencieux — ne jamais bloquer l'UX
    }
  } else if (!sessionStorage.getItem(KEY)) {
    sessionStorage.setItem(KEY, JSON.stringify({ source: "direct", medium: null, campaign: null, content: null, captured_at: new Date().toISOString() }));
  }
}

export function getUTM() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch { return null; }
}

export function getSourceLabel(source) {
  if (!source) return "Accès direct";
  return SOURCE_LABELS[source.toLowerCase()] || source;
}

// Générateur de liens trackés (pour BET)
export function buildTrackedLink(baseUrl, source, campaign = "bet2025") {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source",   source);
  url.searchParams.set("utm_medium",   "social");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
