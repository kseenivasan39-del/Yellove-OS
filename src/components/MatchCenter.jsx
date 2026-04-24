import React, { useState } from 'react';

/**
 * MatchCenter Component - Displays real-time match statistics and squad info.
 * Activates during "Match Mode" to provide tactical fan engagement.
 */
const MatchCenter = ({ matchMode }) => {
    const [activeSquad, setActiveSquad] = useState('CSK');

    if (!matchMode) return null;

    return (
        <div className="space-y-6 animate-fade-in mb-10">
            {/* Main Score Card Section */}
            <div className="glass-panel p-6 border-l-4 border-l-csk-gold relative overflow-hidden stadium-border turf-pattern">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <i className="fas fa-cricket-bat-ball text-9xl text-white rotate-12"></i>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    {/* Team MI */}
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 border-2 border-blue-500/30 flex items-center justify-center p-3 shadow-lg">
                             <div className="text-white font-black text-xl italic tracking-tighter">MI</div>
                        </div>
                        <div className="text-center md:text-left">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">Mumbai Indians</div>
                            <div className="text-4xl font-black text-white scoreboard-font tracking-tighter">181/7</div>
                            <div className="text-[11px] font-bold text-gray-500 mt-1">Overs: 20.0</div>
                        </div>
                    </div>

                    {/* Verses / Status */}
                    <div className="flex flex-col items-center py-2 px-6 bg-white/5 rounded-2xl border border-white/5">
                        <div className="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-full uppercase tracking-tighter mb-2 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                            In-Game Matrix
                        </div>
                        <div className="text-[13px] font-black text-csk-gold uppercase tracking-[0.2em] mb-1 italic">VS</div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
                            CSK needs 12 runs <br/> from 10 balls
                        </div>
                    </div>

                    {/* Team CSK */}
                    <div className="flex items-center gap-5 flex-row-reverse md:flex-row">
                        <div className="text-center md:text-right">
                            <div className="text-[10px] font-black text-csk-gold uppercase tracking-widest mb-1 opacity-80">Chennai Super Kings</div>
                            <div className="text-4xl font-black text-white scoreboard-font tracking-tighter flex items-center md:justify-end gap-2">
                                170/3
                            </div>
                            <div className="text-[11px] font-bold text-gray-400 mt-1">Overs: 18.2</div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-csk-gold border-2 border-yellow-400/50 flex items-center justify-center p-3 shadow-lg shadow-yellow-600/20">
                             <div className="text-black font-black text-xl italic tracking-tighter">CSK</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Win Probability & Figures Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Win Probability Matrix */}
                    <div className="glass-panel p-5 stadium-border relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
                            <i className="fas fa-chart-line text-2xl"></i>
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-black mb-5 scoreboard-font">Tactical Win Probability</div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-black text-csk-gold uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-csk-gold"></span> CSK
                                </span>
                                <span className="text-xl font-black text-white scoreboard-font">82%</span>
                            </div>
                            <div className="relative w-full h-3 bg-gray-900 rounded-full overflow-hidden flex border border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-yellow-600 to-csk-gold shadow-[0_0_15px_rgba(249,205,5,0.4)] transition-all duration-1000 ease-out" 
                                    style={{width: '82%'}}
                                >
                                    <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                </div>
                                <div 
                                    className="h-full bg-indigo-600" 
                                    style={{width: '18%'}}
                                ></div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">+4% Last Over Momentum</span>
                                <span className="text-[11px] font-black text-indigo-400 uppercase">MI: 18%</span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Figures */}
                    <div className="glass-panel p-5 stadium-border relative">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-black mb-5 scoreboard-font">Real-Time Figures</div>
                        
                        <div className="space-y-6">
                            {/* Batting Figure */}
                            <div className="group cursor-default">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <i className="fas fa-baseball-bat-ball text-csk-gold opacity-60"></i> Batting Matrix
                                    </div>
                                    <div className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black">HIGH PACE</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="p-3 bg-gray-900/40 rounded-xl border border-white/5 group-hover:border-csk-gold/30 transition-colors">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-sm font-black text-white">Shivam Dube</div>
                                                <div className="text-[10px] text-gray-500 font-bold mt-0.5">Left Hand Batsman</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-white scoreboard-font">52<span className="text-csk-gold">*</span> <span className="text-[13px] text-gray-500 font-medium ml-1">(28)</span></div>
                                                <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">SR: 185.71</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-900/20 rounded-xl border border-white/5 opacity-70">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[13px] font-black text-white/80">Sanju Samson</div>
                                                <div className="text-[9px] text-gray-600 font-bold mt-0.5 uppercase">Keeper / Anchor</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black text-white/80 scoreboard-font">42 <span className="text-[11px] text-gray-600 font-medium ml-1">(24)</span></div>
                                                <div className="text-[8px] text-gray-500 font-black uppercase tracking-widest">SR: 175.00</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bowling Figure */}
                            <div className="group cursor-default">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <i className="fas fa-basketball text-indigo-400 opacity-60"></i> Bowling Matrix
                                    </div>
                                    <div className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-black">PRECISION</div>
                                </div>
                                <div className="p-3 bg-gray-900/40 rounded-xl border border-white/5 group-hover:border-indigo-400/30 transition-colors">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-sm font-black text-white">Jasprit Bumrah</div>
                                            <div className="text-[10px] text-gray-500 font-bold mt-0.5">Right Arm Fast</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white scoreboard-font">1/24 <span className="text-[13px] text-gray-500 font-medium ml-1">(3.2)</span></div>
                                            <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest">ECON: 7.20</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Squad Deployment (Playing 11 + Impact) */}
                <div className="lg:col-span-2 glass-panel p-6 stadium-border flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-csk-gold/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 relative z-10">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] scoreboard-font">Squad Deployment</h3>
                            <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">Active Matrix Roster - Match Day 32</p>
                        </div>
                        <div className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-white/5 shadow-inner">
                            <button 
                                onClick={() => setActiveSquad('CSK')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSquad === 'CSK' ? 'bg-csk-gold text-black shadow-lg shadow-yellow-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                CSK
                            </button>
                            <button 
                                onClick={() => setActiveSquad('MI')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSquad === 'MI' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                MI
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 relative z-10">
                        {(activeSquad === 'CSK' ? [
                            {n: "Ruturaj Gaikwad", role: "Captain", s: "B"},
                            {n: "Sanju Samson", role: "Keeper/Aggressor", s: "B"},
                            {n: "Dewald Brevis", role: "Power Hitter", s: "B"},
                            {n: "Shivam Dube", role: "Finisher", s: "A"},
                            {n: "Sarfaraz Khan", role: "Innovation", s: "B"},
                            {n: "Jamie Overton", role: "Pace All-rounder", s: "A"},
                            {n: "MS Dhoni", role: "Legend/Finish", s: "B"},
                            {n: "Noor Ahmad", role: "Mystery Spin", s: "O"},
                            {n: "Khaleel Ahmed", role: "Left Arm Speed", s: "O"},
                            {n: "Rahul Chahar", role: "Leggie Core", s: "O"},
                            {n: "Spencer Johnson", role: "Express Pace", s: "O"}
                        ] : [
                            {n: "Quinton de Kock", role: "Keeper/Opener", s: "B"},
                            {n: "Rohit Sharma", role: "The Hitman", s: "B"},
                            {n: "Suryakumar Yadav", role: "360 Matrix", s: "B"},
                            {n: "Tilak Varma", role: "Catalyst", s: "B"},
                            {n: "Hardik Pandya", role: "Captain/All", s: "A"},
                            {n: "Will Jacks", role: "Power Surge", s: "A"},
                            {n: "Shardul Thakur", role: "Palak (MI)", s: "A"},
                            {n: "Deepak Chahar", role: "Swing (MI)", s: "O"},
                            {n: "Jasprit Bumrah", role: "The Boom", s: "O"},
                            {n: "Trent Boult", role: "Lightning", s: "O"},
                            {n: "Mayank Markande", role: "Spin Core", s: "O"}
                        ]).map((p, i) => (
                            <div key={i} className={`group p-3 bg-gray-950/60 border border-white/5 rounded-2xl hover:bg-gray-900/80 transition-all cursor-default flex items-center gap-3 ${activeSquad === 'CSK' ? 'hover:border-csk-gold/30' : 'hover:border-blue-500/30'}`}>
                                <div className={`w-8 h-8 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center text-[11px] font-black group-hover:scale-110 transition-transform scoreboard-font ${activeSquad === 'CSK' ? 'text-csk-gold' : 'text-blue-400'}`}>
                                    {i+1}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-black text-white truncate leading-tight">{p.n}</div>
                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5 group-hover:text-gray-400 transition-colors">
                                        {p.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-1.5 h-4 rounded-full ${activeSquad === 'CSK' ? 'bg-indigo-500' : 'bg-blue-500'}`}></div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] scoreboard-font ${activeSquad === 'CSK' ? 'text-indigo-400' : 'text-blue-400'}`}>
                                Impact Tactical Subs
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {(activeSquad === 'CSK' ? [
                                {name: "Prashant Veer", type: "All-Round Matrix"},
                                {name: "Mukesh Choudhary", type: "Swing Precision"},
                                {name: "Akeal Hosein", type: "Left Arm Control"},
                                {name: "Ayush Mhatre", type: "Batting Depth"}
                            ] : [
                                {name: "Naman Dhir", type: "Explosive Depth"},
                                {name: "Ryan Rickelton", type: "Keeper Backup"},
                                {name: "Mitchell Santner", type: "Spin Matrix"},
                                {name: "Raghu Sharma", type: "Friction Control"}
                            ]).map((p, i) => (
                                <div key={i} className={`flex flex-col p-3 rounded-xl transition-all min-w-[140px] border ${activeSquad === 'CSK' ? 'bg-indigo-950/10 border-indigo-500/20 hover:bg-indigo-950/20 text-indigo-300' : 'bg-blue-950/10 border-blue-500/20 hover:bg-blue-950/20 text-blue-300'}`}>
                                    <div className="text-[11px] font-black uppercase">{p.name}</div>
                                    <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60`}>{p.type}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchCenter;
