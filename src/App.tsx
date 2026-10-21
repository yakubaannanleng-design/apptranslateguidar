import { useState } from 'react';
import { Translator } from './components/Translator';
import { Educator } from './components/Educator';
import { LocalServerConfig } from './components/LocalServerConfig';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, GraduationCap, Info, MapPin, Music, Server } from 'lucide-react';
import { Button } from './components/ui/button';
import { DictionaryProvider } from './context/DictionaryContext';

function App() {
  const [activeTab, setActiveTab] = useState<'translate' | 'educate' | 'info' | 'server'>('translate');
  
  const logoUrl = "/logo.jpg";
  
  return (
    <DictionaryProvider>
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden relative">
        
        {/* Background Layer */}
        <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
            style={{ backgroundImage: `url(${logoUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* Header */}
          <header className="sticky top-0 z-50 w-full bg-black/60 backdrop-blur-2xl border-b border-white/10">
            <div className="max-w-2xl mx-auto px-4 h-20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center p-0.5 shadow-2xl rotate-2 overflow-hidden border border-white/20">
                  <img src={logoUrl} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                </div>
                <div>
                  <h1 className="font-black text-xl sm:text-2xl tracking-tighter uppercase italic leading-none">
                    Traducteur<span className="text-amber-500">Guidar</span>
                  </h1>
                  <p className="text-[10px] font-bold text-stone-500 tracking-[0.2em] uppercase mt-1">Culture & Innovation</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">Cameroon</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow max-w-2xl mx-auto px-4 pt-8 pb-40 w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'translate' && (
                <motion.div
                  key="translate"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <Translator />
                </motion.div>
              )}

              {activeTab === 'educate' && (
                <motion.div
                  key="educate"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <Educator />
                </motion.div>
              )}

              {activeTab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="bg-stone-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                    <div className="relative h-48 rounded-3xl overflow-hidden mb-6">
                       <img src={logoUrl} className="w-full h-full object-cover" alt="Identity" />
                       <div className="absolute inset-0 bg-black/40" />
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">À Propos</h2>
                    <p className="text-lg text-stone-300 leading-relaxed font-medium">
                      Cette application permet de traduire entre les langues mondiales et le <strong className="text-amber-500">Guidar</strong>.
                    </p>
                    <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/5">
                      <Music className="w-10 h-10 text-amber-500" />
                      <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">Patrimoine Numérique</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'server' && (
                <motion.div
                  key="server"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <LocalServerConfig />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Navigation */}
          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
            <div className="bg-stone-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex justify-between shadow-2xl ring-1 ring-white/5">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('translate')}
                className={`relative flex flex-col items-center gap-1.5 h-16 flex-1 rounded-[2rem] transition-all duration-300 ${activeTab === 'translate' ? 'text-amber-500 bg-white/5' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <Languages className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Traduire</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setActiveTab('educate')}
                className={`relative flex flex-col items-center gap-1.5 h-16 flex-1 rounded-[2rem] transition-all duration-300 ${activeTab === 'educate' ? 'text-amber-500 bg-white/5' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <GraduationCap className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Éduquer</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setActiveTab('server')}
                className={`relative flex flex-col items-center gap-1.5 h-16 flex-1 rounded-[2rem] transition-all duration-300 ${activeTab === 'server' ? 'text-amber-500 bg-white/5' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <Server className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Serveur</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setActiveTab('info')}
                className={`relative flex flex-col items-center gap-1.5 h-16 flex-1 rounded-[2rem] transition-all duration-300 ${activeTab === 'info' ? 'text-amber-500 bg-white/5' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <Info className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Info</span>
              </Button>
            </div>
          </nav>

          <Toaster position="top-center" theme="dark" richColors />
        </div>
      </div>
    </DictionaryProvider>
  );
}

export default App;
