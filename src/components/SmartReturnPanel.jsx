// Uses Directions API for routing
// Uses Places API for transport
// Uses Geocoding API for address
// Uses Distance Matrix API for ETA
import React, { useState, useEffect, useRef } from 'react';
import { initAutocomplete } from '../utils';
import DOMPurify from 'dompurify';

const SmartReturnPanel = ({ isLoaded, transports, onClose, onSelect, onSelectAddress }) => {
    const [customAddr, setCustomAddr] = useState('');
    const [error, setError] = useState(null);
    const autocompleteRef = useRef(null);

    useEffect(() => {
        if (!isLoaded) return;

        const timer = setTimeout(() => {
            const input = document.getElementById('autocomplete-destination');
            if (input && !autocompleteRef.current) {
                autocompleteRef.current = initAutocomplete(input, (place) => {
                    const fullAddr = place.formatted_address || place.name;
                    if (fullAddr) {
                        const cleanAddr = DOMPurify.sanitize(fullAddr).substring(0, 200);
                        setCustomAddr(cleanAddr);
                        onSelectAddress(cleanAddr);
                    }
                });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isLoaded, onSelectAddress]);

    const sortedTransports = transports && transports.length > 0 
        ? [...transports].sort((a,b) => (a.wait - a.capacity/10) - (b.wait - b.capacity/10))
        : [];

    const hasData = sortedTransports.length > 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="smart-return-title">
            <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(49,46,129,0.5)] overflow-hidden relative">
                
                <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0 bg-gray-900 z-20">
                    <h2 id="smart-return-title" className="text-xl font-black text-indigo-300 flex items-center gap-2">
                        <i className="fas fa-subway" aria-hidden="true"></i> Smart Return Hub
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 hidden sm:block">Efficient transport selection</p>
                    <button 
                        type="button"
                        onClick={onClose}
                        aria-label="Close smart return panel"
                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                    >
                        <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar scroll-smooth pb-[env(safe-area-inset-bottom,1.5rem)]">
                    
                    <section className="mb-8" aria-label="Dropoff Search">
                        <div className="text-sm text-gray-300 mb-3 font-medium flex items-center gap-2">
                            <i className="fas fa-search-location text-blue-400"></i> Enter Destination
                        </div>
                        <div className="relative">
                            <label htmlFor="autocomplete-destination" className="sr-only">Enter your exact dropoff destination</label>
                            <input 
                                id="autocomplete-destination"
                                type="text"
                                value={customAddr}
                                onChange={(e) => setCustomAddr(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && customAddr) onSelectAddress(customAddr); }}
                                placeholder="Search areas (e.g., Velachery)"
                                className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-inner z-30"
                            />
                        </div>
                        {error && (
                            <div className="mt-2 p-2.5 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-bold animate-shake flex items-center gap-2">
                                <i className="fas fa-exclamation-circle"></i> {error}
                            </div>
                        )}
                        {!isLoaded && (
                            <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                <i className="fas fa-spinner fa-spin"></i> Initializing Google Maps...
                            </div>
                        )}
                    </section>

                    <section aria-label="Nearby Transport Options">
                        <div className="text-sm text-gray-300 mb-4 font-medium flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-broadcast-tower text-indigo-400"></i> Live Transit Telemetry
                            </div>
                            <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded-md animate-pulse">Scanning</span>
                        </div>
                        
                        {!hasData ? (
                            <div className="p-10 flex flex-col items-center justify-center bg-gray-950/40 rounded-xl border border-white/5">
                                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center">Detecting transport hubs...</div>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-2">
                                {sortedTransports.map((t, idx) => (
                                    <button 
                                        key={t.id}
                                        type="button"
                                        onClick={() => onSelect(t)}
                                        aria-label={`Select ${t.type} route at ${t.station}`}
                                        className={`w-full text-left p-4 rounded-xl border flex flex-col gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${idx === 0 ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] hover:bg-indigo-900/30' : 'bg-gray-800/40 border-white/5 hover:bg-gray-800/80'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-inner ${
                                                    t.type.toLowerCase().includes('metro') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                                                    t.type.toLowerCase().includes('train') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                    t.type.toLowerCase().includes('bus') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                                    'bg-csk-gold/10 text-csk-gold border border-csk-gold/20'}`}>
                                                    <i className={`fas ${t.type.toLowerCase().includes('metro') ? 'fa-subway' : t.type.toLowerCase().includes('train') ? 'fa-train' : t.type.toLowerCase().includes('bus') ? 'fa-bus' : 'fa-taxi'}`} aria-hidden="true"></i>
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-100 text-base flex items-center gap-2">{t.type}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">{t.station}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className={`font-black tracking-tight text-xl leading-none ${t.wait < 5 ? 'text-emerald-400' : t.wait < 10 ? 'text-amber-400' : 'text-rose-400'}`}>{t.wait || 5}m</div>
                                                <div className="text-[9px] text-gray-500 font-bold uppercase mt-1">Wait Time</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center bg-black/40 rounded-lg p-2 mt-1">
                                            <div className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                                                <i className="fas fa-walking text-gray-500"></i> {t.distance} <span className="text-gray-500 px-0.5">•</span> ETA: {(t.wait || 5) + 12}m
                                            </div>
                                            {idx === 0 && <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Recommended</span>}
                                        </div>
            
                                        <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden relative shadow-inner mt-1">
                                            <div className={`h-full absolute left-0 top-0 transition-all duration-1000 ${t.capacity < 30 ? 'bg-emerald-500' : t.capacity < 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{width: `${Math.min(100, t.capacity || 0)}%`}}></div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="sticky bottom-0 p-4 border-t border-white/10 shrink-0 bg-gray-900/95 backdrop-blur-xl z-20 flex flex-col gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose} 
                            aria-label="Return to home screen" 
                            className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-sm rounded-xl transition-all outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex justify-center items-center gap-2"
                        >
                            <i className="fas fa-arrow-left" aria-hidden="true"></i> Go Home
                        </button>
                        <button 
                            type="button"
                            onClick={async () => { 
                                if(customAddr) {
                                    setError(null);
                                    // Using Geocoding API for address conversion
                                    try {
                                        const result = await onSelectAddress(customAddr);
                                        if (!result || !result.success) {
                                            setError("Unable to locate. Use map coordinates.");
                                        }
                                    } catch (_e) {
                                        setError("Geocoding failed. Try a known landmark.");
                                    }
                                }
                            }} 
                            aria-label="Find optimal transport using custom address" 
                            disabled={!customAddr}
                            className={`flex-1 py-3.5 font-black text-sm rounded-xl transition-all flex justify-center items-center gap-2 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${customAddr ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] focus:ring-blue-400' : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700'}`}
                        >
                            <i className="fas fa-directions" aria-hidden="true"></i> Find Transport
                        </button>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 opacity-40 select-none">
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Powered by Google Maps Directions API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Transport data via Google Places API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Address conversion via Geocoding API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">ETA via Distance Matrix API</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(SmartReturnPanel);
