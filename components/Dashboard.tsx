
import React, { useState, useEffect } from 'react';
import { AppView, Stamp, PhilatelicNews } from '../types';
import { fetchPhilatelicNews } from '../services/geminiService';

interface DashboardProps {
  collection: Stamp[];
  onViewChange: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ collection, onViewChange }) => {
  const [copied, setCopied] = useState(false);
  const [news, setNews] = useState<PhilatelicNews[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsNewsLoading(true);
    try {
      const data = await fetchPhilatelicNews();
      setNews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsNewsLoading(false);
    }
  };

  const parseCurrency = (valStr: string | undefined): number => {
    if (!valStr) return 0;
    let clean = valStr.replace(/[^\d.,-]/g, '').trim();
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.lastIndexOf('.') > clean.lastIndexOf(',') ? clean.replace(/,/g, '') : clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const copyUrl = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const totalValueNum = collection.reduce((acc, stamp) => acc + parseCurrency(stamp.expertValuation || stamp.estimatedValue), 0);
  const totalValue = `€${totalValueNum.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=0f172a&margin=15`;

  const marketIndex = [
    { name: 'Europa Klassik', trend: '+4.2%', color: 'bg-emerald-500' },
    { name: 'China Modern', trend: '+12.8%', color: 'bg-indigo-600' },
    { name: 'USA Rare', trend: '-1.2%', color: 'bg-amber-500' },
    { name: 'Commonwealth', trend: '+0.5%', color: 'bg-slate-400' },
  ];

  const getNewsIcon = (type: string) => {
    switch (type) {
      case 'auction': return 'fas fa-gavel text-amber-500';
      case 'discovery': return 'fas fa-magnifying-glass-location text-emerald-500';
      case 'trend': return 'fas fa-chart-line text-indigo-500';
      default: return 'fas fa-newspaper text-slate-400';
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-16">
      {/* Live Market Ticker */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Live Marktticker</h4>
          </div>
          <button 
            onClick={loadNews} 
            disabled={isNewsLoading}
            className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 disabled:opacity-50 transition-all"
          >
            {isNewsLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-rotate mr-2"></i>}
            Aktualisieren
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 px-2 scrollbar-thin">
          {isNewsLoading && news.length === 0 ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="min-w-[300px] h-32 bg-slate-50 rounded-xl border border-slate-100"></div>
            ))
          ) : news.length > 0 ? (
            news.map((item, idx) => (
              <a 
                key={idx} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="min-w-[300px] md:min-w-[350px] bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-xs shadow-sm">
                    <i className={getNewsIcon(item.type)}></i>
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.source}</span>
                </div>
                <h5 className="text-[11px] font-bold text-slate-900 leading-tight mb-2 uppercase">{item.title}</h5>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>
              </a>
            ))
          ) : (
            <div className="w-full py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Keine aktuellen Daten verfügbar.</div>
          )}
        </div>
      </section>

      {/* Real-time Pro Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Gesamtwert Portfolio</p>
          <div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{totalValue}</h4>
            <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1.5">
              <i className="fas fa-chart-line"></i> +5.8% YTD
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Datenbank-Bestand</p>
          <div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{collection.length} Objekte</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Master-Archiv</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Geprüfte Zertifikate</p>
          <div>
            <h4 className="text-3xl font-black text-indigo-600 tracking-tighter">
              {collection.filter(s => s.expertStatus === 'appraised').length} Einheiten
            </h4>
            <p className="text-[10px] text-indigo-400 font-bold mt-2 uppercase tracking-wider">Experten-Geprüft</p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col justify-between h-full">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Markt-Index</p>
          <div className="space-y-2">
            {marketIndex.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 truncate pr-2">{item.name}</span>
                <span className={`text-[10px] font-black ${item.trend.startsWith('+') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Industrial CTA */}
      <div className="bg-slate-900 p-8 md:p-12 rounded-3xl text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-lg">
        <div className="max-w-2xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
            <span className="px-3 py-1 bg-indigo-600 rounded text-[9px] font-bold uppercase tracking-widest">Profi-Standard</span>
            <div className="h-px w-8 bg-slate-700"></div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vision Core 3</span>
          </div>
          <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-tight">
            Präzisions-Erfassung
          </h3>
          <p className="text-slate-400 mb-8 font-medium text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
            Hochpräzise Bilderkennung für Sammler. Gleichen Sie Bestände sofort mit globalen Auktionsdaten ab.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4">
            <button 
              onClick={() => onViewChange('scanner')} 
              className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-3"
            >
              <i className="fas fa-camera-viewfinder text-lg text-indigo-600"></i>
              HD Scanner
            </button>
            <button 
              onClick={() => onViewChange('collection')}
              className="bg-transparent border border-slate-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center"
            >
              Archiv
            </button>
          </div>
        </div>
        
        <div className="hidden lg:block opacity-20">
             <i className="fas fa-stamp text-9xl text-white"></i>
        </div>
      </div>

      {/* Connectivity Hub */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-shrink-0">
          <img 
            src={qrCodeUrl} 
            alt="QR Hub" 
            className="w-32 h-32 object-contain"
          />
        </div>

        <div className="flex-grow text-center md:text-left">
          <div className="mb-4">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase tracking-[0.2em] inline-block mb-2">Sync</span>
            <h4 className="text-2xl font-black tracking-tight text-slate-900">Remote-Erfassungs-Hub</h4>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 max-w-xl">
            Verknüpfen Sie mobile Endgeräte als externe HD-Erfassungseinheiten.
          </p>
          
          <button 
            onClick={copyUrl}
            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 mx-auto md:mx-0 ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {copied ? <><i className="fas fa-check"></i> Kopiert</> : <><i className="fas fa-link"></i> System-URL</>}
          </button>
        </div>
      </div>
      
      {/* Portfolio Snapshot */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Schnellübersicht</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Neueste Objekte</p>
          </div>
          <button onClick={() => onViewChange('collection')} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">Alle Anzeigen</button>
        </div>
        
        {collection.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
              <i className="fas fa-box-archive text-xl"></i>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Archiv leer</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {collection.slice(0, 6).map(s => (
              <div key={s.id} onClick={() => onViewChange('collection')} className="group bg-white p-3 rounded-2xl border border-slate-200 cursor-pointer hover:border-indigo-500 transition-colors">
                <div className="aspect-square overflow-hidden rounded-xl mb-3 bg-slate-100 relative">
                  <img src={s.image} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-bold text-slate-900 truncate uppercase">{s.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-emerald-600 font-bold">{s.estimatedValue}</span>
                  <span className="text-[8px] font-bold text-slate-400">{s.year}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
