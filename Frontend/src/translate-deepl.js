require('dotenv').config();
const fs = require('fs');
const deepl = require('deepl-node');

// 🔐 Clé sécurisée via .env
const authKey = process.env.DEEPL_API_KEY;

if (!authKey) {
  console.error("❌ Clé DeepL manquante. Vérifie ton fichier .env");
  process.exit(1);
}

const translator = new deepl.Translator(authKey);

// 📂 Lecture du fichier FR
const frPath = './src/i18n/locales/fr.json';
const enPath = './src/i18n/locales/en.json';

if (!fs.existsSync(frPath)) {
  console.error("❌ Fichier fr.json introuvable !");
  process.exit(1);
}

const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// ⏱️ petit delay pour éviter de spam l’API
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function translateObject(obj) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value);
    } else {
      try {
        if (!value || typeof value !== 'string') {
          result[key] = value;
          continue;
        }

        const translation = await translator.translateText(value, 'fr', 'en-US');
        result[key] = translation.text;

        console.log(`✅ ${value.substring(0, 40)} → ${translation.text.substring(0, 40)}`);

        await delay(100); // éviter limite API
      } catch (err) {
        console.error(`❌ Erreur pour "${value}" :`, err.message);
        result[key] = value;
      }
    }
  }

  return result;
}

// 🚀 Lancement
(async () => {
  try {
    console.log("🌍 Traduction en cours...");
    const enData = await translateObject(frData);

    fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

    console.log("🎉 Traduction terminée !");
    console.log("📁 Fichier généré : en.json");
  } catch (err) {
    console.error("❌ Erreur globale :", err);
  }
})();

console.log(process.env.DEEPL_API_KEY);