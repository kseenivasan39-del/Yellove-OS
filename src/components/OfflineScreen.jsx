import React, { useEffect, useState } from 'react';

const OfflineScreen = () => {
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = () => {
        setIsRetrying(true);
        setTimeout(() => {
            if (navigator.onLine) {
                window.location.reload();
            } else {
                setRetryCount(prev => prev + 1);
                setIsRetrying(false);
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#05080f] flex flex-col items-center justify-center p-6 text-center">
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 filter blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/20 filter blur-[100px] animate-pulse"></div>
                <div className="scanline"></div>
            </div>

            <div className="relative z-10 max-w-md w-full glass-panel p-8 rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.15)] flex flex-col items-center">
                
                <div className="w-24 h-24 mb-6 rounded-full bg-red-950/50 border-2 border-red-500/50 flex items-center justify-center relative overflow-hidden">
                    <i className="fas fa-satellite-dish text-4xl text-red-500 z-10 animate-pulse"></i>
                    <div className="absolute inset-0 bg-red-500/20 animate-ping"></div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <h1 className="text-xs font-black text-red-400 uppercase tracking-[0.4em] scoreboard-font">
                        Telemetry Uplink Lost
                    </h1>
                </div>

                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">
                    Connection Offline
                </h2>

                <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8">
                    Yellove OS requires an active matrix connection to provide real-time stadium telemetry, crowd densities, and navigation. Please check your data connection.
                </p>

                {retryCount > 0 && (
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-4">
                        Attempt {retryCount} failed. Signal still dead.
                    </div>
                )}

                <button 
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all bg-csk-gold text-black hover:bg-yellow-500 hover:shadow-[0_0_20px_rgba(249,205,5,0.4)] active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 scoreboard-font"
                >
                    {isRetrying ? (
                        <><i className="fas fa-sync animate-spin"></i> Initializing Handshake...</>
                    ) : (
                        <><i className="fas fa-rotate-right"></i> Re-establish Uplink</>
                    )}
                </button>
            </div>
            
            <div className="absolute bottom-6 text-[9px] font-black tracking-[0.2em] text-gray-600 uppercase text-center scoreboard-font">
                Engineered for Chennai Super Kings<br/>
                <span className="text-red-500/50 mt-1 block">SYSTEM HALTED</span>
            </div>
        </div>
    );
};

export default OfflineScreen;
