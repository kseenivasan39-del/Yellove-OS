import React, { useRef, useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';

const CaptainAI = ({ chatLog, onAsk, onAction, isThinking }) => {

    const endRef = useRef(null);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }, [chatLog, isThinking]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        const sanitizedData = DOMPurify.sanitize(inputValue.trim());
        if (sanitizedData) {
            onAsk(sanitizedData);
            setInputValue('');
        }
    }, [inputValue, onAsk]);

    return (
        <section className="flex flex-col h-full bg-black/40 rounded-xl overflow-hidden border border-white/5" aria-label="Captain mode AI Chat">
            <header className="bg-gray-950 p-4 border-b border-white/5 flex items-center justify-between stadium-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-csk-gold flex items-center justify-center shadow-[0_0_15px_rgba(249,205,5,0.4)]">
                        <i className="fas fa-crown text-black text-xl" aria-hidden="true"></i>
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest scoreboard-font">Captain AI</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Strategic Uplink Active</span>
                        </div>
                    </div>
                </div>
                <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest scoreboard-font">
                    MATRIX: V2.1
                </div>
            </header>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar turf-pattern" aria-live="polite">
                {chatLog.map((msg, i) => (
                    <div key={i} className={`flex max-w-[90%] animate-slide-up ${msg.sender === 'user' ? 'ml-auto justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="hidden sm:block w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center mr-2 mt-1 border border-white/5"><i className="fas fa-robot text-csk-gold text-[10px] opacity-70" aria-hidden="true"></i></div>}
                        <div className={`p-4 text-sm shadow-xl relative overflow-hidden ${msg.sender === 'ai' ? 'bg-gray-900/90 text-gray-200 rounded-2xl rounded-tl-none border border-white/10' : 'bg-csk-gold text-black font-black rounded-2xl rounded-tr-none border border-yellow-400'}`}>
                            {msg.sender === 'ai' && <div className="absolute top-0 left-0 w-1 h-full bg-csk-gold"></div>}
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex max-w-[88%] animate-pulse">
                         <div className="p-4 text-[11px] bg-indigo-950/20 text-indigo-200 rounded-2xl border border-indigo-500/20 italic font-bold tracking-wide">
                             <i className="fas fa-sync animate-spin mr-2"></i> Capturing stadium telemetry...
                         </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <nav className="p-3 bg-[#0a0f1e]/80 border-t border-white/5 grid grid-cols-2 gap-2 relative z-10" aria-label="Quick Tactical Actions">
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAction("food")} 
                  aria-label="Find fastest food route" 
                  className="flex items-center justify-center gap-2 bg-gray-900/60 hover:bg-gray-800 disabled:opacity-50 text-[10px] font-black text-white py-3 rounded-xl border border-white/5 transition-all active:scale-[0.98] scoreboard-font uppercase tracking-widest"
                >
                    <i className="fas fa-pizza-slice text-orange-400" aria-hidden="true"></i> Find Food
                </button>
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAction("entry")} 
                  aria-label="Find clearest entry gate" 
                  className="flex items-center justify-center gap-2 bg-gray-900/60 hover:bg-gray-800 disabled:opacity-50 text-[10px] font-black text-white py-3 rounded-xl border border-white/5 transition-all active:scale-[0.98] scoreboard-font uppercase tracking-widest"
                >
                    <i className="fas fa-sign-in-alt text-emerald-400" aria-hidden="true"></i> Clear Entry
                </button>
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAction("emergency")} 
                  aria-label="Find nearest emergency exit"
                  className="flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-950/50 disabled:opacity-50 text-[10px] font-black text-red-200 py-3 rounded-xl border border-red-500/20 transition-all active:scale-[0.98] scoreboard-font uppercase tracking-widest"
                >
                    <i className="fas fa-fire-extinguisher text-red-500" aria-hidden="true"></i> Emergency Exit
                </button>
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAction("transport")} 
                  aria-label="Find return transport options"
                  className="flex items-center justify-center gap-2 bg-indigo-950/40 hover:bg-indigo-950/60 disabled:opacity-50 text-[10px] font-black text-indigo-200 py-3 rounded-xl border border-indigo-500/20 transition-all active:scale-[0.98] scoreboard-font uppercase tracking-widest"
                >
                    <i className="fas fa-subway text-indigo-400" aria-hidden="true"></i> Return Home
                </button>
            </nav>


            <div className="bg-gray-950/90 border-t border-white/5 relative z-10 stadium-border px-4 pt-2">
                <div className="text-[9px] font-black text-csk-gold uppercase tracking-[0.2em] opacity-40 select-none mb-1">
                    Smart guidance to avoid crowded areas
                </div>
                <form onSubmit={handleSubmit} className="flex gap-3 pb-4">
                    <label htmlFor="ai-chat-input" className="sr-only">Ask Captain for routing or queues</label>
                    <input 
                        id="ai-chat-input"
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isThinking}
                        placeholder="Ask Captain for routing or queues..." 
                        className="flex-1 bg-black/40 border border-white/5 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder:text-gray-600 font-bold uppercase tracking-widest disabled:opacity-50 scoreboard-font"
                    />
                    <button 
                        type="submit" 
                        aria-label="Send message to Captain AI"
                        disabled={isThinking || !inputValue.trim()}
                        className="bg-csk-gold hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-600 text-black px-5 rounded-xl font-black shadow-[0_5px_20px_rgba(249,205,5,0.3)] transition-all active:scale-95 flex items-center justify-center"
                    >
                        <i className="fas fa-paper-plane" aria-hidden="true"></i>
                    </button>
                </form>
            </div>
        </section>
    );
};

export default React.memo(CaptainAI);
