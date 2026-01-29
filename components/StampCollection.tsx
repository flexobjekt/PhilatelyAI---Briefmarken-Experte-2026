
import React, { useState, useMemo } from 'react';
import { Stamp } from '../types';

interface StampCollectionProps {
  collection: Stamp[];
  albums: string[];
  onDelete: (id: string) => void;
  onUpdate: (stamp: Stamp) => void;
  onExport: () => void;
  onAddAlbum: (name: string) => void;
}

type SortOption = 'name' | 'estimatedValue' | 'year' | 'origin' | 'dateAdded';
type SortOrder = 'asc' | 'desc';

const StampCollection: React.FC<StampCollectionProps> = ({ 
  collection, 
  albums, 
  onDelete, 
  onUpdate, 
  onExport, 
  onAddAlbum 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  const parseValue = (val: string) => {
    return parseFloat(val.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
  };

  const filteredAndSortedCollection = useMemo(() => {
    let result = collection.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAlbum = selectedAlbum === 'all' || s.album === selectedAlbum;
      return matchesSearch && matchesAlbum;
    });

    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'estimatedValue') {
        valA = parseValue(a.expertValuation || a.estimatedValue);
        valB = parseValue(b.expertValuation || b.estimatedValue);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [collection, searchTerm, selectedAlbum, sortBy, sortOrder]);

  const handleExpertRequest = (stamp: Stamp) => {
    onUpdate({ ...stamp, expertStatus: 'pending' });
    setSelectedStamp(null);
    alert("Ihre Anfrage wurde an das Experten-Netzwerk übermittelt.");
  };

  return (
    <div className="space-y-8">
      {/* Control Bar */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Archiv durchsuchen..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <select 
            className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none"
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
          >
            <option value="all">Alle Alben</option>
            {albums.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <div className="flex bg-slate-50 border border-slate-200 rounded-2xl p-1">
            <button 
              onClick={() => setSortBy('dateAdded')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'dateAdded' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >Datum</button>
            <button 
              onClick={() => setSortBy('estimatedValue')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'estimatedValue' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >Wert</button>
          </div>

          <button 
            onClick={onExport}
            className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active-scale"
          >
            <i className="fas fa-download mr-2"></i> Export
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredAndSortedCollection.length === 0 ? (
        <div className="bg-white py-32 rounded-[4rem] border-2 border-dashed border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <i className="fas fa-filter text-3xl"></i>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Keine Treffer im Archiv</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
          {filteredAndSortedCollection.map(stamp => (
            <div 
              key={stamp.id} 
              onClick={() => setSelectedStamp(stamp)}
              className="group bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer relative overflow-hidden"
            >
              <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 shadow-inner relative">
                <img src={stamp.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                {stamp.expertStatus === 'appraised' && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                    Verifiziert
                  </div>
                )}
              </div>
              <div className="space-y-4 px-2">
                <div>
                  <h4 className="font-black text-slate-900 text-lg tracking-tight truncate uppercase">{stamp.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stamp.origin} · {stamp.year}</p>
                     {stamp.catalogId && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[9px] font-bold">{stamp.catalogId}</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marktwert</span>
                  <span className="text-xl font-black text-emerald-600">{stamp.expertValuation || stamp.estimatedValue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedStamp && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[400] flex items-center justify-center p-4 md:p-10">
          <div className="bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] rounded-[3rem] md:rounded-[4rem] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setSelectedStamp(null)}
              className="absolute top-6 right-6 md:top-10 md:right-10 z-[500] w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-all shadow-2xl"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="w-full md:w-1/2 bg-slate-100 relative group overflow-hidden">
              <img src={selectedStamp.image} className="w-full h-full object-contain md:object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <i className="fas fa-search-plus text-white text-4xl"></i>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-16 overflow-y-auto no-scrollbar flex flex-col">
              <div className="mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">ID: {selectedStamp.id}</span>
                  <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedStamp.album}</span>
                  {selectedStamp.catalogId && (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-200">
                      <i className="fas fa-book-bookmark mr-1"></i> {selectedStamp.catalogId}
                    </span>
                  )}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">{selectedStamp.name}</h2>
                <p className="text-xl font-bold text-slate-400">{selectedStamp.origin}, {selectedStamp.year}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem]">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Marktwert Schätzung</p>
                  <p className="text-3xl font-black text-emerald-900">{selectedStamp.expertValuation || selectedStamp.estimatedValue}</p>
                  {selectedStamp.priceSource && <p className="text-[9px] text-emerald-600 mt-2 truncate">via {selectedStamp.priceSource}</p>}
                </div>
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Zustand</p>
                  <p className="text-lg font-black text-slate-800">{selectedStamp.condition}</p>
                </div>
              </div>

              <div className="space-y-10">
                <section>
                  <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-2">Philatelistische Analyse</h5>
                  <p className="text-slate-600 leading-relaxed font-medium mb-6 text-sm md:text-base">
                    {selectedStamp.description}
                  </p>
                  {selectedStamp.historicalContext && (
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <i className="fas fa-landmark"></i> Historischer Kontext
                      </p>
                      <p className="text-xs text-indigo-900 leading-relaxed font-medium">{selectedStamp.historicalContext}</p>
                    </div>
                  )}
                </section>

                <section>
                   <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-2">Globale Datenbank-Referenzen</h5>
                   {selectedStamp.webRefs && selectedStamp.webRefs.length > 0 ? (
                     <div className="space-y-3">
                       {selectedStamp.webRefs.map((ref, idx) => (
                         <a 
                          key={idx} 
                          href={ref.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all group"
                         >
                           <span className="text-[10px] font-bold text-slate-600 truncate mr-4 group-hover:text-indigo-600">{ref.title}</span>
                           <i className="fas fa-external-link-alt text-[10px] text-slate-300 group-hover:text-indigo-600"></i>
                         </a>
                       ))}
                     </div>
                   ) : (
                     <p className="text-[10px] text-slate-400 italic">Keine direkten Web-Referenzen archiviert.</p>
                   )}
                </section>
              </div>

              <div className="mt-auto pt-12 flex flex-wrap gap-4">
                <button 
                  onClick={() => handleExpertRequest(selectedStamp)}
                  disabled={selectedStamp.expertStatus !== 'none'}
                  className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center gap-3"
                >
                  <i className="fas fa-gavel"></i> Experten-Zertifikat anfordern
                </button>
                <button 
                  onClick={() => {
                    onDelete(selectedStamp.id);
                    setSelectedStamp(null);
                  }}
                  className="bg-white border border-red-100 text-red-500 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                >
                  Aus Archiv löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StampCollection;
