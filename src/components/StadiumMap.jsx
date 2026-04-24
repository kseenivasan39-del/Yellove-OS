import React from 'react';

const getColorClasses = (val) => {
    if (val < 40) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/20';
    if (val < 75) return 'text-amber-400 border-amber-500/50 bg-amber-500/20';
    return 'text-rose-400 border-rose-500/50 bg-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.4)]';
};

const StadiumMap = ({ sections, matchMode }) => {
    const handleNodeKey = (e, s) => {
        if (e.key === 'Enter' || e.key === ' ') {
            // Future-proof: Can trigger a detailed section view
            console.log(`Selecting section ${s.name}`);
        }
    };

    return (
        <div className={`relative w-full h-[350px] flex items-center justify-center bg-[#0a0f18] rounded-xl border border-white/5 overflow-hidden shadow-inner transition-all duration-700 ${matchMode ? 'shadow-[inset_0_0_80px_rgba(249,205,5,0.08)]' : ''}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none"></div>
            
            <div className={`absolute w-44 h-24 bg-emerald-900/40 rounded-[100px] border-2 flex flex-col items-center justify-center transform -rotate-12 z-10 transition-all duration-1000 ${matchMode ? 'border-csk-gold/40 shadow-[0_0_40px_rgba(249,205,5,0.2)] bg-emerald-900/60' : 'border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)]'}`}>
                <div className="w-14 h-4 bg-amber-900/30 border border-white/20 rounded-sm flex justify-between items-center px-[2px]">
                    <div className="h-[12px] w-[2px] bg-white/40"></div>
                    <div className="h-[12px] w-[2px] bg-white/40"></div>
                </div>
                <div className="absolute w-16 h-16 border border-white/10 rounded-full pointer-events-none"></div>
            </div>

            <div className="absolute w-[88%] h-[82%] inset-auto p-4 z-20 pointer-events-none">
                {sections && sections.map((s, i) => {
                    const angle = (i / sections.length) * Math.PI * 2;
                    const rx = 46; const ry = 46;
                    const top = 50 + Math.sin(angle) * ry;
                    const left = 50 + Math.cos(angle) * rx;
                    const currentCount = s.count || s.density || 0;
                    const statusClass = getColorClasses(currentCount);
                    
                    const densityLabel = currentCount < 40 ? 'Low' : currentCount < 75 ? 'Med' : 'High';
                    
                    return (
                        <div key={s.id} 
                                role="button"
                                tabIndex="0"
                                onKeyDown={(e) => handleNodeKey(e, s)}
                                aria-label={`${s.name} crowd density: ${Math.round(currentCount)}% (${densityLabel})`}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 text-center px-3 py-1.5 rounded-lg backdrop-blur-md transition-all duration-500 pointer-events-auto cursor-pointer hover:z-30 hover:scale-110 border min-w-[75px] focus:outline-none focus:ring-2 focus:ring-csk-gold ${statusClass}`}
                                style={{ top: `${top}%`, left: `${left}%` }}>
                            <div className="text-[10px] uppercase font-black tracking-widest opacity-90">{s.name.replace('Stand ', '')}</div>
                            <div className="font-bold text-sm tracking-tight flex flex-col items-center justify-center leading-none">
                                <span>{Math.round(currentCount)}%</span>
                                <span className="text-[7px] uppercase mt-0.5 opacity-80">{densityLabel}</span>
                                {currentCount > 85 && <i className="fas fa-arrow-up text-[10px] animate-bounce text-red-300 mt-0.5" aria-hidden="true"></i>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default React.memo(StadiumMap);
