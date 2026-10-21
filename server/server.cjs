const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 8787;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "dictionary.json");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function readDictionary() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Lecture du dictionnaire impossible :", error.message);
    }
    return [];
  }
}

function isValidEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.sourceWord === "string" &&
    entry.sourceWord.trim() !== "" &&
    typeof entry.targetWord === "string" &&
    entry.targetWord.trim() !== "" &&
    typeof entry.sourceLang === "string" &&
    typeof entry.targetLang === "string"
  );
}

function writeDictionary(entries) {
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(entries, null, 2), "utf-8");
  fs.renameSync(temporaryFile, DATA_FILE);
}

if (!fs.existsSync(DATA_FILE)) {
  writeDictionary([]);
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "dictionnaire-guidar",
    entries: readDictionary().length,
    timestamp: new Date().toISOString(),
  });
});

app.get("/translations", (_req, res) => {
  res.json(readDictionary());
});

app.post("/translations", (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Un tableau JSON est attendu." });
  }

  const validEntries = req.body.filter(isValidEntry);
  if (validEntries.length !== req.body.length) {
    return res.status(400).json({
      error: `${req.body.length - validEntries.length} entrée(s) invalide(s) : sourceWord, targetWord, sourceLang et targetLang sont obligatoires.`,
    });
  }

  try {
    writeDictionary(validEntries);
    res.json({ success: true, count: validEntries.length });
  } catch (error) {
    console.error("Écriture du dictionnaire impossible :", error.message);
    res.status(500).json({ error: "Sauvegarde impossible sur le disque." });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "JSON invalide." });
  }
  console.error(error);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur dictionnaire guidar : http://localhost:${PORT}`);
  console.log(`Fichier de données : ${DATA_FILE}`);
});
