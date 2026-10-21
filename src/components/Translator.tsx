import { useState, useMemo, useEffect } from "react";
import { useDictionary } from "../hooks/useDictionary";
import { POPULAR_LANGUAGES, LOCAL_LANGUAGES } from "../lib/languages";
import { hasCoreDirection } from "../lib/translator-engine";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowRightLeft, Sparkles, GraduationCap, AlertCircle, Volume2, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function Translator() {
  const { findTranslation, addEntry, isLoaded } = useDictionary();
  const [sourceLang, setSourceLang] = useState("fr");
  const [targetLang, setTargetLang] = useState("guidar");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const [eduSourceWord, setEduSourceWord] = useState("");
  const [eduTargetWord, setEduTargetWord] = useState("");

  useEffect(() => {
    if (inputText === "") setResult("");
  }, [inputText]);

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);

    const translation = findTranslation(inputText, sourceLang, targetLang);
    if (translation) {
      setResult(translation);
    } else {
      setResult("Traduction inconnue");
      setEduSourceWord(inputText.trim());
      toast.info("Aidez le dictionnaire à apprendre", {
        description: hasCoreDirection(sourceLang, targetLang)
          ? `Ajoutez la traduction de « ${inputText.trim()} » ci-dessous.`
          : `La paire ${sourceLang} → ${targetLang} n'est pas encore couverte : ajoutez des entrées dans l'onglet Éduquer.`,
        duration: 5000,
      });
    }
    setIsTranslating(false);
  };

  const speakResult = () => {
    if (!result || result.includes("inconnue")) return;
    const utterance = new SpeechSynthesisUtterance(result);
    if (targetLang === "en") utterance.lang = "en-US";
    else if (targetLang === "fr") utterance.lang = "fr-FR";
    else if (targetLang === "es") utterance.lang = "es-ES";
    else if (targetLang === "de") utterance.lang = "de-DE";
    else if (targetLang === "guidar") utterance.lang = "fr-FR";
    else utterance.lang = "fr-FR";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    if (targetLang === "guidar") {
      toast.info("Voix approximative", {
        description:
          "Aucune voix guidar n'est disponible dans le navigateur : la lecture utilise une prononciation française.",
      });
    } else {
      toast.success("Lecture vocale lancée");
    }
  };

  const handleAddEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSourceWord.trim() || !eduTargetWord.trim()) {
      toast.warning("Veuillez remplir les deux champs.");
      return;
    }
    addEntry({
      sourceLang,
      sourceWord: eduSourceWord.trim(),
      targetLang,
      targetWord: eduTargetWord.trim(),
    });
    toast.success("Nouvelle traduction enregistrée !");
    if (eduSourceWord.trim().toLowerCase() === inputText.trim().toLowerCase()) {
      setResult(eduTargetWord.trim());
    }
    setEduSourceWord("");
    setEduTargetWord("");
  };

  const allLangs = useMemo(() => [...POPULAR_LANGUAGES, ...LOCAL_LANGUAGES], []);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-amber-500 gap-4">
        <Sparkles className="w-12 h-12 animate-spin" />
        <p className="font-black uppercase tracking-widest text-sm">Initialisation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-black/40 p-2 rounded-3xl border border-white/5 shadow-inner">
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="h-14 border-none bg-stone-900/50 hover:bg-stone-800 transition-all rounded-2xl shadow-md text-stone-100 font-bold px-5 flex-1 ring-1 ring-white/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-stone-900 border-white/10 text-stone-100 rounded-2xl">
              {allLangs.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="hover:bg-amber-500/10 focus:bg-amber-500/20 py-3">
                  <span className="flex items-center gap-3 font-bold uppercase tracking-wider text-xs">
                    <span className="text-xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              const oldSource = sourceLang;
              setSourceLang(targetLang);
              setTargetLang(oldSource);
              setInputText(result && !result.includes("inconnue") ? result : "");
              setResult("");
            }}
            className="rounded-full w-12 h-12 bg-white/5 text-amber-500 hover:rotate-180 transition-all duration-500 border border-white/10"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </Button>

          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="h-14 border-none bg-stone-900/50 hover:bg-stone-800 transition-all rounded-2xl shadow-md text-stone-100 font-bold px-5 flex-1 ring-1 ring-white/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-stone-900 border-white/10 text-stone-100 rounded-2xl">
              {allLangs.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="hover:bg-amber-500/10 focus:bg-amber-500/20 py-3">
                  <span className="flex items-center gap-3 font-bold uppercase tracking-wider text-xs">
                    <span className="text-xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest text-center">
          Lexique embarqué : français / anglais ↔ guidar · les autres paires utilisent votre dictionnaire
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Saisie de texte</Label>
            <div className="relative group">
              <Textarea
                placeholder="Entrez votre texte ici..."
                className="min-h-[150px] text-xl p-6 resize-none border-white/5 bg-black/30 focus-visible:ring-amber-500/20 rounded-3xl transition-all duration-500 text-white font-medium"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <AnimatePresence>
                {inputText && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-4 right-4"
                  >
                    <Button 
                      onClick={handleTranslate} 
                      disabled={isTranslating}
                      className="rounded-2xl px-8 h-12 font-black shadow-xl bg-amber-500 hover:bg-amber-400 text-stone-950 uppercase tracking-wider text-xs italic"
                    >
                      Traduire
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Traduction</Label>
            <div className="min-h-[150px] p-8 rounded-[2rem] bg-black/60 text-white relative flex flex-col items-center justify-center text-center gap-6 border border-white/5 shadow-inner overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-12">
                <BookOpen className="w-48 h-48" />
              </div>
              <div className="w-full relative z-10">
                {isTranslating ? (
                  <Sparkles className="w-8 h-8 animate-spin mx-auto text-amber-500 opacity-50" />
                ) : (
                  <motion.div key={result} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {result ? (
                      <div className="flex flex-col items-center gap-6">
                        <span className={result.includes("inconnue") ? "text-red-500/80 text-xl font-bold uppercase italic" : "text-amber-500 text-3xl font-black italic tracking-tighter drop-shadow-lg"}>
                          {result}
                        </span>
                        {!result.includes("inconnue") && (
                          <Button 
                            variant="ghost" 
                            onClick={speakResult}
                            className="w-16 h-16 rounded-full bg-amber-500/10 hover:bg-amber-500 hover:text-stone-950 text-amber-500 transition-all ring-1 ring-amber-500/20 group/audio"
                          >
                            <Volume2 className="w-8 h-8 group-hover/audio:scale-110 transition-transform" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-stone-700 font-black uppercase tracking-widest text-xs opacity-50">En attente</span>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-500/10 via-stone-900/60 to-orange-600/10 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden group">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 ring-1 ring-white/10">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Enrichir le dictionnaire</h3>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Apprentissage supervisé</p>
          </div>
        </div>
        <form onSubmit={handleAddEducation} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Original</Label>
              <Input 
                placeholder="Ex: Bonjour"
                value={eduSourceWord}
                onChange={(e) => setEduSourceWord(e.target.value)}
                className="bg-black/40 border-white/5 h-14 rounded-2xl text-stone-100 font-bold focus:ring-amber-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">
                {allLangs.find((l) => l.code === targetLang)?.name ?? "Traduction"}
              </Label>
              <Input 
                placeholder="Traduction..."
                value={eduTargetWord}
                onChange={(e) => setEduTargetWord(e.target.value)}
                className="bg-black/40 border-white/5 h-14 rounded-2xl text-stone-100 font-bold focus:ring-amber-500/30"
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest shadow-xl bg-white text-stone-950 hover:bg-stone-200 transition-all text-xs border-b-4 border-stone-300">
            Enregistrer la traduction
          </Button>
        </form>
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-start gap-4 shadow-inner">
        <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-500 border border-amber-500/30 shadow-lg">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-white text-xs uppercase tracking-wider italic">Sauvegarde</h4>
          <p className="text-sm text-stone-500 leading-relaxed font-medium">Toutes vos modifications sont enregistrées localement dans votre navigateur.</p>
        </div>
      </div>
    </div>
  );
}