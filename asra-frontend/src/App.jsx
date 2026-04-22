import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Search, History as HistoryIcon, Sun, Moon, 
  AlertTriangle, CheckCircle, Lightbulb, Calendar, 
  ArrowRight, Cpu, Eye, Fingerprint, Activity, 
  Trash2, Zap, BarChart3, Globe 
} from 'lucide-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- 1. STATE MANAGEMENT (Zustand + Persistence) ---
const useASRAStore = create(persist((set) => ({
  theme: 'dark',
  history: [],
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  addToHistory: (entry) => set((state) => ({ 
    history: [entry, ...state.history].slice(0, 30) 
  })),
  clearHistory: () => set({ history: [] })
}), { name: 'asra-v3-pro-storage' }));

export default function App() {
  const { theme, history, toggleTheme, addToHistory, clearHistory } = useASRAStore();
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState('scan');

  // Sync Tailwind Dark Mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Analytics Stats
  const phishingCount = history.filter(item => item.status === 'PHISHING').length;
  const safeCount = history.length - phishingCount;

  // --- 2. THE MASTER SCAN LOGIC ---
  const handleScan = async (e) => {
    e.preventDefault();
    if (!urlInput) return;
    setLoading(true);
    setResult(null);

    try {
      // One single call to your Python Backend
      // Backend now handles BERT + CNN + WHOIS + GEMINI 
      const response = await fetch(`http://127.0.0.1:8000/scan?url=${encodeURIComponent(urlInput)}`);
      if (!response.ok) throw new Error("Backend Offline");
      
      const data = await response.json();

      const scanEntry = {
        ...data,
        url: urlInput,
        time: new Date().toLocaleString()
      };

      setResult(scanEntry);
      addToHistory(scanEntry);
    } catch (err) {
      alert("ASRA System Error: Ensure your Python backend (asra_api.py) is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-700 bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      {/* GLOWING MESH BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-20 bg-[radial-gradient(circle_at_50%_0%,#3b82f6,transparent_50%)]" />

      <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* --- NAVIGATION --- */}
        <nav className="flex justify-between items-center mb-16 backdrop-blur-2xl bg-white/40 dark:bg-white/5 border border-white/20 p-5 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 1 }} className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/40 text-white">
              <Shield size={28} fill="currentColor"/>
            </motion.div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none uppercase italic">ASRA</h1>
              <span className="text-[10px] font-black text-blue-500 tracking-[0.3em]">INTELLIGENCE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400">
              <button onClick={() => setView('scan')} className={`hover:text-blue-500 transition-all ${view==='scan'?'text-blue-500 scale-110':''}`}>SCANNER</button>
              <button onClick={() => setView('history')} className={`hover:text-blue-500 transition-all ${view==='history'?'text-blue-500 scale-110':''}`}>ANALYTICS</button>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2" />
            <button onClick={toggleTheme} className="p-2 hover:bg-white/10 rounded-full transition-all text-orange-400">
              {theme === 'light' ? <Moon size={22}/> : <Sun size={22}/>}
            </button>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {view === 'scan' ? (
            <motion.div key="scan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              
              {/* HERO SECTION */}
              <div className="max-w-3xl mx-auto text-center mb-16">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 text-[10px] font-black tracking-widest uppercase mb-6">
                  <Zap size={12} className="animate-pulse" /> Advanced Multi-Modal Detection
                </motion.div>
                <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9]">Autonomous Security & Risk Analytics</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                  ASRA orchestrates BERT Transformers and CNN-LSTM branches to perform deep forensic URL inspection.
                </p>
              </div>

              {/* INPUT BOX */}
              <div className="max-w-3xl mx-auto mb-20">
                <form onSubmit={handleScan} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-[3rem] blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity" />
                  <div className="relative flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-[2.8rem] p-3 shadow-2xl border border-white/10">
                    <div className="flex-1 flex items-center px-6">
                      <Globe size={20} className="text-slate-400 mr-4" />
                      <input 
                        type="text" value={urlInput} onChange={(e)=>setUrlInput(e.target.value)}
                        placeholder="Enter suspicious URL for forensic audit..."
                        className="w-full bg-transparent py-5 outline-none font-bold text-lg dark:text-white"
                      />
                    </div>
                    <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-[2.2rem] font-black tracking-tighter shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                      {loading ? "AUDITING..." : "DEEP SCAN"} <ArrowRight size={20} className={loading?'animate-ping':''}/>
                    </button>
                  </div>
                </form>

                {/* SCANNING ANIMATION (RADAR) */}
                {loading && (
                  <div className="mt-20 flex flex-col items-center">
                    <div className="relative w-56 h-56 flex items-center justify-center">
                       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 border-b-4 border-blue-500 rounded-full" />
                       <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 5, ease: "linear" }} className="absolute inset-4 border-t-2 border-indigo-500/30 rounded-full" />
                       <Cpu size={50} className="text-blue-500 animate-pulse" />
                    </div>
                    <p className="mt-10 font-black italic text-blue-500 tracking-[0.4em] animate-pulse uppercase text-[10px]">Processing Multi-Modal Threat Matrix...</p>
                  </div>
                )}

                {/* ADVANCED RESULT CARD */}
                {result && !loading && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-16">
                    <div className={`p-1.5 rounded-[4rem] bg-gradient-to-br ${result.status === 'PHISHING' ? 'from-red-600 via-orange-500 to-red-700' : 'from-emerald-500 via-teal-400 to-emerald-600'} shadow-[0_0_80px_-15px_rgba(0,0,0,0.3)]`}>
                      <div className="bg-white dark:bg-[#080c18] rounded-[3.8rem] p-10 md:p-14 overflow-hidden relative shadow-inner">
                        
                        {/* Status Header */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-b border-slate-100 dark:border-white/5 pb-12">
                          <div className="text-center md:text-left">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4 block">Intelligence Verdict</span>
                             <h3 className={`text-6xl md:text-7xl font-black leading-none tracking-tighter ${result.status === 'PHISHING' ? 'text-red-500' : 'text-emerald-500'}`}>
                               {result.status === 'PHISHING' ? 'THREAT' : 'SAFE'}
                             </h3>
                             <p className="mt-4 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl font-mono text-[11px] text-slate-400 border border-white/5 italic truncate max-w-[400px]">
                               {result.url}
                             </p>
                          </div>

                          {/* Risk Gauge */}
                          <div className="relative w-48 h-48 flex items-center justify-center">
                             <svg className="w-full h-full -rotate-90">
                               <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-white/5" />
                               <motion.circle 
                                  cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="16" fill="transparent"
                                  strokeDasharray="528" initial={{ strokeDashoffset: 528 }} 
                                  animate={{ strokeDashoffset: 528 - (528 * parseFloat(result.probability))/100 }}
                                  transition={{ duration: 2.5, ease: "circOut" }}
                                  className={result.status === 'PHISHING' ? 'text-red-500' : 'text-emerald-500'}
                               />
                             </svg>
                             <div className="absolute text-center">
                                <span className="text-4xl font-black block">{result.probability}</span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confidence</span>
                             </div>
                          </div>
                        </div>

                        {/* TRIO ANALYSIS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                           <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-white/5 flex flex-col items-center text-center group">
                              <div className="p-4 bg-blue-500/10 rounded-2xl mb-4 text-blue-500 group-hover:scale-110 transition-transform"><Cpu size={24}/></div>
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Semantic (BERT)</p>
                              <p className="font-bold text-sm">{result.status === 'PHISHING' ? 'Context Flagged' : 'Normal Intent'}</p>
                           </div>
                           <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-white/5 flex flex-col items-center text-center group">
                              <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4 text-indigo-500 group-hover:scale-110 transition-transform"><Fingerprint size={24}/></div>
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Visual (CNN)</p>
                              <p className="font-bold text-sm">{result.status === 'PHISHING' ? 'Anomalous Patterns' : 'Standard Logic'}</p>
                           </div>
                           <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-white/5 flex flex-col items-center text-center group">
                              <div className="p-4 bg-teal-500/10 rounded-2xl mb-4 text-teal-500 group-hover:scale-110 transition-transform"><Eye size={24}/></div>
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Identity (WHOIS)</p>
                              <p className="font-bold text-sm tracking-tight">{result.age_days < 30 ? 'Suspicious Age' : 'Verified'}</p>
                           </div>
                        </div>

                        {/* GEMINI FORENSIC BREAKDOWN */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mt-10 p-8 rounded-[2.5rem] bg-blue-600/5 dark:bg-blue-500/5 border border-blue-500/10 relative group">
                           <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-500 rounded-lg text-white shadow-lg"><Lightbulb size={18}/></div>
                              <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">Forensic Intelligence breakdown</h4>
                           </div>
                           <p className="text-md leading-relaxed font-bold italic text-slate-700 dark:text-slate-200 antialiased pr-10">
                              "{result.tips}"
                           </p>
                           <Zap size={100} className="absolute -bottom-10 -right-10 text-blue-500 opacity-[0.03] -rotate-12" />
                        </motion.div>

                        <div className="mt-8 flex flex-wrap gap-2">
                           <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black flex items-center gap-2 border border-white/5 uppercase tracking-widest text-slate-500">
                              <Calendar size={14} className="text-blue-500"/> Registration: {result.created_on}
                           </div>
                           {result.status === 'PHISHING' && (
                              <div className="px-5 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black flex items-center gap-2 border border-red-500/10 uppercase tracking-widest animate-pulse">
                                 <AlertTriangle size={14}/> Credential Harvesting Detected
                              </div>
                           )}
                        </div>

                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            /* --- HISTORY / ANALYTICS VIEW --- */
            <motion.div key="history" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-white/10 shadow-xl">
                  <BarChart3 size={24} className="text-blue-500 mb-4"/>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Volume</p>
                  <p className="text-4xl font-black">{history.length}</p>
                </div>
                <div className="bg-red-500/5 p-8 rounded-[2rem] border border-red-500/10 shadow-xl">
                  <AlertTriangle size={24} className="text-red-500 mb-4"/>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Threats Mitigated</p>
                  <p className="text-4xl font-black text-red-500">{phishingCount}</p>
                </div>
                <div className="bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/10 shadow-xl">
                  <CheckCircle size={24} className="text-emerald-500 mb-4"/>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Safe Navigation</p>
                  <p className="text-4xl font-black text-emerald-500">{safeCount}</p>
                </div>
                <div className="bg-blue-600 p-8 rounded-[2rem] shadow-xl text-white flex flex-col justify-between">
                  <Cpu size={24} className="mb-4 opacity-50"/>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">System Uptime</p>
                    <p className="text-2xl font-black tracking-tighter italic">ASRA ACTIVE</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] p-8 border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-10 px-4">
                   <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                     <Activity className="text-blue-500" /> THREAT ACTIVITY LOG
                   </h2>
                   {history.length > 0 && (
                     <button onClick={clearHistory} className="text-xs font-black text-red-500 hover:scale-105 transition-transform flex items-center gap-2">
                       <Trash2 size={16} /> WIPE AUDIT TRAIL
                     </button>
                   )}
                </div>

                <div className="space-y-4">
                  {history.map((item, i) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={i} className="group p-6 bg-white dark:bg-[#0a0f1e] rounded-[1.8rem] border border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-blue-500/40 transition-all shadow-md">
                      <div className="w-full md:max-w-[60%]">
                        <p className="font-bold truncate text-sm mb-2 group-hover:text-blue-500 transition-colors">{item.url}</p>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                          <span className="flex items-center gap-1"><Calendar size={10}/> {item.time}</span>
                          <span className="flex items-center gap-1"><Shield size={10}/> RISK: {item.probability}</span>
                        </div>
                      </div>
                      <div className={`px-6 py-2.5 rounded-xl text-[10px] font-black text-white ${item.status === 'PHISHING' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                        {item.status}
                      </div>
                    </motion.div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-20 opacity-20 flex flex-col items-center">
                       <BarChart3 size={80} className="mb-6" />
                       <p className="font-black italic tracking-[0.5em] text-sm">NO DATA PACKETS DETECTED</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-40 pb-20 text-center relative">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent mb-10" />
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">ASRA v3.2 • INTEGRATED THREAT ANALYTICS • © 2026</p>
        </footer>
      </div>
    </div>
  );
}