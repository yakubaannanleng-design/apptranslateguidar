const { DatabaseSync } = require("node:sqlite");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 8787;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "dictionary.sqlite");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS translations (
    id TEXT PRIMARY KEY,
    sourceLang TEXT NOT NULL,
    sourceWord TEXT NOT NULL,
    targetLang TEXT NOT NULL,
    targetWord TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );
`);

const selectAll = db.prepare("SELECT id, sourceLang, sourceWord, targetLang, targetWord, createdAt FROM translations ORDER BY createdAt DESC");
const deleteAll = db.prepare("DELETE FROM translations");
const insert = db.prepare("INSERT INTO translations (id, sourceLang, sourceWord, targetLang, targetWord, createdAt) VALUES (?, ?, ?, ?, ?, ?)");

function readDictionary() {
  return selectAll.all().map((row) => ({
    id: row.id,
    sourceLang: row.sourceLang,
    sourceWord: row.sourceWord,
    targetLang: row.targetLang,
    targetWord: row.targetWord,
    createdAt: row.createdAt,
  }));
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

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "dictionnaire-guidar-sqlite",
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
      error: `${req.body.length - validEntries.length} entrée(s) invalide(s).`,
    });
  }

  try {
    db.exec("BEGIN");
    deleteAll.run();
    for (const entry of validEntries) {
      insert.run(
        entry.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        entry.sourceLang,
        entry.sourceWord.trim(),
        entry.targetLang,
        entry.targetWord.trim(),
        Number.isFinite(entry.createdAt) ? entry.createdAt : Date.now(),
      );
    }
    db.exec("COMMIT");
    res.json({ success: true, count: validEntries.length });
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("Sauvegarde SQLite impossible :", error.message);
    res.status(500).json({ error: "Sauvegarde impossible dans la base SQLite." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur SQLite guidar : http://localhost:${PORT}`);
  console.log(`Base de données : ${DB_FILE}`);
});
