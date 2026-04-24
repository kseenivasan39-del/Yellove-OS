import React from 'react';

const QueueCard = ({ item }) => (
    <div className="flex justify-between items-center bg-gray-900/60 hover:bg-gray-800 transition-all p-4 rounded-xl border border-white/5 active:scale-[0.98] group turf-pattern relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${item.type === 'food' ? 'bg-orange-950/40 text-orange-400' : 'bg-cyan-950/40 text-cyan-400'}`}>
                <i className={`fas ${item.type === 'food' ? 'fa-hamburger' : 'fa-restroom'} text-lg`} aria-hidden="true"></i>
            </div>
            <div>
                <div className="text-[13px] font-black text-white group-hover:text-csk-gold transition-colors">{item.name}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] scoreboard-font">{item.loc}</div>
            </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black scoreboard-font border ${item.wait < 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : item.wait < 10 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:animate-pulse'}`}>
            <i className="far fa-clock" aria-hidden="true"></i> <span aria-label={`${item.wait} minutes wait`}>{item.wait}m</span>
        </div>
    </div>
);

export default React.memo(QueueCard);
