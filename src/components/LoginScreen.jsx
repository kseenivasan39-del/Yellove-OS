import React, { useState } from 'react';

const LoginScreen = ({ login, register }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        if (!isLogin && !name) {
           setError("Full Name is required.");
           return;
        }
        if (!email) {
           setError("Email is required.");
           return;
        }
        if (password.length < 6) {
           setError("Password must be at least 6 characters.");
           return;
        }
        setLoading(true);
        const result = isLogin ? await login(email, password) : await register(email, password, name);
        setLoading(false);
        if (!result.success && result.message) {
            setError(result.message);
        } else if (result.success && result.message) {
            setSuccess(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Stadium Atmospheric Lighting */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 floodlight origin-top-right rotate-12"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-csk-gold/5 floodlight origin-bottom-left -rotate-12"></div>
                <div className="scanline"></div>
            </div>

            <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 relative z-10">
                
                {/* Left Side: Strategic Briefing */}
                <div className="hidden lg:flex flex-col justify-center max-w-md animate-slide-up">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-0.5 bg-csk-gold shadow-[0_0_10px_rgba(249,205,5,0.5)]"></div>
                        <span className="text-csk-gold text-xs font-black uppercase tracking-[0.5em] scoreboard-font">Tactical Matrix</span>
                    </div>
                    <h2 className="text-6xl font-black text-white leading-[1] mb-8 tracking-tighter uppercase">
                        System dynamically adapts routes based on <span className="text-transparent bg-clip-text bg-gradient-to-r from-csk-gold to-yellow-500">crowd density</span> and transport efficiency.
                    </h2>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-white scoreboard-font">100%</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Uplink Stability</span>
                        </div>
                        <div className="w-[1px] h-10 bg-white/10"></div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-white scoreboard-font"> <i className="fas fa-bolt text-csk-gold"></i></span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Low Latency</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest scoreboard-font">Ref: CSK-MATRIX-7</div>
                    </div>
                </div>

                {/* Right Side: Login Card */}
                <div className="max-w-md w-full relative">
                    {/* Error Alerts */}
                    {(error || success) && (
                        <div className={`absolute -top-16 left-0 right-0 p-4 rounded-xl border animate-slide-up z-50 flex items-center gap-3 ${error ? 'bg-red-950/40 border-red-500 text-red-200' : 'bg-emerald-950/40 border-emerald-500 text-emerald-200'}`}>
                            <i className={`fas ${error ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">{error || success}</span>
                        </div>
                    )}

                    <div className="glass-panel p-10 rounded-3xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative group stadium-border turf-pattern">
                        <div className="text-center mb-12">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-csk-gold to-yellow-600 flex items-center justify-center shadow-[0_15px_40px_rgba(249,205,5,0.3)] border border-yellow-300/30 mx-auto mb-8 relative" aria-hidden="true">
                                <i className="fas fa-shield-halved text-black text-4xl"></i>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center">
                                    <i className="fas fa-lock text-csk-gold text-xs"></i>
                                </div>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">Yellove<span className="text-csk-gold">OS</span></h1>
                            <p className="text-gray-500 text-[10px] mt-3 font-black tracking-[0.3em] uppercase opacity-70 scoreboard-font">Authentication Required</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div className="animate-slide-up">
                                    <label htmlFor="name" className="sr-only">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 text-center"><i className="fas fa-user text-sm"></i></div>
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            placeholder="OPERATOR NAME"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            aria-label="Full Name"
                                            className="w-full bg-black/40 border border-white/5 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-xl pl-12 pr-4 py-4 text-xs text-white outline-none transition-all placeholder:text-gray-600 font-black tracking-widest scoreboard-font"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="animate-slide-up" style={{animationDelay: '100ms'}}>
                                <label htmlFor="email" className="sr-only">Email</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 text-center"><i className="fas fa-id-card text-sm"></i></div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="OPERATOR ID / EMAIL"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        aria-label="Email address"
                                        className="w-full bg-black/40 border border-white/5 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-xl pl-12 pr-4 py-4 text-xs text-white outline-none transition-all placeholder:text-gray-600 font-black tracking-widest scoreboard-font"
                                    />
                                </div>
                            </div>
                            <div className="animate-slide-up" style={{animationDelay: '200ms'}}>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 text-center"><i className="fas fa-key text-sm"></i></div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        placeholder="SECURE PASSCODE"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        aria-label="Password"
                                        className="w-full bg-black/40 border border-white/5 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-xl pl-12 pr-4 py-4 text-xs text-white outline-none transition-all placeholder:text-gray-600 font-black tracking-widest scoreboard-font"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                aria-label={isLogin ? "Secure Login" : "Create Account"}
                                className="w-full bg-csk-gold hover:bg-yellow-500 text-black px-4 py-5 rounded-xl font-black shadow-[0_15px_40px_rgba(249,205,5,0.3)] transition-all active:scale-95 flex justify-center items-center gap-4 mt-6 disabled:opacity-70 text-sm uppercase tracking-[0.2em] scoreboard-font"
                            >
                                {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={isLogin ? "fas fa-plug-circle-check" : "fas fa-user-plus"}></i>}
                                {loading ? 'SYNCING...' : (isLogin ? 'Establish Link' : 'Register Operator')}
                            </button>
                            
                            <button 
                                type="button" 
                                aria-label={isLogin ? "Switch to register" : "Switch to login"}
                                onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
                                className="w-full mt-6 text-[10px] text-gray-500 hover:text-csk-gold font-black transition-colors uppercase tracking-[0.3em] scoreboard-font"
                            >
                                {isLogin ? "[ New? Request Access ]" : "[ Have ID? Resume Link ]"}
                            </button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/5 opacity-40 flex flex-col items-center gap-2 pointer-events-none select-none">
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                                {["Maps API", "Places API", "Geocoding API", "Firebase"].map(api => (
                                    <span key={api} className="text-[8px] font-black text-gray-400 border border-white/10 px-2 py-0.5 rounded uppercase">{api}</span>
                                ))}
                            </div>
                            <div className="mt-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                Yellove-OS Deployment Suite
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(LoginScreen);
