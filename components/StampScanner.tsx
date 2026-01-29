
import React, { useState, useRef } from 'react';
import { analyzeStamp } from '../services/geminiService';
import { Stamp } from '../types';

interface StampScannerProps {
  onSave: (stamp: Stamp) => void;
  onCancel: () => void;
  onOpenKeySelector: () => void;
  albums: string[];
  onKeyInvalid?: () => void;
}

interface ScanItem {
  id: string;
  image: string;
  status: 'idle' | 'analyzing' | 'done' | 'error';
  statusText?: string;
  result?: Partial<Stamp>;
  error?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const StampScanner: React.FC<StampScannerProps> = ({ onSave, onCancel, onOpenKeySelector, albums, onKeyInvalid }) => {
  const [items, setItems] = useState<ScanItem[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find(i => i.id === selectedItemId);

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error("Datei zu groß (Max. 20MB)"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Fehler beim Lesen"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsReadingFiles(true);
    const fileList = Array.from(files) as File[];
    const newItems: ScanItem[] = [];
    
    for (const file of fileList) {
      try {
        const imageData = await readFile(file);
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          image: imageData,
          status: 'idle'
        });
      } catch (err) { console.error(err); }
    }

    setItems(prev => [...prev, ...newItems]);
    if (!selectedItemId && newItems.length > 0) setSelectedItemId(newItems[0].id);
    setIsReadingFiles(false);
    if (e.target) e.target.value = '';
  };

  const updateItemStatus = (id: string, updates: Partial<ScanItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const startAnalysis = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.status === 'analyzing' || item.status === 'done') return;

    updateItemStatus(id, { status: 'analyzing', statusText: 'Bild-Analyse...', error: undefined });

