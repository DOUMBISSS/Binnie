// src/routes/uploadRoutes.js
import express        from "express";
import multer         from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";
import { authenticateUser }  from "../middlewares/auth.js";

const router = express.Router();

// ─── Config Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MB = 1024 * 1024;

function makeStorage(folder, allowedFormats, resourceType = "auto") {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:          `bet/${folder}`,
      resource_type:   resourceType,
      allowed_formats: allowedFormats,
      transformation:  folder === "avatars" ? [{ width: 400, height: 400, crop: "fill", gravity: "face" }] : undefined,
      public_id:       `${folder}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    }),
  });
}

function sizeFilter(maxMb) {
  return (req, file, cb) => {
    // Multer vérifie la taille après le stream — on la double-check en middleware post-upload
    cb(null, true);
  };
}

// ─── Uploader par type ───────────────────────────────────────────────────────
const uploadAvatar = multer({
  storage: makeStorage("avatars", ["jpg", "jpeg", "png", "webp"]),
  limits:  { fileSize: 5 * MB },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Seules les images sont acceptées pour un avatar"));
    cb(null, true);
  },
});

const uploadImage = multer({
  storage: makeStorage("images", ["jpg", "jpeg", "png", "webp", "gif", "svg"]),
  limits:  { fileSize: 10 * MB },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Fichier image requis"));
    cb(null, true);
  },
});

const uploadVideo = multer({
  storage: makeStorage("videos", ["mp4", "mov", "avi", "mkv", "webm"], "video"),
  limits:  { fileSize: 200 * MB },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) return cb(new Error("Fichier vidéo requis"));
    cb(null, true);
  },
});

const uploadAudio = multer({
  storage: makeStorage("audio", ["mp3", "wav", "ogg", "m4a", "aac"], "video"),
  limits:  { fileSize: 50 * MB },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("audio/")) return cb(new Error("Fichier audio requis"));
    cb(null, true);
  },
});

// Enregistrements vocaux candidats (webm depuis MediaRecorder navigateur)
const uploadRecording = multer({
  storage: makeStorage("speaking", ["webm", "ogg", "mp3", "wav", "m4a"], "video"),
  limits:  { fileSize: 50 * MB },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("audio/") || file.mimetype === "video/webm";
    if (!ok) return cb(new Error("Format audio invalide"));
    cb(null, true);
  },
});

const uploadDocument = multer({
  storage: makeStorage("documents", ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"], "raw"),
  limits:  { fileSize: 20 * MB },
});

// Dossiers apprenants : mémoire → upload_stream Cloudinary (évite l'incompatibilité multer v2 / multer-storage-cloudinary v4)
const uploadDossierMem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * MB } });

// ─── Réponse standard ────────────────────────────────────────────────────────
function fileResponse(file) {
  return {
    url:          file.path,
    public_id:    file.filename,
    resource_type: file.resource_type || "image",
    format:       file.mimetype?.split("/")[1] || "",
    size:         file.size,
    original_name: file.originalname,
  };
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// POST /api/upload/avatar   — photo de profil (apprenant, prospect, coach, admin)
router.post("/avatar", authenticateUser, (req, res) => {
  uploadAvatar.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    res.json({ message: "Avatar uploadé", file: fileResponse(req.file) });
  });
});

// POST /api/upload/image   — ressource pédagogique image
router.post("/image", authenticateAdmin, (req, res) => {
  uploadImage.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    res.json({ message: "Image uploadée", file: fileResponse(req.file) });
  });
});

// POST /api/upload/video   — cours vidéo, ressource vidéo
router.post("/video", authenticateAdmin, (req, res) => {
  uploadVideo.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    res.json({ message: "Vidéo uploadée", file: fileResponse(req.file) });
  });
});

// POST /api/upload/audio   — exercice audio, prononciation
router.post("/audio", authenticateAdmin, (req, res) => {
  uploadAudio.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    res.json({ message: "Audio uploadé", file: fileResponse(req.file) });
  });
});

// POST /api/upload/recording — réponse vocale candidat (public, sans auth)
router.post("/recording", (req, res) => {
  uploadRecording.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    res.json({ url: req.file.path, public_id: req.file.filename });
  });
});

// POST /api/upload/temoignage — photo du diplôme/certificat pour témoignage apprenant (authenticateUser)
router.post("/temoignage", authenticateUser, (req, res) => {
  const uploadTemo = multer({
    storage: makeStorage("diplomes_temoignages", ["jpg", "jpeg", "png", "webp"]),
    limits:  { fileSize: 10 * MB },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) return cb(new Error("Seules les images sont acceptées"));
      cb(null, true);
    },
  });
  uploadTemo.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    res.json({ message: "Photo du diplôme uploadée", url: req.file.path, file: fileResponse(req.file) });
  });
});

// POST /api/upload/dossier — documents dossier apprenant (Cloudinary via upload_stream)
router.post("/dossier", authenticateAdmin, (req, res) => {
  uploadDossierMem.single("file")(req, res, (multerErr) => {
    if (multerErr) return res.status(400).json({ error: multerErr.message });
    if (!req.file)  return res.status(400).json({ error: "Aucun fichier reçu" });

    const isImage    = req.file.mimetype.startsWith("image/");
    const resType    = isImage ? "image" : "raw";
    const public_id  = `dossier_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const stream = cloudinary.uploader.upload_stream(
      { folder: "bet/dossiers", resource_type: resType, public_id },
      (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({
          message: "Fichier dossier uploadé",
          file: {
            url:           result.secure_url,
            public_id:     result.public_id,
            resource_type: result.resource_type,
            size:          result.bytes,
            original_name: req.file.originalname,
          },
        });
      }
    );
    stream.end(req.file.buffer);
  });
});

// POST /api/upload/document — PDF, cours, supports
router.post("/document", authenticateAdmin, (req, res) => {
  uploadDocument.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    res.json({ message: "Document uploadé", file: fileResponse(req.file) });
  });
});

// DELETE /api/upload/delete?public_id=xxx&resource_type=image
router.delete("/delete", authenticateAdmin, async (req, res) => {
  try {
    const public_id = req.query.public_id || req.body.public_id;
    const resource_type = req.query.resource_type || req.body.resource_type || "image";
    const result = await cloudinary.uploader.destroy(public_id, { resource_type });
    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(400).json({ error: "Suppression échouée", detail: result });
    }
    res.json({ message: "Fichier supprimé", result });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ error: "Erreur suppression fichier" });
  }
});

export default router;
