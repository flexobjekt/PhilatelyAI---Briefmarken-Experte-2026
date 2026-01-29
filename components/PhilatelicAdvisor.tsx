
import React, { useState, useRef, useEffect } from 'react';
import { Stamp, ChatMessage } from '../types';
import { createAdvisorChat } from '../services/geminiService';

interface PhilatelicAdvisorProps {
  collection: Stamp[];
  isOpen: boolean;
  onClose: () => void;
}

const PhilatelicAdvisor: React.FC<PhilatelicAdvisorProps> = ({ collection, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Willkommen im PhilatelyAI Advisory Center. Ich habe Ihr aktuelles Portfolio gesichtet. Wie kann ich Sie heute bei Ihrer philatelistischen Reise unterstützen?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSession) {
      setChatSession(createAdvisorChat(collection));
    }
  }, [isOpen, collection]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      if (!chatSession) {
        throw new Error("Chat session not initialized");
      }

      const result = await chatSession.sendMessage({ message: userMsg });
      const modelText = result.text || 'Entschuldigung, ich konnte keine Antwort generieren.';
      
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Ein technischer Fehler ist aufgetreten. Bitte prüfen Sie Ihre Verbindung.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:right-10 md:bottom-10 md:w-[450px] md:h-[700px] bg-white md:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] z-[600] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500 border border-slate-200">
      {/* Header */}
      <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-microchip"></i>
          </div>
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest">Philatelic Advisor</h3>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Enterprise Intelligence 2026</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-slate-50/50"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-5 rounded-[1.5rem] shadow-sm text-sm leading-relaxed font-medium ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] rounded-bl-none shadow-sm flex gap-2 items-center">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <input 
            type="text" 
            placeholder="Frage stellen..." 
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-700"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 transition-all active-scale"
          >
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </div>
        <p className="text-[8px] text-slate-400 text-center mt-4 font-black uppercase tracking-widest">Powered by Gemini 3 Flash Enterprise</p>
      </div>
    </div>
  );
};

export default PhilatelicAdvisor;
