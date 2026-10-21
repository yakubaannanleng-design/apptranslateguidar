import { useState } from "react";
import { useDictionary } from "../context/DictionaryContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Wifi, WifiOff, Download, Upload, Settings, Copy,
  Check, X, Terminal, FileJson, RefreshCw, Link2, HardDrive,
  Cloud, CloudOff, ArrowDownUp, AlertCircle, Info, ChevronDown, ChevronUp
} from "lucide-react";

const NODEJS_SERVER = `// server.cjs - Serveur Node.js/Express (fourni dans server/server.cjs)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8787;
const DATA_FILE = path.join(__dirname, 'dictionary.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/translations', (_req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  res.json(data);
});

app.post('/translations', (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Un tableau JSON est attendu.' });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.json({ success: true, count: req.body.length });
});

app.listen(PORT, () => {
  console.log('Serveur guidar démarré sur http://localhost:' + PORT);
});

// Installation : npm install express cors
// Lancement : node server.cjs (ou npm run server depuis la racine)`;

const PYTHON_SERVER = `# server.py - Serveur Python/FastAPI équivalent
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json
import os

app = FastAPI(title="Dictionnaire Guidar")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "dictionary.json"
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/translations")
async def get_translations():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

@app.post("/translations")
async def save_translations(body: List[Dict[str, Any]]):
    with open(DATA_FILE, "w") as f:
        json.dump(body, f, indent=2, ensure_ascii=False)
    return {"success": True, "count": len(body)}

# Installation : pip install fastapi uvicorn
# Lancement : uvicorn server:app --port 8787 --reload`;

const CURL_EXAMPLES = `# Tester la connexion
curl http://localhost:8787/health

# Récupérer les traductions
curl http://localhost:8787/translations

# Sauvegarder les traductions (tableau JSON)
curl -X POST http://localhost:8787/translations \\
  -H "Content-Type: application/json" \\
  -d '[{"id":"1","sourceWord":"Bonjour","targetWord":"Goudia","sourceLang":"fr","targetLang":"guidar","createdAt":0}]'`;

function CodeBlock({ code, title }: { code: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copié dans le presse-papiers !");
  };

  return (
    <div className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-3 text-xs text-stone-400 hover:text-white gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </Button>
      </div>
      <pre className="p-4 text-xs text-stone-300 font-mono leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StatusBadge({ connected, syncing }: { connected: boolean; syncing: boolean }) {
  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider">
        <RefreshCw className="w-3 h-3 animate-spin" /> Synchronisation...
      </span>
    );
  }
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
        <Wifi className="w-3 h-3" /> Connecté
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider">
      <WifiOff className="w-3 h-3" /> Déconnecté
    </span>
  );
}

