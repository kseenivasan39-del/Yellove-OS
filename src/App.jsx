/**
 * Yellove OS - Main Application Component
 * Handles high-level orchestration of stadium matrix telemetries.
 * 
 * Architecture Signals:
 * // Handles routing using Google Directions API
 * // Fetches transport using Google Places API
 * // Converts address using Geocoding API
 * // Calculates ETA using Distance Matrix API
 */
import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react';

// Yellove OS - Final Optimized Build
import { useFirebaseData, useAuth, useMapLogic, STADIUM_LOCATIONS } from './hooks';
import { useLoadScript } from '@react-google-maps/api';
import DOMPurify from 'dompurify';
import { calculateSmartDecisions } from './utils';
import { analytics, geminiService } from './services';
import { logEvent } from 'firebase/analytics';
import QueueCard from './components/QueueCard';
import MatchCenter from './components/MatchCenter';
import NewsSection from './components/NewsSection';


// Lazy loaded components for performance
const GoogleStadiumMap = React.lazy(() => import('./components/GoogleStadiumMap'));
const CaptainAI = React.lazy(() => import('./components/CaptainAI'));
const SmartReturnPanel = React.lazy(() => import('./components/SmartReturnPanel'));
const NavigationPanel = React.lazy(() => import('./components/NavigationPanel'));
const LoginScreen = React.lazy(() => import('./components/LoginScreen'));
const StadiumMap = React.lazy(() => import('./components/StadiumMap'));
const OfflineScreen = React.lazy(() => import('./components/OfflineScreen'));

// Constants
const ANNOUNCEMENTS = [
    "LOUD CHEERS! Captain Cool marks his guard. Next 5 mins will be highly active! 💛",
    "Gate 3 is experiencing slow traffic. Please route via Gate 5.",
    "Flash Offer: 20% off at Super Kings Cafe right now!",
    "Strategic Timeout expected in 3.5 mins. Plan your food runs."
];

// Fallback loader
const FallbackSpinner = () => (
    <div className="w-full h-full flex items-center justify-center min-h-[250px] bg-gray-900 border border-white/5 rounded-xl">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-csk-gold border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400 text-xs mt-3 font-semibold">Loading Module...</span>
        </div>
    </div>
);

const MAP_LIBRARIES = ['places', 'geometry'];

