
import React from 'react';
import { AppView, KeyStatus } from '../types';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  keyStatus: KeyStatus;
  onAuth: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, keyStatus, onAuth }) => {
  const navItems = [
    { id: 'dashboard', label: 'Kontrollzentrum', icon: 'fas fa-chart-network' },
    { id: 'scanner', label: 'HD Erfassung', icon: 'fas fa-camera-viewfinder' },
    { id: 'collection', label: 'Hauptarchiv', icon: 'fas fa-database' },
    { id: 'appraisal', label: 'Marktanalyse', icon: 'fas fa-award' },
  ];

  return (
    <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 flex-col z-50">
      <div className="p-10">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100">
            <i className="fas fa-stamp text-2xl"></i>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 block leading-none">PhilatelyAI</span>
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em] mt-1 block">Pro Suite 2026</span>
          </div>
        </div>

        <div className="space-y-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all group ${
                currentView === item.id 
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300 translate-x-2' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                currentView === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50'
              }`}>
                <i className={`${item.icon} text-base`}></i>
              </div>
              <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-10">
        <div className={`rounded-[2.5rem] p-8 border transition-all duration-500 shadow-2xl relative group/card ${keyStatus === 'valid' ? 'bg-emerald-600 border-emerald-500' : keyStatus === 'invalid' ? 'bg-red-600 border-red-500' : 'bg-slate-100 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${keyStatus === 'valid' ? 'bg-white animate-pulse' : keyStatus === 'missing' ? 'bg-slate-400' : 'bg-amber-500'}`}></div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${keyStatus === 'missing' ? 'text-slate-500' : 'text-white'}`}>System-Sicherheit</p>
            </div>
            
            {/* Enterprise Info Tooltip */}
            <div className="relative group/info">
              <i className={`fas fa-circle-info cursor-help transition-colors text-xs ${keyStatus === 'missing' ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white'}`}></i>
              <div className="absolute bottom-full right-0 mb-3 w-48 bg-slate-900 text-[9px] text-slate-300 p-4 rounded-2xl border border-white/10 shadow-2xl invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-2 group-hover/info:translate-y-0 z-[100]">
                <p className="font-bold text-white mb-1 uppercase tracking-wider">Enterprise Status</p>
                Der weltweite Datenbank-Abgleich (Google Search Grounding) erfordert zwingend einen API-Key aus einem <strong>kostenpflichtigen GCP-Projekt</strong> mit aktiver Abrechnung.
                <div className="absolute bottom-[-6px] right-2 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45"></div>
              </div>
            </div>
          </div>
          
          <p className={`text-[11px] leading-relaxed font-bold mb-6 ${keyStatus === 'missing' ? 'text-slate-500' : 'text-white/70'}`}>
            {keyStatus === 'valid' && 'Enterprise Lizenz aktiv. Alle Pro-Module verifiziert.'}
            {keyStatus === 'invalid' && 'API-Key ungültig oder keine Enterprise-Berechtigung.'}
            {keyStatus === 'missing' && 'Demo-Modus aktiv. API-Funktionen deaktiviert.'}
            {keyStatus === 'checking' && 'Validiere Sicherheits-Zertifikat...'}
          </p>
          <button 
            onClick={onAuth}
            className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active-scale ${
              keyStatus === 'valid' 
                ? 'bg-white text-emerald-600 hover:bg-emerald-50' 
                : keyStatus === 'missing'
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {keyStatus === 'valid' ? 'Key Verwalten' : 'Key Konfigurieren'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