    try {
      await sleep(500);
      updateItemStatus(id, { statusText: 'Weltweiter DB-Abgleich...' });
      
      const data = await analyzeStamp(item.image, undefined, { deepAnalysis: true });
      
      updateItemStatus(id, { statusText: 'Marktwert-Ermittlung...', status: 'analyzing' });
      await sleep(300);

      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'done', result: data, statusText: 'Verifiziert' } : i));
    } catch (err: any) {
      const msg = err.message;
      if (msg === "KEY_INVALID" || msg === "QUOTA_EXHAUSTED") {
        setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: msg === "KEY_INVALID" ? "Auth-Fehler" : "Quota" } : i));
        if (msg === "KEY_INVALID") onKeyInvalid?.();
        throw err;
      }
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: "Fehler", statusText: 'Abbruch' } : i));
      throw err;
    }
  };

  const analyzeAll = async () => {
    if (isBatchAnalyzing) return;
    setIsBatchAnalyzing(true);
    
    const idleItems = items.filter(i => i.status === 'idle' || i.status === 'error');
    
    for (const item of idleItems) {
      try {
        await startAnalysis(item.id);
        await sleep(1000); 
      } catch (err: any) {
        if (err.message === "KEY_INVALID" || err.message === "QUOTA_EXHAUSTED") {
          setIsBatchAnalyzing(false);
          const confirmText = err.message === "KEY_INVALID" 
            ? "Authentifizierungsfehler: Enterprise Search erfordert einen Paid API Key. Jetzt konfigurieren?"
            : "Quota überschritten. Bitte warten.";
          if (confirm(confirmText)) {
            onOpenKeySelector();
          }
          return;
        }
      }
    }
    setIsBatchAnalyzing(false);
  };

  const saveAll = () => {
    const doneItems = items.filter(i => i.status === 'done' && i.result);
    doneItems.forEach(item => {
      const res = item.result!;
      onSave({
        id: Math.random().toString(36).substr(2, 9),
        image: item.image,
        name: res.name || 'Unbenannt',
        origin: res.origin || 'Unbekannt',
        year: res.year || 'N/A',
        estimatedValue: res.estimatedValue || '0.00 €',
        rarity: res.rarity || 'Normal',
        description: res.description || '',
        historicalContext: res.historicalContext || '',
        dateAdded: new Date().toISOString(),
        expertStatus: 'none',
        album: 'Master Archiv',
        condition: res.condition || 'Prüfung abgeschlossen',
        printingMethod: res.printingMethod,
        paperType: res.paperType,
        webRefs: res.webRefs,
        catalogId: res.catalogId,
        priceSource: res.priceSource
      });
    });
    setItems([]);
    setSelectedItemId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Objekterfassung</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Weltweiter Datenbank-Abgleich (Michel, Scott, Yvert)</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => cameraInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
            <i className="fas fa-camera"></i> Foto Direkt
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-transparent hover:bg-slate-800 text-white border border-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
            <i className="fas fa-folder-open"></i> Ordner / Dateien
          </button>
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 min-h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Warteschlange ({items.length})</span>
            </div>
            {items.length > 0 && <button onClick={() => setItems([])} className="text-red-500 text-[9px] font-black uppercase tracking-widest hover:underline">Leeren</button>}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <i className="fas fa-images text-5xl mb-4 text-slate-200"></i>
              <p className="text-xs font-bold uppercase tracking-widest">Keine Bilder</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItemId(item.id)} 
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedItemId === item.id ? 'border-indigo-600 shadow-md ring-2 ring-indigo-100' : 'border-transparent'}`}
                >
                  <img src={item.image} className="w-full h-full object-cover" />
                  {item.status === 'analyzing' && (
                    <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white p-2 text-center">
                      <i className="fas fa-spinner fa-spin text-xl mb-2 text-indigo-400"></i>
                      <span className="text-[8px] font-bold uppercase tracking-wider">{item.statusText}</span>
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center text-white p-2 text-center">
                      <i className="fas fa-exclamation text-lg mb-1"></i>
                      <span className="text-[7px] font-bold uppercase">{item.error}</span>
                    </div>
                  )}
                  {item.status === 'done' && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm">
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 p-6 rounded-3xl text-white">
             <div className="space-y-3">
               <button 
                onClick={analyzeAll} 
                disabled={isBatchAnalyzing || items.length === 0} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
               >
                 {isBatchAnalyzing ? <><i className="fas fa-spinner fa-spin"></i> Verarbeitung läuft...</> : <><i className="fas fa-globe"></i> Weltweiter Abgleich</>}
               </button>

               <button 
                onClick={saveAll} 
                disabled={!items.some(i => i.status === 'done')} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 transition-all"
               >
                 Übernehmen
               </button>

               <button onClick={onCancel} className="w-full py-2 text-slate-500 text-[9px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                 Abbrechen
               </button>
             </div>
          </div>

          {selectedItem && selectedItem.status === 'done' && selectedItem.result && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs">
                   <i className="fas fa-stamp"></i>
                 </div>
                 <h4 className="font-bold text-slate-900 text-xs uppercase tracking-tight truncate flex-1">{selectedItem.result.name}</h4>
               </div>
               
               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center mb-4">
                 <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Marktwert</span>
                 <span className="text-lg font-black text-emerald-800">{selectedItem.result.estimatedValue}</span>
               </div>
               
               <div className="space-y-3 text-sm">
                 {selectedItem.result.catalogId && (
                   <div className="flex justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-xs">Katalog Nr.</span>
                      <span className="font-bold text-indigo-600">{selectedItem.result.catalogId}</span>
                   </div>
                 )}
                 <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">Herkunft</span>
                    <span className="font-bold text-slate-800">{selectedItem.result.origin}</span>
                 </div>
                 <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">Jahr</span>
                    <span className="font-bold text-slate-800">{selectedItem.result.year}</span>
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed italic mt-2">"{selectedItem.result.description?.substring(0, 80)}..."</p>
                 
                 {selectedItem.result.webRefs && selectedItem.result.webRefs.length > 0 && (
                   <div className="pt-2">
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quellen:</p>
                     <div className="flex flex-col gap-1">
                        {selectedItem.result.webRefs.slice(0, 3).map((ref, idx) => (
                          <span key={idx} className="text-[9px] text-indigo-600 truncate block bg-indigo-50 px-2 py-1 rounded">{ref.title}</span>
                        ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StampScanner;