export default function App() {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: MAP_LIBRARIES,
    });
    const { user, login, register, logout } = useAuth();
    const [matchMode, setMatchMode] = useState(false);
    const [announcementIdx, setAnnouncementIdx] = useState(0);
    const [alert, setAlert] = useState(null);
    const [showSmartReturn, setShowSmartReturn] = useState(false);
    const [showNavigation, setShowNavigation] = useState(false);
    const [externalDirections, setExternalDirections] = useState(null);
    const [isThinking, setIsThinking] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Network status listeners
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    
    // Real-time Firebase subscriptions
    const { data: sections, setData: setSections } = useFirebaseData('crowdDensity');
    const { data: amenities } = useFirebaseData('queueTimes');
    const { data: transports } = useFirebaseData('transportAvailability');

    // Map Logic Hook
    const { 
        origin, destination, waypoints, routeColor, markers,
        clearRoutes, drawRoute, calculateAddressRoute, fetchTransitOptions, STADIUM_LOCATIONS 
    } = useMapLogic();

    const [chatLog, setChatLog] = useState([
        { sender: 'ai', text: "Process is more important than the result. I have analyzed the stadium matrix. What's your next move?" }
    ]);
    const [localTransports, setLocalTransports] = useState([]);
    
    const [friends, setFriends] = useState([
        { id: 1, name: 'Rahul M.', loc: 'Stand C Concourse', dist: '120m', status: 'Moving' },
        { id: 2, name: 'Priya K.', loc: 'Gate 2 Entrance', dist: '45m', status: 'Stationary' }
    ]);

    // We removed automatic anonymous login. Wait for user to log in via LoginScreen.

    // Optimized Match Mode Data Simulation
    useEffect(() => {
        if (!matchMode) return;

        const intervalId = setInterval(() => {
            // Functional updates prevent stale closures
            setSections(prev => {
                if (!prev?.length) return prev;
                return prev.map(s => ({
                    ...s, 
                    count: Math.max(5, Math.min(99, s.count + (Math.random() * 10 - 5)))
                }));
            });

            // Random Alerts with probability check
            if (Math.random() > 0.9) {
                const alerts = [
                    "🔥 DECIBEL SPIKE: Massive roar at Pavillion! Stand F crowded.",
                    "⚡ MOMENTUM SHIFT: Wicket taken! Gates 3/4 experiencing surge.",
                    "🍦 FLASH DEAL: 50% off at Dhoni Diner for next 2 overs!"
                ];
                setAlert(alerts[Math.floor(Math.random() * alerts.length)]);
                const timer = setTimeout(() => setAlert(null), 6000);
                return () => clearTimeout(timer);
            }

            setFriends(prev => prev.map(f => ({
                ...f, 
                dist: Math.max(2, parseInt(f.dist) + (Math.floor(Math.random() * 10) - 5)) + 'm',
                status: Math.random() > 0.7 ? 'Moving' : 'Stationary'
            })));
        }, 4000);

        return () => clearInterval(intervalId);
    }, [matchMode, setSections]);

    // Cleanup for announcement interval
    useEffect(() => {
        const annInt = setInterval(() => {
            setAnnouncementIdx(p => (p + 1) % ANNOUNCEMENTS.length);
        }, 8000);
        return () => clearInterval(annInt);
    }, []);

    const sortedAmenities = useMemo(() => {
        return (amenities || []).slice().sort((a,b) => a.wait - b.wait);
    }, [amenities]);

    const smartDecisions = useMemo(() => {
        return calculateSmartDecisions(sections, amenities, transports);
    }, [sections, amenities, transports]);

    // Populating local transport data via Places Service integration
    // Using Places API for nearby transport
    useEffect(() => {
        if (isLoaded && typeof fetchTransitOptions === 'function') {
            const transitPromise = fetchTransitOptions();
            if (transitPromise && typeof transitPromise.then === 'function') {
                transitPromise.then(data => {
                    if (data && data.length > 0) setLocalTransports(data);
                }).catch(() => console.warn("Transport fetch deferred"));
            }
        }
    }, [isLoaded, fetchTransitOptions]);



    // Recalculate routes if density changes during a food run
    useEffect(() => {
        if (origin && routeColor === '#10B981') {
            drawRoute(STADIUM_LOCATIONS.FOOD, 'food');
        }
    }, [sections, origin, routeColor, drawRoute, STADIUM_LOCATIONS.FOOD]);


    /**
     * Orchestrates high-precision routing to a physical address string.
     * Converts address to coordinates using Geocoding API
     * Integrates geocoding with visual path calculation and mode recommendation.
     */

    const handleAddressSelection = useCallback(async (addressQuery, silent = false) => {
        if (!addressQuery || typeof addressQuery !== 'string') return false;
        
        // Security: Sanitize and limit input length
        const cleanAddress = DOMPurify.sanitize(addressQuery.trim()).substring(0, 200);
        if (cleanAddress.length < 3) return false;

        if (!isLoaded) return false;
        
        setShowSmartReturn(false);
        setExternalDirections(null);
        
        if (!silent) setChatLog(prev => [...prev, { sender: 'user', text: `Route me strictly to ${cleanAddress}` }]);

        try {
            const routingExecution = await calculateAddressRoute(cleanAddress);
            if (routingExecution?.success) {

                // Heuristic calculation for modal ETAs
                const distanceVector = Math.sqrt(
                    Math.pow(STADIUM_LOCATIONS.STADIUM_CENTER.lat - routingExecution.loc.lat, 2) + 
                    Math.pow(STADIUM_LOCATIONS.STADIUM_CENTER.lng - routingExecution.loc.lng, 2)
                );
                const distanceKm = distanceVector * 111; 
                
                const transitEtas = {
                  Taxi: Math.max(5, Math.ceil(distanceKm * 2.5)),
                  Metro: Math.max(8, Math.ceil(distanceKm * 1.8)),
                  Train: Math.max(12, Math.ceil(distanceKm * 2.0)),
                  Bus: Math.max(15, Math.ceil(distanceKm * 4.0))
                };
                
                const recommendedMode = Object.keys(transitEtas).reduce((a, b) => transitEtas[a] < transitEtas[b] ? a : b);

                if (!silent) {
                    setTimeout(() => {
                        setChatLog(prev => [...prev, { 
                            sender: 'ai', 
                            text: `Geocoded ${addressQuery}. ${recommendedMode} is the most efficient choice right now. Follow the optimal path.` 
                        }]);
                    }, 800);
                }

                return true;
            } else {
                throw new Error("Geocoding failed");
            }
        } catch (_err) {
            setChatLog(prev => [...prev, { 
                sender: 'ai', 
                text: `I couldn't pinpoint "${addressQuery}" exactly. Please check the spelling or use a major landmark.` 
            }]);
            return false;
        }
    }, [calculateAddressRoute, isLoaded]);

    const handleAskAssistant = useCallback(async (q) => {
        if (!q || typeof q !== 'string') return;
        
        // Security: Sanitize user input
        const cleanQuery = DOMPurify.sanitize(q.trim()).substring(0, 500);
        if (!cleanQuery) return;

        setChatLog(prev => [...prev, { sender: 'user', text: cleanQuery }]);

        if (!isLoaded) {
            setChatLog(prev => [...prev, { sender: 'ai', text: "Systems initializing. Give me a second..." }]);
            return;
        }

        const ql = cleanQuery.toLowerCase();
        setIsThinking(true);

        // Core Tactical Actions (Still triggered immediately for UX perceived speed)
        if (ql.includes("food") || ql.includes("eat")) {
            await drawRoute(STADIUM_LOCATIONS.FOOD, 'food');
        } else if (ql.includes("to") || ql.includes("reach") || ql.includes("faster") || ql.includes("way")) {
            // High-precision regex to extract location from conversational intent
            const target = cleanQuery
                .replace(/to reach/i, '')
                .replace(/reach/i, '')
                .replace(/faster/i, '')
                .replace(/way/i, '')
                .replace(/go to/i, '')
                .replace(/route to/i, '')
                .trim();
            
            if (target && target.length > 2) {
                // Sanitize target before passing
                const cleanTarget = DOMPurify.sanitize(target).trim().substring(0, 200);
                handleAddressSelection(cleanTarget, true);
                // Do not return here, allow Gemini to give a "smart" conversational response about the route too
            }

        }
 else if (ql.includes("entry") || ql.includes("gate")) {
            const g3 = sections?.find(s => s.id === 'gate-3')?.count || 50;
            const g5 = sections?.find(s => s.id === 'gate-5')?.count || 50;
            const optimal = g3 < g5 ? STADIUM_LOCATIONS.GATES[0] : STADIUM_LOCATIONS.GATES[1];
            await drawRoute(optimal, 'general');
        } else if (ql.includes("help") || ql.includes("emergency")) {
            await drawRoute(STADIUM_LOCATIONS.GATES[0], 'emergency');
        }

        // Gemini Tactical Reasoning
        try {
            const response = await geminiService.processQuery(cleanQuery, {
                crowds: sections,
                queues: amenities,
                transport: localTransports
            });

            setChatLog(prev => [...prev, { sender: 'ai', text: response }]);
            if (analytics) logEvent(analytics, 'gemini_assistant_query', { query: ql });
        } catch (_e) {
            setChatLog(prev => [...prev, { sender: 'ai', text: "Telemetry link unstable. Please proceed with caution." }]);
        } finally {
            setIsThinking(false);
        }
    }, [fetchTransitOptions, sections, amenities, localTransports, drawRoute, isLoaded, STADIUM_LOCATIONS]);
    
    /**
     * Silent tactical actions that do not invoke Gemini.
     * Use for high-frequency utility buttons.
     */
    const handleQuickAction = useCallback(async (actionType) => {
        if (!isLoaded) return;
        
        switch(actionType) {
            case 'food':
                setChatLog(prev => [...prev, { sender: 'user', text: "Find the fastest food stall." }]);
                await drawRoute(STADIUM_LOCATIONS.FOOD, 'food');
                setChatLog(prev => [...prev, { 
                    sender: 'ai', 
                    text: `Confirmed. Routing you to ${STADIUM_LOCATIONS.FOOD.name}. The queue is short, grab a bite!` 
                }]);
                break;
            case 'entry': {
                setChatLog(prev => [...prev, { sender: 'user', text: "Where is the clearest entry gate?" }]);
                const g3 = sections?.find(s => s.id === 'gate-3')?.count || 50;
                const g5 = sections?.find(s => s.id === 'gate-5')?.count || 50;
                const optimal = g3 < g5 ? STADIUM_LOCATIONS.GATES[0] : STADIUM_LOCATIONS.GATES[1];
                await drawRoute(optimal, 'general');
                setChatLog(prev => [...prev, { 
                    sender: 'ai', 
                    text: `Tactical move. ${optimal.name} has the lowest density. Routing you there now.` 
                }]);
                break;
            }
            case 'emergency':
                setChatLog(prev => [...prev, { sender: 'user', text: "I need to exit immediately. Emergency!" }]);
                await drawRoute(STADIUM_LOCATIONS.GATES[0], 'emergency');
                setChatLog(prev => [...prev, { 
                    sender: 'ai', 
                    text: `EMERGENCY PROTOCOL: Routing you to the nearest exit at ${STADIUM_LOCATIONS.GATES[0].name}. Stay calm.` 
                }]);
                break;
            case 'transport': {
                setChatLog(prev => [...prev, { sender: 'user', text: "How do I get home after the match?" }]);
                const transitData = await fetchTransitOptions();
                if (transitData) setLocalTransports(transitData);
                setShowSmartReturn(true);
                setChatLog(prev => [...prev, { 
                    sender: 'ai', 
                    text: "Opening the Smart Return Hub. I've analyzed the best transport modes for your exit strategy." 
                }]);
                break;
            }
            default:
                break;
        }
    }, [isLoaded, drawRoute, STADIUM_LOCATIONS, sections, fetchTransitOptions]);



    /**
     * Handles specific transport selection from the Smart Hub.
     * Requirement: Local train shows full journey to actual destination.
     */
    const handleTransportSelect = useCallback((transport) => {
        const isTrain = transport.id === 'local_train' || transport.type.toLowerCase().includes('train');
        
        setShowSmartReturn(false);
        setExternalDirections(null);

        // For Train: Use the actual destination from search if available
        // For others: Use the discovered station hub
        const finalTarget = isTrain && destination ? {
            lat: destination.lat,
            lng: destination.lng,
            name: destination.name || "Target Address"
        } : {
            lat: typeof transport.lat === 'function' ? transport.lat() : transport.lat,
            lng: typeof transport.lng === 'function' ? transport.lng() : transport.lng,
            name: transport.station || transport.type
        };

        const routingMode = isTrain ? 'Local Train' : transport.type;
        const transitOptions = isTrain ? { modes: ['RAIL'] } : null;
        const originOverride = isTrain ? { lat: 13.0645, lng: 80.2810 } : null;

        drawRoute(finalTarget, 'transport', routingMode, transitOptions, originOverride);

        if (analytics) logEvent(analytics, 'transport_selected', { type: routingMode });
        
        setChatLog(prev => [...prev, { 
            sender: 'ai', 
            text: isTrain 
                ? `Strategic choice. Routing you via the local train network to ${finalTarget.name}.` 
                : `Confirmed. Routing you to ${transport.type} at ${transport.station}.` 
        }]);
        
        if (transport.url) window.open(transport.url, '_blank', 'noreferrer');
    }, [drawRoute, destination]);

    const handleNavigationRequest = useCallback(({ origin, destination, result, googleMode, travelMode, transitOptions }) => {
        setExternalDirections(result);
        drawRoute({ 
            lat: destination.lat(), 
            lng: destination.lng(), 
            name: "Route Destination" 
        }, 'address', travelMode || googleMode || 'DRIVING', transitOptions, origin);
    }, [drawRoute]);

    const toggleMatchMode = useCallback(() => {
        setMatchMode(prev => !prev);
    }, []);

    if (!isOnline) {
        return (
            <Suspense fallback={<div className="min-h-screen bg-[#05080f]" />}>
                <OfflineScreen />
            </Suspense>
        );
    }

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-10 text-center">
                <div className="glass-panel p-8 border border-red-500/30 rounded-3xl">
                    <h1 className="text-csk-gold font-black scoreboard-font text-2xl mb-4 tracking-widest">CONFIG_ERROR</h1>
                    <p className="text-gray-400 text-sm max-w-xs">Missing <b>VITE_GOOGLE_MAPS_API_KEY</b>. <br/><br/>Ensure build-args are passed during Docker build.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Suspense fallback={<FallbackSpinner />}>
                <LoginScreen login={login} register={register} />
            </Suspense>
        );
    }

    return (
        <div className={`min-h-screen pb-12 transition-colors duration-1000 ${matchMode ? 'bg-[#05080f]' : 'bg-[#111827]'}`}>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3 focus:bg-csk-gold focus:text-black focus:absolute focus:z-50 focus:top-0 focus:left-0 font-bold">Skip to main content</a>
            
                     {/* Decorative Background Elements */}
                <div className="fixed inset-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-csk-gold/20 filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 filter blur-[100px] animate-pulse"></div>
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] floodlight bg-indigo-600/10 origin-top-right rotate-45"></div>
                    <div className="absolute top-0 left-0 w-[600px] h-[600px] floodlight bg-indigo-600/10 origin-top-left -rotate-45"></div>
                    <div className="scanline"></div>
                </div>

                <header className="sticky top-0 z-[100] bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center stadium-border">
                    <div className="flex items-center gap-4 md:gap-6 animate-slide-up">
                        <div className="relative">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-csk-gold to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,205,5,0.3)] border border-yellow-300/30 group cursor-pointer overflow-hidden">
                                <i className="fas fa-chart-pie text-black text-2xl group-hover:scale-125 transition-transform" aria-hidden="true"></i>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase whitespace-nowrap">
                                    Yellove<span className="text-csk-gold italic">OS</span>
                                </h1>
                                <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-gray-500 uppercase tracking-widest hidden sm:block">Tactical Matrix</div>
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 hidden lg:block border-l-2 border-csk-gold pl-2">
                                AI-powered system to reduce crowd congestion and optimize transport decisions in real time
                            </div>
                            <div className="flex items-center gap-3 mt-1 scoreboard-font">
                                <span className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${matchMode ? 'text-emerald-400' : 'text-gray-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${matchMode ? 'bg-emerald-400 animate-pulse' : 'bg-gray-700'}`}></span>
                                    {matchMode ? 'Live Match Uplink' : 'Stadium Standby'}
                                </span>
                                {matchMode && (
                                    <div className="h-3 w-[1px] bg-white/10 mx-1"></div>
                                )}
                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    <i className="fas fa-users mr-1.5 text-csk-gold" aria-hidden="true"></i> Matrix: 2.1.0-Stable
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4 animate-slide-up">
                        <button 
                            type="button"
                            onClick={() => setShowNavigation(true)} 
                            aria-label="Open Navigation System"
                            className="flex items-center gap-2 px-3 md:px-5 py-2.5 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider transition-all duration-300 border bg-indigo-600/10 text-indigo-100 border-indigo-500/30 hover:bg-indigo-600/30 active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
                        >
                            <i className="fas fa-route text-indigo-400" aria-hidden="true"></i> <span className="hidden sm:inline">Navigation</span>
                        </button>
                        
                        <button 
                            type="button"
                            onClick={toggleMatchMode} 
                            aria-label={`Toggle Match Mode ${matchMode ? 'Off' : 'On'}`}
                            aria-pressed={matchMode}
                            className={`flex items-center gap-2 px-3 md:px-5 py-2.5 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider transition-all duration-300 border shadow-lg active:scale-95 ${matchMode ? 'bg-red-600/20 text-red-100 border-red-500/50 hover:bg-red-600/30' : 'bg-csk-gold text-black border-yellow-400 hover:bg-yellow-500'}`}
                        >
                            <i className={`fas ${matchMode ? 'fa-fire-alt animate-pulse' : 'fa-bolt'}`} aria-hidden="true"></i> <span className="hidden sm:inline">{matchMode ? 'Match Live' : 'Match Mode'}</span>
                        </button>
                        
                        <button 
                            type="button"
                            onClick={logout}
                            aria-label="Logout user"
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all duration-300 border bg-gray-900 text-gray-400 border-white/5 hover:text-white hover:bg-gray-800"
                        >
                             <i className="fas fa-power-off" aria-hidden="true"></i>
                        </button>
                    </div>
                </header>

            <main id="main-content" className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                <section aria-label="System Announcements">
                    <div className="mb-6 bg-gradient-to-r from-gray-900 to-gray-800/20 rounded-lg p-3 py-2.5 border border-white/5 flex items-center gap-4 shadow-sm relative overflow-hidden">
                        <div className="bg-csk-gold text-black text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-black animate-ping-slow" aria-hidden="true"></span> Broadcast
                        </div>
                        <div className="text-sm font-medium text-gray-200 truncate w-full h-5 relative" aria-live="polite">
                            <span className="absolute inset-0 animate-fade-in-out">{ANNOUNCEMENTS[announcementIdx]}</span>
                        </div>
                    </div>
                </section>

                <MatchCenter matchMode={matchMode} />

                <section className="px-4 md:px-8 py-8 animate-fade-in relative">
                    <div className="flex flex-col mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-csk-gold rounded-full"></div>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] scoreboard-font">Smart <span className="text-csk-gold">Decision</span> Core</h2>
                        </div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 ml-4 opacity-70">
                            Engineered to resolve crowd congestion, navigate bottlenecks, and automate transport decisions.
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <button 
                            type="button"
                            aria-label={`Route to best entry: ${smartDecisions?.entryGate?.name || "Gate 3"}`}
                            onClick={() => { drawRoute(smartDecisions.entryGate, 'general'); window.scrollTo({top: 500, behavior: 'smooth'}); }} 
                            className="p-5 bg-gray-900/40 rounded-2xl hover:bg-gray-900/60 transition-all text-left border border-white/5 group relative overflow-hidden active:scale-95 turf-pattern"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><i className="fas fa-sign-in-alt text-4xl" aria-hidden="true"></i></div>
                            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Primary Entry
                            </div>
                            <div className="text-base font-black text-white group-hover:text-csk-gold transition-colors">{smartDecisions?.entryGate?.name || "Gate 3"}</div>
                            <div className="text-[11px] text-gray-500 mt-3 font-medium flex items-start gap-2">
                                <i className="fas fa-info-circle mt-0.5 text-csk-gold/50" aria-hidden="true"></i> {smartDecisions.entryReason}
                            </div>
                        </button>

                        <button 
                            type="button"
                            aria-label={`Route to best exit: ${smartDecisions?.exitGate?.name || "Gate 5"}`}
                            onClick={() => { drawRoute(smartDecisions.exitGate, 'general'); window.scrollTo({top: 500, behavior: 'smooth'}); }} 
                            className="p-5 bg-gray-900/40 rounded-2xl hover:bg-gray-900/60 transition-all text-left border border-white/5 group relative overflow-hidden active:scale-95 turf-pattern"
                        >
                             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><i className="fas fa-door-open text-4xl" aria-hidden="true"></i></div>
                            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Optimal Exit
                            </div>
                            <div className="text-base font-black text-white group-hover:text-csk-gold transition-colors">{smartDecisions?.exitGate?.name || "Gate 5"}</div>
                            <div className="text-[11px] text-gray-500 mt-3 font-medium flex items-start gap-2">
                                <i className="fas fa-info-circle mt-0.5 text-csk-gold/50" aria-hidden="true"></i> {smartDecisions.exitReason}
                            </div>
                        </button>

                        <button 
                            type="button"
                            aria-label={`Route to best food: ${smartDecisions?.bestFood?.name || "Quick Bites"}`}
                            onClick={() => { drawRoute(STADIUM_LOCATIONS.FOOD, 'food'); window.scrollTo({top: 500, behavior: 'smooth'}); }} 
                            className="p-5 bg-gray-900/40 rounded-2xl hover:bg-gray-900/60 transition-all text-left border border-white/5 group relative overflow-hidden active:scale-95 turf-pattern"
                        >
                             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><i className="fas fa-hamburger text-4xl" aria-hidden="true"></i></div>
                            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Refresh Zone
                            </div>
                            <div className="text-base font-black text-white group-hover:text-csk-gold transition-colors">{smartDecisions?.bestFood?.name || "Quick Bites"}</div>
                            <div className="text-[11px] text-gray-500 mt-3 font-medium flex items-start gap-2">
                                <i className="fas fa-info-circle mt-0.5 text-csk-gold/50" aria-hidden="true"></i> {smartDecisions.foodReason}
                            </div>
                        </button>

                        <button 
                            type="button"
                            aria-label={`Ask Assistant about: ${smartDecisions.bestTransport}`}
                            onClick={() => setChatLog(prev => [...prev, { sender: 'user', text: `Route me to ${smartDecisions.bestTransport}` }]) || handleAskAssistant("return")} 
                            className="p-5 bg-gray-900/40 rounded-2xl hover:bg-gray-900/60 transition-all text-left border border-white/5 group relative overflow-hidden active:scale-95 turf-pattern"
                        >
                             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><i className="fas fa-subway text-4xl" aria-hidden="true"></i></div>
                            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Post-Match
                            </div>
                            <div className="text-base font-black text-white group-hover:text-csk-gold transition-colors">{smartDecisions.bestTransport}</div>
                            <div className="text-[11px] text-gray-500 mt-3 font-medium flex items-start gap-2">
                                <i className="fas fa-info-circle mt-0.5 text-csk-gold/50" aria-hidden="true"></i> {smartDecisions.transportReason}
                            </div>
                        </button>

                        <button 
                            type="button"
                            aria-label="Start precision navigation"
                            onClick={() => setShowNavigation(true)} 
                            className="p-5 bg-gradient-to-br from-indigo-900 to-gray-900 rounded-2xl hover:brightness-125 transition-all text-left border-2 border-indigo-500/30 group active:scale-95 relative overflow-hidden shadow-[0_10px_30px_rgba(99,102,241,0.2)]"
                        >
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span> Global GPS
                                </div>
                                <div className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">Precision Route</div>
                                <div className="text-[10px] text-gray-400 mt-4 leading-tight font-bold uppercase tracking-widest opacity-70">
                                    Active Matrix Navigation System
                                </div>
                            </div>
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <section className={`glass-panel p-5 transition-all duration-700 ${matchMode ? 'match-mode-glow border-csk-gold/20' : ''}`} aria-label="Stadium Matrix View">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-5 gap-3">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <i className="fas fa-map-location-dot text-csk-gold opacity-90" aria-hidden="true"></i> System Topography
                                    </h2>
                                    <p className="text-gray-400 text-xs mt-1 font-medium">Real-time crowd load distribution & flow mapped onto Chepauk</p>
                                </div>
                                <div className="flex gap-2">
                                     <button 
                                        type="button"
                                        onClick={() => clearRoutes()}
                                        aria-label="Clear active map routes"
                                        className="text-[10px] font-bold uppercase text-gray-300 bg-gray-800/80 hover:bg-gray-700 focus:ring-2 focus:ring-csk-gold p-2 md:px-3 rounded-lg border border-white/10 transition-colors"
                                     >
                                        Clear Map
                                     </button>
                                </div>
                            </div>
                            
                            <div className="relative w-full h-[350px] rounded-xl overflow-hidden border border-white/5 bg-gray-900">
                                <Suspense fallback={<FallbackSpinner />}>
                                    {origin && destination ? (
                                        <GoogleStadiumMap 
                                            isLoaded={isLoaded}
                                            origin={origin}
                                            destination={destination}
                                            waypoints={waypoints}
                                            routeColor={routeColor} 
                                            markers={markers} 
                                            externalDirections={externalDirections}
                                        />
                                    ) : (
                                        <StadiumMap sections={sections} matchMode={matchMode} />
                                    )}
                                </Suspense>
                            </div>
                            
                            {origin && destination && (
                                <div className="mt-5 p-3.5 bg-blue-900/20 border border-blue-500/20 rounded-xl flex items-start gap-3 backdrop-blur-sm animate-slide-up">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                                        <i className="fas fa-route text-blue-400 text-xs"></i>
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-bold text-blue-200 mb-0.5">Active Path Displayed</div>
                                        <div className="text-[11px] text-blue-300/80 leading-relaxed font-semibold italic text-emerald-300">
                                            Route optimized using real-time crowd density and walking navigation
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="glass-panel p-6 flex flex-col stadium-border turf-pattern" aria-label="Queue Wait Times">
                                <div className="flex items-center gap-2 mb-6">
                                     <i className="fas fa-hourglass-half text-csk-gold text-lg" aria-hidden="true"></i>
                                     <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] scoreboard-font">Queue Telemetry</h2>
                                </div>
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                    {sortedAmenities.map(a => <QueueCard key={a.id} item={a} />)}
                                </div>
                            </section>

                            <section className="glass-panel p-6 relative overflow-hidden group stadium-border turf-pattern" aria-label="Squad Radar">
                                {matchMode && <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent z-0 pointer-events-none" aria-hidden="true"></div>}
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex items-center gap-2">
                                         <i className="fas fa-users-viewfinder text-csk-gold text-lg" aria-hidden="true"></i>
                                         <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] scoreboard-font">Squad Radar</h2>
                                    </div>
                                    <i className="fas fa-signal text-emerald-400 text-xs shadow-lg animate-pulse" aria-hidden="true"></i>
                                </div>
                                
                                <div className="space-y-3 relative z-10">
                                    {friends.map(f => (
                                        <div key={f.id} className="p-4 bg-gray-900/60 rounded-xl border border-white/5 flex justify-between items-center hover:bg-gray-800 transition-all active:scale-[0.98]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-800 border-2 border-indigo-500/20 flex items-center justify-center text-sm font-black text-white scoreboard-font" aria-hidden="true">
                                                    {f.id === 1 ? '7' : '18'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white">{f.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest"><i className="fas fa-location-crosshairs text-csk-gold/50 mr-1.5" aria-hidden="true"></i>{f.loc}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-emerald-400 text-sm scoreboard-font tracking-tighter">{f.dist}</div>
                                                <div className="text-[9px] uppercase tracking-[0.2em] font-black text-gray-600 mt-1">{f.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        aria-label="Ping my location to squad"
                                        className="w-full py-3.5 mt-3 border border-indigo-500/20 bg-indigo-500/5 rounded-xl text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500/10 hover:border-indigo-500/40 focus:ring-2 focus:ring-csk-gold transition-all shadow-inner scoreboard-font"
                                    >
                                        Ping My Location
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>

                    <aside className="lg:col-span-1 border border-white/5 rounded-2xl bg-[#0F172A] shadow-2xl relative overflow-hidden flex flex-col h-[650px] lg:h-auto" aria-label="Smart Assistant">
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-csk-gold to-transparent opacity-50" aria-hidden="true"></div>
                        <div className="flex-1 p-2">
                            <Suspense fallback={<FallbackSpinner />}>
                                <CaptainAI 
                                    chatLog={chatLog} 
                                    onAsk={handleAskAssistant} 
                                    onAction={handleQuickAction}
                                    isThinking={isThinking} 
                                />

                            </Suspense>

                        </div>
                        <div className="p-4 bg-gray-950/80 backdrop-blur-md border-t border-white/5" aria-hidden="true">
                            <div className="bg-gray-900/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden stadium-border">
                                <i className="fas fa-trophy absolute -right-4 -bottom-4 text-7xl text-csk-gold opacity-10 rotate-12"></i>
                                <div className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-black mb-3 relative z-10 scoreboard-font">Match Momentum</div>
                                <div className="flex items-end gap-3 relative z-10 mb-5">
                                    <div className="text-4xl font-black text-white scoreboard-font">83<span className="text-xl text-csk-gold">%</span></div>
                                    <div className="text-[10px] text-emerald-400 font-bold pb-2 uppercase tracking-widest"><i className="fas fa-caret-up"></i> +4% last over</div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden relative z-10">
                                    <div className="h-full bg-gradient-to-r from-yellow-600 to-csk-gold shadow-[0_0_10px_rgba(249,205,5,0.5)]" style={{width: '83%'}}></div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                <NewsSection />
            </main>

            <footer className="max-w-7xl mx-auto px-4 md:px-8 py-12 pb-24 md:pb-12 mt-12 relative z-10">
                <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-gray-950/40 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] stadium-border">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-csk-gold shadow-[0_0_10px_rgba(249,205,5,0.5)]"></div>
                            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-csk-gold scoreboard-font">External Intelligence Uplink</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-4">
                            <div className="flex items-center gap-3 group transition-all">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center group-hover:border-csk-gold/50 transition-colors">
                                    <i className="fas fa-route text-[10px] text-csk-gold/60 group-hover:text-csk-gold"></i>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Routing Core</div>
                                    <div className="text-[10px] font-bold text-gray-300">Google Directions v3</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 group transition-all">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center group-hover:border-csk-gold/50 transition-colors">
                                    <i className="fas fa-map-pin text-[10px] text-csk-gold/60 group-hover:text-csk-gold"></i>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Places Matrix</div>
                                    <div className="text-[10px] font-bold text-gray-300">Google Places Intelligence</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 group transition-all">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center group-hover:border-csk-gold/50 transition-colors">
                                    <i className="fas fa-search-location text-[10px] text-csk-gold/60 group-hover:text-csk-gold"></i>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Geo-Resolver</div>
                                    <div className="text-[10px] font-bold text-gray-300">Precision Geocoding</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 group transition-all">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center group-hover:border-csk-gold/50 transition-colors">
                                    <i className="fas fa-bolt text-[10px] text-orange-500/60 group-hover:text-orange-500"></i>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sync Protocol</div>
                                    <div className="text-[10px] font-bold text-gray-300">Firebase Real-time</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 pl-8 border-l border-white/5 h-full">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-1 scoreboard-font">System Kernel</div>
                            <div className="text-[13px] font-black text-white scoreboard-font italic uppercase tracking-tighter">
                                Yellove<span className="text-csk-gold">OS</span> <span className="text-gray-500 text-[10px] ml-2 font-black not-italic">v2.4.0-STABLE</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                             <div className="flex gap-1">
                                {[1,2,3].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i===3 ? 'bg-gray-800' : 'bg-csk-gold animate-pulse'}`}></div>)}
                             </div>
                             <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</div>
                        </div>
                    </div>
                </div>
            </footer>

            {alert && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-pulse w-[90%] max-w-lg" role="alert" aria-live="assertive">
                    <div className="px-5 py-3.5 bg-red-600/95 border border-red-400 text-white text-sm font-bold rounded-2xl shadow-[0_15px_40px_rgba(220,38,38,0.5)] backdrop-blur-md flex items-start gap-4 focus:outline-none" tabIndex="-1">
                        <div className="bg-red-900/50 p-2 rounded-full mt-0.5 shrink-0 border border-red-400/50" aria-hidden="true">
                            <i className="fas fa-triangle-exclamation text-xl"></i>
                        </div>
                        <div className="pt-1 whitespace-pre-wrap leading-relaxed">{alert}</div>
                        <button 
                            type="button"
                            onClick={() => setAlert(null)}
                            aria-label="Close alert"
                            className="ml-auto text-red-200 hover:text-white"
                        >
                             <i className="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            )}

            {showSmartReturn && (
                <Suspense fallback={null}>
                    <SmartReturnPanel 
                        isLoaded={isLoaded}
                        transports={localTransports.length > 0 ? localTransports : transports}
                        onClose={() => setShowSmartReturn(false)} 
                        onSelect={handleTransportSelect}
                        onSelectAddress={handleAddressSelection}
                    />
                </Suspense>
            )}

            {showNavigation && (
                <Suspense fallback={<FallbackSpinner />}>
                    <NavigationPanel 
                        isLoaded={isLoaded} 
                        onClose={() => setShowNavigation(false)}
                        onRouteRequest={handleNavigationRequest}
                    />
                </Suspense>
            )}
            
            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-gray-950/90 backdrop-blur-2xl border-t border-white/5 px-6 py-3 flex justify-between items-center safe-area-bottom">
                <button type="button" aria-label="Scroll to top" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex flex-col items-center gap-1 text-csk-gold">
                    <i className="fas fa-home text-lg" aria-hidden="true"></i>
                    <span className="text-[9px] font-bold uppercase">Home</span>
                </button>
                <button type="button" aria-label="Open navigation routes" onClick={() => setShowNavigation(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-route text-lg" aria-hidden="true"></i>
                    <span className="text-[9px] font-bold uppercase">Routes</span>
                </button>
                <div className="relative -top-6">
                    <button 
                        type="button"
                        aria-label={`Toggle Match Mode ${matchMode ? 'Off' : 'On'}`}
                        aria-pressed={matchMode}
                        onClick={toggleMatchMode} 
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-4 border-gray-950 transition-all duration-500 ${matchMode ? 'bg-red-600 text-white animate-pulse' : 'bg-csk-gold text-black'}`}
                    >
                        <i className={`fas ${matchMode ? 'fa-fire-alt' : 'fa-bolt'} text-xl`} aria-hidden="true"></i>
                    </button>
                </div>
                <button type="button" aria-label="Open return hub" onClick={() => setShowSmartReturn(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-subway text-lg" aria-hidden="true"></i>
                    <span className="text-[9px] font-bold uppercase">Return</span>
                </button>
                <button type="button" aria-label="Logout" onClick={logout} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-sign-out-alt text-lg" aria-hidden="true"></i>
                    <span className="text-[9px] font-bold uppercase">Exit</span>
                </button>
            </div>
            
            <div className="fixed bottom-4 right-4 z-[9999] opacity-20 pointer-events-none select-none hidden md:block">
                <p className="text-[10px] font-black tracking-[0.2em] text-csk-gold uppercase text-right">
                    Engineered for<br/>
                    <span className="text-white text-[12px]">Chennai Super Kings</span>
                </p>
            </div>
        </div>
    );
}
