
import React, { useState } from 'react';
import { Stamp } from '../types';

interface ExpertAppraisalProps {
  collection: Stamp[];
  onUpdate: (stamp: Stamp) => void;
}

const ExpertAppraisal: React.FC<ExpertAppraisalProps> = ({ collection, onUpdate }) => {
  const pendingStamps = collection.filter(s => s.expertStatus === 'pending');
  const appraisedStamps = collection.filter(s => s.expertStatus === 'appraised');
  const [activeTab, setActiveTab] = useState<'info' | 'requests'>('info');
  
  // Modal State
  const [appraisingStamp, setAppraisingStamp] = useState<Stamp | null>(null);
  const [valuationInput, setValuationInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const handleAppraisalSubmit = () => {
    if (appraisingStamp) {
      const updated: Stamp = {
        ...appraisingStamp,
        expertStatus: 'appraised',
        expertValuation: valuationInput || appraisingStamp.estimatedValue,
        expertNote: noteInput || "Bestätigtes Original nach fachmännischer Begutachtung."
      };
      onUpdate(updated);
      closeModal();
    }
  };

  const closeModal = () => {
    setAppraisingStamp(null);
    setValuationInput('');
    setNoteInput('');
  };

  const rejectRequest = (stamp: Stamp) => {
    if (window.confirm(`Möchten Sie die Anfrage für "${stamp.name}" wirklich ablehnen?`)) {
      onUpdate({ ...stamp, expertStatus: 'none' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-1 rounded-xl flex gap-1 w-fit border border-slate-200 shadow-sm">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'info' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Info
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'requests' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Anfragen ({pendingStamps.length + appraisedStamps.length})
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-lg">
            <h3 className="text-2xl font-black mb-4">Experten-Netzwerk</h3>
            <p className="text-slate-300 mb-6 leading-relaxed text-sm">
              Lassen Sie hochwertige Stücke von unabhängigen Philatelisten prüfen. Unser Netzwerk umfasst Spezialisten für alle Sammelgebiete.
            </p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-emerald-400"></i>
                <span>Echtheitsprüfung</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-emerald-400"></i>
                <span>Wert-Bestätigung</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-emerald-400"></i>
                <span>Verkaufs-Vermittlung</span>
              </li>
            </ul>
            <div className="p-4 bg-white/10 rounded-xl border border-white/5">
              <p className="text-xs text-slate-300">Wählen Sie eine Marke im Archiv und klicken Sie auf 'Experten-Anfrage'.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-certificate"></i>
                 </div>
                 <h4 className="font-bold text-slate-900">Zertifikate</h4>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Erhalten Sie digitale Zertifikate für geprüfte Marken, die direkt mit dem physischen Objekt verknüpft sind.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-gavel"></i>
                 </div>
                 <h4 className="font-bold text-slate-900">Auktionen</h4>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Direkte Weiterleitung validierter Exponate an internationale Auktionshäuser.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingStamps.length === 0 && appraisedStamps.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl text-center border border-slate-200">
               <p className="text-slate-400 font-bold">Keine laufenden Anfragen.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingStamps.map(stamp => (
                <div key={stamp.id} className="bg-white p-6 rounded-2xl border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img src={stamp.image} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                    <div>
                      <h4 className="font-bold text-slate-900">{stamp.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">In Prüfung</span>
                        <span className="text-xs text-slate-400">{new Date(stamp.dateAdded).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setAppraisingStamp(stamp);
                        setValuationInput(stamp.estimatedValue);
                      }}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
                    >
                      Begutachten
                    </button>
                    <button 
                      onClick={() => rejectRequest(stamp)}
                      className="bg-white border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              ))}
              {appraisedStamps.map(stamp => (
                <div key={stamp.id} className="bg-white p-6 rounded-2xl border border-emerald-100">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative">
                      <img src={stamp.image} className="w-24 h-24 rounded-lg object-cover bg-slate-100" />
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                        <i className="fas fa-check text-[10px]"></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{stamp.name}</h4>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Verifiziert</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Wert</p>
                          <p className="text-xl font-black text-emerald-700">{stamp.expertValuation}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                        "{stamp.expertNote}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appraisal Entry Modal */}
      {appraisingStamp && (
        <div className="fixed inset-0 bg-slate-900/80 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Begutachtung abschließen</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Experten-Wert (€)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-500"
                  value={valuationInput.replace('€', '').trim()}
                  onChange={(e) => setValuationInput(`€${e.target.value}`)}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Notizen</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-indigo-500 resize-none"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleAppraisalSubmit}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700"
                >
                  Bestätigen
                </button>
                <button 
                  onClick={closeModal}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertAppraisal;
