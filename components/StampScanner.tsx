
import React, { useState, useRef } from 'react';
import { analyzeStamp } from '../services/geminiService';
import { Stamp } from '../types';

interface StampScannerProps {
  onSave: (stamp: Stamp) => void;
  onCancel: () => void;
  albums: string[];
}

const StampScanner: React.FC<StampScannerProps> = ({ onSave, onCancel, albums }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Partial<Stamp> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState(albums[0] || 'Allgemein');
  const [keywords, setKeywords] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeStamp(image, undefined, { 
        keywords: keywords.trim() || undefined,
        qualityHint: "Fokus auf philatelistische Details",
        deepAnalysis: true // Standardmäßig technische Details mit abfragen
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (result && image) {
      const newStamp: Stamp = {
        id: Math.random().toString(36).substr(2, 9),
        image,
        name: result.name || 'Unbekannte Marke',
        origin: result.origin || 'Unbekannt',
        year: result.year || 'Unbekannt',
        estimatedValue: result.estimatedValue || '0.00 €',
        rarity: result.rarity || 'Häufig',
        description: result.description || '',
        dateAdded: new Date().toISOString(),
        expertStatus: 'none',
        historicalContext: result.historicalContext,
        condition: result.condition || 'Nicht bewertet',
        album: selectedAlbum,
        printingMethod: result.printingMethod,
        paperType: result.paperType,
        cancellationType: result.cancellationType
      };
      onSave(newStamp);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        {!image ? (
          <div className="p-12 text-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[16/9] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
            >
              <div className="flex gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <i className="fas fa-camera text-2xl"></i>
                </div>
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <i className="fas fa-images text-2xl"></i>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Briefmarke hinzufügen</h3>
              <p className="text-slate-400 mt-2">Foto aufnehmen oder Datei hochladen</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          </div>
        ) : (
          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-square bg-slate-900 border-4 border-white">
                  <img src={image} alt="Vorschau" className="w-full h-full object-contain" />
                  <button onClick={() => { setImage(null); setResult(null); }} className="absolute top-4 right-4 bg-white/90 text-slate-800 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                {!result && !isAnalyzing && (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Hinweise (z.B. Wasserzeichen)..." 
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                    <button onClick={startAnalysis} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl transition-all">
                      <i className="fas fa-robot text-xl"></i> KI-Analyse starten
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Datenbank-Abgleich...</p>
                  </div>
                ) : result ? (
                  <div className="space-y-5">
                    <div className="bg-indigo-50 p-6 rounded-3xl">
                      <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-1">KI-Ergebnis</h4>
                      <h3 className="text-2xl font-black text-indigo-900 leading-tight">{result.name}</h3>
                      <p className="text-indigo-600 font-bold">{result.origin}, {result.year}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-500 font-black block uppercase">Marktwert</span>
                        <span className="text-lg font-black text-emerald-800">{result.estimatedValue}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-black block uppercase">Rarität</span>
                        <span className="text-lg font-black text-slate-700">{result.rarity}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <span className="text-[10px] text-slate-400 font-black block uppercase">Album</span>
                       <select className="w-full bg-transparent border-none p-0 font-bold text-slate-700 outline-none" value={selectedAlbum} onChange={(e) => setSelectedAlbum(e.target.value)}>
                         {albums.map(a => <option key={a} value={a}>{a}</option>)}
                       </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={handleSave} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all">Speichern</button>
                      <button onClick={onCancel} className="px-6 py-4 text-slate-400 font-bold hover:text-slate-600">Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 text-center px-6">
                    <i className="fas fa-magic text-3xl mb-4"></i>
                    <p className="text-sm font-medium">Bereit für die Analyse.</p>
                  </div>
                )}
              </div>
            </div>
            {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2"><i className="fas fa-exclamation-triangle"></i> {error}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StampScanner;
