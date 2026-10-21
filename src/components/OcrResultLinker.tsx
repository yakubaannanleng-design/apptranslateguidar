import { useState, useMemo, useEffect } from "react";
import { useDictionary } from "../hooks/useDictionary";
import { splitIntoWords, alignWords } from "../lib/ocr-engine";
import { POPULAR_LANGUAGES, LOCAL_LANGUAGES } from "../lib/languages";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Check, ArrowRight, Trash2, Save, Link2, Sparkles, Wand2, Zap, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DocumentScanner } from "./DocumentScanner";

interface OcrResultLinkerProps {
  guidarText: string;
  onClose: () => void;
}

interface LinkingPair {
  guidar: string;
  target: string;
}

export function OcrResultLinker({ guidarText, onClose }: OcrResultLinkerProps) {
  const { addEntry } = useDictionary();
  const [targetText, setTargetText] = useState("");
  const [targetLang, setTargetLang] = useState("fr");
  const [pairs, setPairs] = useState<LinkingPair[]>([]);
  const [selectedGuidar, setSelectedGuidar] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isMagicLinking, setIsMagicLinking] = useState(false);
  const [showTargetScanner, setShowTargetScanner] = useState(false);

  const guidarWords = useMemo(() => splitIntoWords(guidarText), [guidarText]);
  const targetWords = useMemo(() => splitIntoWords(targetText), [targetText]);

  useEffect(() => {
    if (!selectedGuidar || !selectedTarget) return;

    if (pairs.some((pair) => pair.guidar === selectedGuidar)) {
      toast.warning(`« ${selectedGuidar} » est déjà lié.`);
      setSelectedGuidar(null);
      setSelectedTarget(null);
      return;
    }

    setPairs((prev) => [...prev, { guidar: selectedGuidar, target: selectedTarget }]);

    const currentIndex = guidarWords.indexOf(selectedGuidar);
    setSelectedGuidar(guidarWords[currentIndex + 1] ?? null);
    setSelectedTarget(null);
  }, [selectedGuidar, selectedTarget, pairs, guidarWords]);

  const handleMagicLink = () => {
    if (!targetText.trim()) {
      toast.error("Veuillez entrer une traduction de référence.");
      return;
    }

    setIsMagicLinking(true);
    setTimeout(() => {
      const suggestedPairs = alignWords(guidarWords, targetWords);
      const uniqueNewPairs = suggestedPairs.filter(sp => !pairs.some(p => p.guidar === sp.source));
      
      const newLinks = uniqueNewPairs.map(p => ({ guidar: p.source, target: p.target }));
      setPairs([...pairs, ...newLinks]);
      
      setIsMagicLinking(false);
      toast.success(`${newLinks.length} liaisons automatiques générées !`);
    }, 800);
  };

  const removePair = (guidar: string) => {
    setPairs(pairs.filter(p => p.guidar !== guidar));
  };

  const saveAll = () => {
    if (pairs.length === 0) {
      toast.error("Aucune liaison à enregistrer");
      return;
    }

    pairs.forEach(pair => {
      addEntry({
        sourceLang: targetLang,
        sourceWord: pair.target,
        targetLang: "guidar",
        targetWord: pair.guidar,
      });
      addEntry({
        sourceLang: "guidar",
        sourceWord: pair.guidar,
        targetLang: targetLang,
        targetWord: pair.target,
      });
    });

    toast.success(`${pairs.length} concepts enregistrés dans le dictionnaire !`);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-8 min-h-screen pb-32">
        <header className="flex items-center justify-between sticky top-0 z-20 bg-black/50 py-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Liaison Intelligente</h2>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Alimentation du dictionnaire</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-stone-500 font-bold uppercase tracking-widest text-[10px] hover:text-white">
            Fermer
          </Button>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1">Traduction de Référence</Label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="h-8 w-32 bg-white/5 border-white/5 text-[10px] font-bold uppercase rounded-full px-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-900 border-white/10 text-white">
                    {POPULAR_LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowTargetScanner(true)}
                  variant="ghost"
                  className="h-8 rounded-full bg-white/5 text-stone-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 px-4"
                >
                  Scanner
                  <Camera className="w-3 h-3 ml-2" />
                </Button>
                <Button 
                  onClick={handleMagicLink}
                  disabled={isMagicLinking || !targetText.trim()}
                  variant="ghost"
                  className="h-8 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-stone-950 px-4"
                >
                  {isMagicLinking ? "Analyse..." : "Liaison Magique"}
                  <Wand2 className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>
            <Textarea 
              placeholder="Entrez la traduction correspondante au texte scanné..."
              className="min-h-[120px] bg-black/40 border-white/5 rounded-3xl text-lg font-medium p-6 resize-none focus:ring-amber-500/30 text-white placeholder:text-stone-700 shadow-inner"
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
            />
          </div>
        </section>

        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
          <Zap className="w-4 h-4 text-amber-500" />
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            {selectedGuidar 
              ? `Sélect. le mot traduit pour "${selectedGuidar}"` 
              : "Cliquez sur un mot Guidar scanné pour le lier"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Guidar (Scanné)</Label>
            <div className="flex flex-wrap gap-2 p-6 bg-black/40 rounded-[2rem] border border-white/5 min-h-[180px] content-start shadow-inner">
              {guidarWords.map((word, i) => (
                <button
                  key={`${word}-${i}`}
                  onClick={() => setSelectedGuidar(word)}
                  disabled={pairs.some(p => p.guidar === word)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    pairs.some(p => p.guidar === word) 
                      ? "bg-stone-800/20 text-stone-700 opacity-20 cursor-not-allowed line-through"
                      : selectedGuidar === word 
                        ? "bg-amber-500 text-stone-950 scale-110 shadow-xl shadow-amber-500/30 ring-2 ring-white/20" 
                        : "bg-white/5 text-stone-300 hover:bg-white/10 hover:scale-105"
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Traduction</Label>
            <div className="flex flex-wrap gap-2 p-6 bg-black/40 rounded-[2rem] border border-white/5 min-h-[180px] content-start shadow-inner">
              {targetWords.map((word, i) => (
                <button
                  key={`${word}-${i}`}
                  onClick={() => setSelectedTarget(word)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedTarget === word 
                      ? "bg-white text-stone-950 scale-110 shadow-xl ring-2 ring-amber-500" 
                      : "bg-white/5 text-stone-300 hover:bg-white/10 hover:scale-105"
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Concept Liés ({pairs.length})</h3>
            </div>
            {pairs.length > 0 && (
              <Button 
                onClick={saveAll}
                className="rounded-2xl bg-amber-500 text-stone-950 font-black uppercase italic tracking-widest px-8 h-12 hover:bg-amber-400 shadow-xl shadow-amber-500/10 border-b-4 border-amber-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {pairs.map((pair) => (
                <motion.div
                  key={pair.guidar}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group hover:border-amber-500/30 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 text-[10px] font-black">
                      G
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-amber-500 uppercase tracking-tighter">{pair.guidar}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <ArrowRight className="w-2 h-2 text-stone-700" />
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{pair.target}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removePair(pair.guidar)} 
                    className="p-2 text-stone-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showTargetScanner && (
          <DocumentScanner 
            onClose={() => setShowTargetScanner(false)} 
            onTextExtracted={(text) => {
              setTargetText(text);
              setShowTargetScanner(false);
              toast.success("Traduction scannée !");
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}