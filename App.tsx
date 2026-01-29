
import React, { useState, useEffect } from 'react';
import { AppView, Stamp, KeyStatus } from './types';
import { validateApiKey } from './services/geminiService';
import Dashboard from './components/Dashboard';
import StampScanner from './components/StampScanner';
import StampCollection from './components/StampCollection';
import ExpertAppraisal from './components/ExpertAppraisal';
import Navigation from './components/Navigation';
import PhilatelicAdvisor from './components/PhilatelicAdvisor';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [collection, setCollection] = useState<Stamp[]>([]);
  const [albums, setAlbums] = useState<string[]>(['Master Archiv', 'Europa Klassik', 'Investment Portfolio', 'Seltenheiten', 'Auktions-Vorbereitung']);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [hasAIStudio, setHasAIStudio] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check key status on mount or when key is supposedly updated
  const checkKeyStatus = async () => {
    setKeyStatus('checking');
    try {
      // @ts-ignore
      const aiStudioAvailable = window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function';
      setHasAIStudio(!!aiStudioAvailable);

      if (aiStudioAvailable) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setKeyStatus('missing');
          return;
        }
        // Key exists in AI Studio, validate it
        const isValid = await validateApiKey();
        setKeyStatus(isValid ? 'valid' : 'invalid');
      } else {
        // Fallback: Check for local environment variable (e.g. from .env)
        if (process.env.API_KEY) {
           const isValid = await validateApiKey();
           setKeyStatus(isValid ? 'valid' : 'invalid');
        } else {
           setKeyStatus('missing');
        }
      }
    } catch (e) {
      setKeyStatus('missing');
    }
  };

  useEffect(() => {
    checkKeyStatus();
    
    const savedCollection = localStorage.getItem('philately_pro_v4_archive');
    if (savedCollection) {
      try {
        setCollection(JSON.parse(savedCollection));
      } catch (e) { console.error("Archive Load Error", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('philately_pro_v4_archive', JSON.stringify(collection));
  }, [collection]);

  // Handle opening the key selector. 
  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setKeyStatus('valid');
        setIsDemoMode(false);
      }
    } catch (e) {
      console.error("Key Selector Error", e);
    }
  };

  const addToCollection = (stamp: Stamp) => {
    setCollection(prev => [stamp, ...prev]);
    setCurrentView('collection');
  };

  const removeFromCollection = (id: string) => {
    if (window.confirm('Eintrag unwiderruflich aus der Master-Datenbank löschen?')) {
      setCollection(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateStamp = (updated: Stamp) => {
    setCollection(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const addAlbum = (name: string) => {
    if (name && !albums.includes(name)) {
      setAlbums([...albums, name]);
    }
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `PhilatelyAI_Enterprise_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (keyStatus === 'checking') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">System-Validierung...</p>
      </div>
    );
  }

  // Key Selection Screen (Missing or Invalid) - Bypass if Demo Mode is active
  if ((keyStatus === 'missing' || keyStatus === 'invalid') && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white text-4xl mb-8 shadow-2xl ${keyStatus === 'invalid' ? 'bg-red-600 animate-pulse' : 'bg-indigo-600'}`}>
          <i className={`fas ${keyStatus === 'invalid' ? 'fa-exclamation-triangle' : 'fa-lock'}`}></i>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter">
          {keyStatus === 'invalid' ? 'Berechtigungs-Fehler' : 'PhilatelyAI Enterprise'}
        </h1>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          {keyStatus === 'invalid' 
            ? 'Ihr API-Key wurde erkannt, hat aber keine Berechtigung für Enterprise-Features. Stellen Sie sicher, dass Sie ein Paid GCP-Projekt mit aktiver Abrechnung verwenden.' 
            : hasAIStudio 
              ? 'Dieses System nutzt Enterprise-Features (Google Search Grounding), die einen API-Key aus einem Paid GCP-Projekt erfordern.'
              : 'Kein API-Key gefunden. Bitte konfigurieren Sie die Umgebungsvariable "API_KEY" oder starten Sie im Demo-Modus.'}
        </p>
        
        {hasAIStudio ? (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={handleOpenKeySelector}
              className="bg-white text-slate-900 px-8 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active-scale"
            >
              API-Key {keyStatus === 'invalid' ? 'wechseln' : 'auswählen'}
            </button>
            <button 
              onClick={checkKeyStatus}
              className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white"
            >
              Erneut prüfen
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Lokale Konfiguration:</p>
              <code className="block bg-slate-950 p-3 rounded-lg text-emerald-400 text-xs font-mono mb-4">
                API_KEY=AIzaSy...
              </code>
              <button 
                onClick={checkKeyStatus}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all"
              >
                Konfiguration neu laden
              </button>
            </div>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-slate-900 px-2 text-slate-500">Oder</span></div>
            </div>

            <button 
              onClick={() => setIsDemoMode(true)}
              className="bg-slate-800 text-slate-300 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            >
              Als Demo starten (Offline)
            </button>
          </div>
        )}

        <div className="mt-8">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">
            Abrechnung aktivieren <i className="fas fa-external-link-alt ml-1"></i>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-0 md:pl-72 bg-[#fafafa]">
      <Navigation currentView={currentView} onViewChange={setCurrentView} keyStatus={isDemoMode ? 'missing' : keyStatus} onAuth={hasAIStudio ? handleOpenKeySelector : () => {}} />

      <main className="px-4 py-8 md:p-12 max-w-[1600px] mx-auto w-full">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8 md:pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                {isDemoMode ? 'Demo Modus - API Inaktiv' : 'Enterprise Status: Aktiv'}
              </span>
              <div className="h-4 w-px bg-slate-200"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PhilatelyAI Pro Suite 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              {currentView === 'dashboard' && 'Kontrollzentrum'}
              {currentView === 'scanner' && 'HD Erfassung'}
              {currentView === 'collection' && 'Hauptarchiv'}
              {currentView === 'appraisal' && 'Marktanalyse'}
            </h1>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="text-left md:text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System-Synch</p>
              <p className="text-[11px] font-bold text-slate-900">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            {hasAIStudio && (
              <button onClick={handleOpenKeySelector} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm hover:text-indigo-600 transition-colors">
                <i className="fas fa-key text-sm"></i>
              </button>
            )}
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {currentView === 'dashboard' && <Dashboard collection={collection} onViewChange={setCurrentView} />}
          {currentView === 'scanner' && <StampScanner onSave={addToCollection} onCancel={() => setCurrentView('dashboard')} onOpenKeySelector={handleOpenKeySelector} albums={albums} onKeyInvalid={() => !isDemoMode && setKeyStatus('invalid')} />}
          {currentView === 'collection' && (
            <StampCollection 
              collection={collection} 
              onDelete={removeFromCollection} 
              onUpdate={updateStamp} 
              albums={albums}
              onExport={exportData}
              onAddAlbum={addAlbum}
            />
          )}
          {currentView === 'appraisal' && <ExpertAppraisal collection={collection} onUpdate={updateStamp} />}
        </div>
      </main>

      {/* Philatelic Advisor Floating UI */}
      {!isAdvisorOpen && (
        <button 
          onClick={() => setIsAdvisorOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] z-[550] hover:bg-indigo-600 transition-all hover:-translate-y-2 active-scale border-4 border-white"
        >
          <i className="fas fa-comments-alt text-xl"></i>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}
      
      <PhilatelicAdvisor 
        collection={collection} 
        isOpen={isAdvisorOpen} 
        onClose={() => setIsAdvisorOpen(false)} 
      />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 px-6 py-4 flex justify-between items-center z-[100] pb-safe shadow-2xl">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${currentView === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`}>
          <i className="fas fa-grid-2 text-xl"></i>
          <span className="text-[7px] font-black uppercase tracking-widest">Übersicht</span>
        </button>
        <button onClick={() => setCurrentView('collection')} className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${currentView === 'collection' ? 'text-indigo-400' : 'text-slate-500'}`}>
          <i className="fas fa-layer-group text-xl"></i>
          <span className="text-[7px] font-black uppercase tracking-widest">Archiv</span>
        </button>
        <div className="flex-1 flex justify-center">
          <button onClick={() => setCurrentView('scanner')} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center -mt-12 shadow-2xl border-4 border-slate-900 active-scale">
            <i className="fas fa-camera-viewfinder text-xl"></i>
          </button>
        </div>
        <button onClick={() => setCurrentView('appraisal')} className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${currentView === 'appraisal' ? 'text-indigo-400' : 'text-slate-500'}`}>
          <i className="fas fa-award text-xl"></i>
          <span className="text-[7px] font-black uppercase tracking-widest">Markt</span>
        </button>
        <button onClick={() => setIsAdvisorOpen(true)} className="flex flex-col items-center gap-1.5 transition-all flex-1 text-amber-400">
          <i className="fas fa-comment-dots text-xl"></i>
          <span className="text-[7px] font-black uppercase tracking-widest">Advisor</span>
        </button>
      </div>
    </div>
  );
};

export default App;
