import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Camera, Upload, X, Check, Sparkles, Loader2 } from 'lucide-react';
import { extractTextFromImage } from '../lib/ocr-engine';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentScannerProps {
  onTextExtracted: (text: string) => void;
  onClose: () => void;
}

export function DocumentScanner({ onTextExtracted, onClose }: DocumentScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image) return;
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // For Tesseract we can pass the dataURL directly
      const text = await extractTextFromImage(image, (p) => setProgress(p));
      if (text.trim()) {
        onTextExtracted(text);
      } else {
        toast.error("Aucun texte n'a pu être extrait de cette image.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'analyse de l'image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-stone-900 border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-black uppercase italic tracking-tighter text-white">Scanner Document</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
            <X className="w-5 h-5 text-stone-500" />
          </Button>
        </div>

        <div className="p-8 space-y-6">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/30 hover:bg-white/5 transition-all group"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-stone-600 group-hover:text-amber-500 group-hover:scale-110 transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-stone-500 group-hover:text-stone-300 transition-all">
                Prendre une photo ou importer
              </p>
              <p className="px-6 text-center text-[10px] font-medium text-stone-600">
                Première analyse : le modèle OCR (français + anglais) est téléchargé, puis mis en cache.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-inner">
                <img src={image} className="w-full h-full object-cover" alt="Capture" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isProcessing ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                    <span>Analyse intelligente</span>
                    <span>{Math.round(progress * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-stone-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-bold uppercase">Lecture des caractères...</span>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleProcess}
                  className="w-full h-14 rounded-2xl bg-amber-500 text-stone-950 font-black uppercase italic tracking-widest hover:bg-amber-400 shadow-xl"
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  Analyser le texte
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}