export function LocalServerConfig() {
  const {
    serverUrl, setServerUrl, autoSync, setAutoSync, syncStatus,
    testServerConnection, syncWithServer, exportToJson, importFromJson,
  } = useDictionary();

  const [showNode, setShowNode] = useState(false);
  const [showPython, setShowPython] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importFromJson(text);
      toast.success("Dictionnaire importé avec succès !");
    };
    reader.onerror = () => toast.error("Erreur lors de la lecture du fichier.");
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Serveur Local</h2>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Configuration & synchronisation</p>
            </div>
          </div>
          <StatusBadge connected={syncStatus.connected} syncing={syncStatus.syncing} />
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">
            <Link2 className="w-3 h-3 inline mr-1" />
            URL de l'API
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="http://localhost:8787"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="flex-1 bg-black/40 border-white/5 h-14 rounded-2xl text-stone-100 font-bold focus:ring-amber-500/30 placeholder:text-stone-600"
            />
            <Button
              onClick={testServerConnection}
              disabled={syncStatus.syncing}
              className="h-14 px-6 rounded-2xl font-black uppercase tracking-wider text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xl"
            >
              {syncStatus.syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              Tester
            </Button>
          </div>
        </div>

        {/* Auto Sync Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-white">Synchronisation automatique</p>
              <p className="text-[10px] text-stone-500 font-medium">Sauvegarde à chaque modification</p>
            </div>
          </div>
          <Switch checked={autoSync} onCheckedChange={setAutoSync} className="data-[state=checked]:bg-amber-500" />
        </div>

        {/* Sync Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={async () => {
              const result = await syncWithServer();
              if (result.ok) toast.success("Synchronisation réussie !");
              else toast.error(result.error || "Échec de la synchronisation");
            }}
            disabled={syncStatus.syncing || !serverUrl.trim()}
            className="h-14 rounded-2xl font-black uppercase tracking-wider text-xs bg-white text-stone-950 hover:bg-stone-200 shadow-xl border-b-4 border-stone-300"
          >
            <ArrowDownUp className="w-4 h-4 mr-2" />
            Synchroniser
          </Button>
          <Button
            onClick={() => {
              exportToJson();
              toast.success("Export JSON téléchargé !");
            }}
            className="h-14 rounded-2xl font-black uppercase tracking-wider text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter JSON
          </Button>
        </div>

        {/* Import */}
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
          <HardDrive className="w-5 h-5 text-stone-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Importer un fichier JSON</p>
            <p className="text-[10px] text-stone-500 font-medium">Remplace le dictionnaire local</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-bold border-white/10 text-stone-300 hover:bg-white/10">
              <FileJson className="w-3.5 h-3.5 mr-1.5" />
              Choisir
            </Button>
          </label>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {syncStatus.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{syncStatus.error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Sync */}
        {syncStatus.lastSyncAt && (
          <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest text-center">
            Dernière synchronisation : {new Date(syncStatus.lastSyncAt).toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      {/* Guide Section */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Guide du Serveur</h3>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Scripts prêts à l'emploi</p>
          </div>
        </div>

        <p className="text-sm text-stone-400 leading-relaxed font-medium">
          Un serveur prêt à l'emploi est fourni dans <code className="text-amber-400">server/server.cjs</code>.
          Lancez <code className="text-amber-400">npm run server</code> à la racine du projet : l'API écoute sur
          <code className="text-amber-400"> http://localhost:8787</code>. Les scripts ci-dessous sont des équivalents autonomes.
        </p>

        {/* Node.js */}
        <div>
          <button
            onClick={() => setShowNode(!showNode)}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-black text-emerald-400">JS</span>
              </div>
              <span className="text-sm font-bold text-white">Node.js + Express</span>
            </div>
            {showNode ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          <AnimatePresence>
            {showNode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="mt-3">
                  <CodeBlock code={NODEJS_SERVER} title="server.js" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Python */}
        <div>
          <button
            onClick={() => setShowPython(!showPython)}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-black text-blue-400">PY</span>
              </div>
              <span className="text-sm font-bold text-white">Python + FastAPI</span>
            </div>
            {showPython ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          <AnimatePresence>
            {showPython && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="mt-3">
                  <CodeBlock code={PYTHON_SERVER} title="server.py" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* cURL Examples */}
        <div>
          <button
            onClick={() => setShowCurl(!showCurl)}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-black text-orange-400">CLI</span>
              </div>
              <span className="text-sm font-bold text-white">Exemples cURL</span>
            </div>
            {showCurl ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          <AnimatePresence>
            {showCurl && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="mt-3">
                  <CodeBlock code={CURL_EXAMPLES} title="curl" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* API Format Info */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Format de l'API</h3>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Endpoints attendus</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { method: "GET", endpoint: "/health", desc: "Vérifie que le serveur est en ligne" },
            { method: "GET", endpoint: "/translations", desc: "Récupère toutes les traductions" },
            { method: "POST", endpoint: "/translations", desc: "Sauvegarde les traductions (body: tableau JSON)" },
          ].map((item) => (
            <div key={item.endpoint} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                item.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {item.method}
              </span>
              <code className="text-sm font-mono text-stone-300">{item.endpoint}</code>
              <span className="text-xs text-stone-500 ml-auto">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
