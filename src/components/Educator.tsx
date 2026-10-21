import { useRef, useState, useMemo } from "react";
import { useDictionary } from "../hooks/useDictionary";
import { POPULAR_LANGUAGES, LOCAL_LANGUAGES } from "../lib/languages";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Save, Plus, Trash2, Search, ArrowRightLeft, Music, Camera, Sparkles,
  Database, Pencil, X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeWord } from "../lib/text";
import { DocumentScanner } from "./DocumentScanner";
import { OcrResultLinker } from "./OcrResultLinker";

export function Educator() {
  const {
    dictionary, addEntry, updateEntry, removeEntry, clearDictionary, importFromJson,
    importFromCsv, exportToJson, exportToCsv,
  } = useDictionary();
  const [sourceLang, setSourceLang] = useState("fr");
  const [targetLang, setTargetLang] = useState("guidar");
  const [sourceWord, setSourceWord] = useState("");
  const [targetWord, setTargetWord] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLang, setFilterLang] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showScanner, setShowScanner] = useState(false);
  const [extractedGuidar, setExtractedGuidar] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWord.trim() || !targetWord.trim()) {
      toast.error("Veuillez remplir les deux champs.");
      return;
    }

    if (editingId) {
      updateEntry(editingId, {
        sourceLang,
        sourceWord: sourceWord.trim(),
        targetLang,
        targetWord: targetWord.trim(),
      });
      toast.success("Entrée mise à jour !");
    } else {
      const entry = addEntry({
        sourceLang,
        sourceWord: sourceWord.trim(),
        targetLang,
        targetWord: targetWord.trim(),
      });
      if (
        normalizeWord(entry.sourceWord) === normalizeWord(sourceWord) &&
        entry.targetWord === targetWord.trim()
      ) {
        toast.success("Entrée ajoutée au dictionnaire !");
      } else {
        toast.info("Cette entrée existe déjà et n'a pas été dupliquée.");
      }
    }

    setSourceWord("");
    setTargetWord("");
    setEditingId(null);
  };

  const startEditing = (id: string) => {
    const entry = dictionary.find((item) => item.id === id);
    if (!entry) return;
    setEditingId(id);
    setSourceLang(entry.sourceLang);
    setTargetLang(entry.targetLang);
    setSourceWord(entry.sourceWord);
    setTargetWord(entry.targetWord);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setSourceWord("");
    setTargetWord("");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const mode = importFromJson(text, "merge");
      if (mode) toast.success("Dictionnaire JSON importé et fusionné !");
      else toast.error("Import impossible : vérifiez le format JSON.");
    };
    reader.onerror = () => toast.error("Erreur lors de la lecture du fichier.");
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const mode = importFromCsv(text, "merge");
      if (mode) toast.success("Dictionnaire CSV importé et fusionné !");
      else toast.error("Import impossible : vérifiez le format CSV.");
    };
    reader.onerror = () => toast.error("Erreur lors de la lecture du fichier.");
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredDict = dictionary.filter(e => {
    const matchesSearch =
      e.sourceWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.targetWord.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang =
      filterLang === "all" || e.sourceLang === filterLang || e.targetLang === filterLang;
    return matchesSearch && matchesLang;
  });

  const allLangs = useMemo(() => [...POPULAR_LANGUAGES, ...LOCAL_LANGUAGES], []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Éducation Rapide</h2>
            </div>
            <p className="text-white/80 font-medium leading-relaxed max-w-md">
              Scannez un document bilingue, puis associez les mots guidar à leur traduction.
              L'OCR reconnaît le latin (français/anglais) : les signes guidar sont à corriger à la main.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-2">
              <Button 
                onClick={() => setShowScanner(true)}
                className="h-14 px-8 rounded-2xl bg-stone-950 text-white font-black uppercase italic tracking-widest hover:bg-stone-800 transition-all shadow-xl group/btn"
              >
                Scanner
                <Sparkles className="w-4 h-4 ml-3 group-hover:rotate-12 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => importInputRef.current?.click()}
                className="h-14 px-6 rounded-2xl bg-white/10 border-white/20 text-white font-black uppercase italic tracking-widest hover:bg-white/20 transition-all backdrop-blur-md"
              >
                Importer JSON
                <Database className="w-4 h-4 ml-3" />
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                className="h-14 px-6 rounded-2xl bg-white/10 border-white/20 text-white font-black uppercase italic tracking-widest hover:bg-white/20 transition-all backdrop-blur-md"
              >
                Importer CSV
                <Database className="w-4 h-4 ml-3" />
              </Button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportCsv}
              />
              <Button
                variant="outline"
                onClick={() => {
                  exportToCsv();
                  toast.success("Export CSV téléchargé !");
                }}
                className="h-14 px-6 rounded-2xl bg-white/10 border-white/20 text-white font-black uppercase italic tracking-widest hover:bg-white/20 transition-all backdrop-blur-md"
              >
                Exporter CSV
                <Database className="w-4 h-4 ml-3" />
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex w-32 h-32 bg-white/10 rounded-3xl backdrop-blur-2xl items-center justify-center border border-white/20 shadow-2xl rotate-3">
            <Camera className="w-12 h-12 text-white/50" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScanner && (
          <DocumentScanner 
            onClose={() => setShowScanner(false)} 
            onTextExtracted={(text) => {
              setExtractedGuidar(text);
              setShowScanner(false);
            }} 
          />
        )}
        {extractedGuidar && (
          <OcrResultLinker 
            guidarText={extractedGuidar} 
            onClose={() => setExtractedGuidar(null)} 
          />
        )}
      </AnimatePresence>

      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 space-y-8">
        <div className="flex items-center justify-between pl-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-500 border border-orange-500/20 shadow-lg">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                {editingId ? "Modifier l'entrée" : "Saisie Manuelle"}
              </h2>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                {editingId ? "Correction du dictionnaire" : "Enrichir la base de données"}
              </p>
            </div>
          </div>
          {dictionary.length > 0 && (
            <Button 
              variant="ghost" 
              onClick={() => {
                if (confirm("Voulez-vous vraiment effacer tout le dictionnaire appris ?")) {
                  clearDictionary();
                  toast.success("Dictionnaire réinitialisé");
                }
              }}
              className="text-stone-500 hover:text-red-500 text-[10px] font-black uppercase tracking-widest"
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-black/20 p-6 rounded-3xl border border-white/5 shadow-inner">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Langue Source</Label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="bg-stone-800/50 border-white/5 text-stone-100 font-bold h-12 rounded-2xl shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-900 border-white/10 text-stone-100 rounded-2xl">
                  {POPULAR_LANGUAGES.map(l => (
                    <SelectItem key={l.code} value={l.code} className="py-3">{l.flag} {l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Langue Cible</Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="bg-stone-800/50 border-white/5 text-stone-100 font-bold h-12 rounded-2xl shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-900 border-white/10 text-stone-100 rounded-2xl">
                  {allLangs.map(l => (
                    <SelectItem key={l.code} value={l.code} className="py-3">{l.flag} {l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Mot / Phrase d'origine</Label>
              <Input 
                placeholder="Ex: Bonjour"
                value={sourceWord}
                onChange={(e) => setSourceWord(e.target.value)}
                className="bg-black/30 border-white/5 h-14 rounded-2xl shadow-inner text-stone-100 font-bold placeholder:text-stone-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Traduction</Label>
              <Input 
                placeholder="Ex: Goudia"
                value={targetWord}
                onChange={(e) => setTargetWord(e.target.value)}
                className="bg-black/30 border-white/5 h-14 rounded-2xl shadow-inner text-stone-100 font-bold placeholder:text-stone-700"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase italic tracking-widest shadow-xl bg-orange-600 text-white hover:bg-orange-500 transition-all border-b-4 border-orange-800">
              <Save className="w-5 h-5 mr-3" />
              {editingId ? "Mettre à jour" : "Enregistrer la connaissance"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEditing}
                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-stone-400 hover:text-white border border-white/10"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
            Dictionnaire Personnel ({dictionary.length})
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={filterLang} onValueChange={setFilterLang}>
              <SelectTrigger className="h-12 w-full sm:w-40 bg-black/60 border-white/5 rounded-2xl text-stone-300 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-stone-900 border-white/10 text-stone-100 rounded-2xl">
                <SelectItem value="all">Toutes langues</SelectItem>
                {allLangs.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <Input 
                placeholder="Rechercher un mot..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 text-sm bg-black/60 border-white/5 rounded-2xl text-white font-bold placeholder:text-stone-700 focus:ring-amber-500/20 shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredDict.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-16 text-center text-stone-600 bg-black/40 rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center gap-4 shadow-inner">
                <Music className="w-12 h-12 opacity-10" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Aucune donnée apprise</p>
              </motion.div>
            ) : (
              filteredDict.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-between p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 group hover:border-amber-500/30 transition-all shadow-xl"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{entry.sourceLang}</span>
                      <ArrowRightLeft className="w-3 h-3 opacity-30" />
                      <span className="text-amber-500">{entry.targetLang}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-white">{entry.sourceWord}</span>
                      <span className="text-stone-700 font-black">→</span>
                      <span className="font-black italic text-xl text-amber-500 uppercase tracking-tighter">{entry.targetWord}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(entry.id)}
                      className="text-stone-600 hover:text-amber-500 hover:bg-amber-500/10 rounded-2xl h-12 w-12"
                      aria-label={`Modifier ${entry.sourceWord}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeEntry(entry.id);
                        if (editingId === entry.id) cancelEditing();
                      }}
                      className="text-stone-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl h-12 w-12 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                      aria-label={`Supprimer ${entry.sourceWord}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}