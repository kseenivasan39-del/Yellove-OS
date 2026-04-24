// Uses Directions API for routing
// Uses Places API for transport
// Uses Geocoding API for address
// Uses Distance Matrix API for ETA

import React, { useState, useEffect, useRef } from 'react';
import { drawRoute, getTransitConstants, initAutocomplete } from '../utils';
import { computeDistance } from '../utils';
import DOMPurify from 'dompurify';

const NavigationPanel = ({ isLoaded, onClose, onRouteRequest, defaultOrigin = "Chepauk Stadium" }) => {
    const [originStr, setOriginStr] = useState(defaultOrigin);
    const [destStr, setDestStr] = useState('');
    const [travelMode, setTravelMode] = useState('cab');
    const [showDirections, setShowDirections] = useState(false);
    const [directionsSteps, setDirectionsSteps] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);
    const [error, setError] = useState(null);
    
    const autocompleteOrigin = useRef(null);
    const autocompleteDest = useRef(null);

    useEffect(() => {
        if (!isLoaded) return;

        const timer = setTimeout(() => {
            const originInput = document.getElementById('nav-origin');
            const destInput = document.getElementById('nav-destination');

            if (originInput && !autocompleteOrigin.current) {
                // Uses Geocoding/Places API via centralized initAutocomplete
                autocompleteOrigin.current = initAutocomplete(originInput, (place) => {
                    setOriginStr(place.formatted_address || place.name);
                });
            }

            if (destInput && !autocompleteDest.current) {
                // Uses Geocoding/Places API via centralized initAutocomplete
                autocompleteDest.current = initAutocomplete(destInput, (place) => {
                    setDestStr(place.formatted_address || place.name);
                });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isLoaded]);

    const modes = [
        { id: 'cab', name: 'Cab', icon: 'fa-taxi', googleMode: 'DRIVING' },
        { id: 'bus', name: 'Bus', icon: 'fa-bus', googleMode: 'TRANSIT', transitType: 'BUS' },
        { id: 'metro', name: 'Metro', icon: 'fa-subway', googleMode: 'TRANSIT', transitType: 'SUBWAY' },
        { id: 'train', name: 'Train', icon: 'fa-train', googleMode: 'TRANSIT', transitType: 'RAIL' },
    ];

    const [transitNarrative, setTransitNarrative] = useState(null);

    /**
     * Calculates route using the Cascading Mode Search strategy.
     * Centralized via NavigationService.
     * User input -> drawRoute (which internally may use geocode)
     */
    const handleCalculateRoute = async () => {
        if (!originStr || !destStr) {
            setError("Please enter both origin and destination");
            return;
        }

        // Security: Sanitize user inputs
        const cleanOrigin = DOMPurify.sanitize(originStr.trim()).substring(0, 200);
        const cleanDest = DOMPurify.sanitize(destStr.trim()).substring(0, 200);
        
        if (cleanOrigin.length < 3 || cleanDest.length < 3) {
            setError("Input parameters too short for tactical routing.");
            return;
        }

        setError(null);
        setTransitNarrative(null);
        const modeCfg = modes.find(m => m.id === travelMode) || modes[0];
        const constants = getTransitConstants();

        const tryRouting = async (preferredModes, forceStadiumOrigin = false) => {
            const transitOptions = modeCfg.googleMode === 'TRANSIT' ? {
                modes: preferredModes,
                routingPreference: constants.FEWER_TRANSFERS,
                departureTime: new Date()
            } : null;

            // Shift origin to the actual station for Train/Metro intents to force rail/subway results
            let actualOrigin = cleanOrigin;
            let manualWalkPrefix = "";
            const waypoints = [];
            
            const isAtStadium = cleanOrigin.toLowerCase().includes("chepauk") || cleanOrigin.toLowerCase().includes("stadium");

            if (!forceStadiumOrigin && isAtStadium) {
                if (modeCfg.id === 'train') {
                     actualOrigin = { lat: 13.0645, lng: 80.2810 }; // Chepauk MRTS 
                     manualWalkPrefix = "Tactical Move: Walk 400m from stadium to Chepauk Station. ";
                     
                     // If destination is in the North/West (Anna Nagar), or South (Guduvancheri)
                     if (cleanDest.toLowerCase().includes("anna") || cleanDest.toLowerCase().includes("central") || cleanDest.toLowerCase().includes("egmore") || cleanDest.toLowerCase().includes("beach")) {
                         waypoints.push({ lat: 13.0910, lng: 80.2880 }); // Chennai Beach Hub (Interchange for North/West)
                     } else if (cleanDest.toLowerCase().includes("guduvancheri") || cleanDest.toLowerCase().includes("vandalur") || cleanDest.toLowerCase().includes("tambaram") || cleanDest.toLowerCase().includes("chromepet") || cleanDest.toLowerCase().includes("pallavaram")) {
                         // Tactical Path: Chepauk -> Park Town -> (Walk) -> Park Station -> South Line
                         // We force Park Town to ensure the user gets on the MRTS first
                         waypoints.push({ lat: 13.0820, lng: 80.2745 }); // Park Town MRTS Station
                         manualWalkPrefix += "Optimization: Routing via Park Town interchange to access the South Line Suburban network. ";
                     }
                } else if (modeCfg.id === 'metro') {
                     actualOrigin = { lat: 13.0641, lng: 80.2711 }; // Govt Estate Metro
                     manualWalkPrefix = "Metro Strategy: Walk 800m to Government Estate (Blue Line) to maximize tunnel travel distance. ";
                     
                     if (cleanDest.toLowerCase().includes("anna") || cleanDest.toLowerCase().includes("tirumangalam") || cleanDest.toLowerCase().includes("koyambedu")) {
                         waypoints.push({ lat: 13.0814, lng: 80.2721 }); // Chennai Central Metro Interchange
                     }
                }
            }

            // Uses Directions API for routing via centralized drawRoute
            const result = await drawRoute(null, actualOrigin, cleanDest, null, modeCfg.googleMode, waypoints, transitOptions);
            if (manualWalkPrefix && result.routes[0]) {
                result.routes[0].manualWalkPrefix = manualWalkPrefix;
            }
            return result;
        };

        try {
            let result;
            let primaryMode;
            
            if (modeCfg.id === 'metro') primaryMode = [constants.SUBWAY];
            else if (modeCfg.id === 'train') primaryMode = [constants.RAIL];
            else if (modeCfg.id === 'bus') primaryMode = [constants.BUS];

            // 1. Initial High-Preference Search (e.g. Metro only, Train only)
            if (primaryMode) {
                try {
                    result = await tryRouting(primaryMode);
                    
                    const leg = result.routes[0].legs[0];
                    const transitSteps = leg.steps.filter(s => s.travel_mode === 'TRANSIT');
                    
                    if (transitSteps.length > 0) {
                        const lastStop = transitSteps[transitSteps.length - 1].transit.arrival_stop.location;
                        const destLoc = leg.end_location;
                        const distToFinal = computeDistance(lastStop, destLoc);
                        
                        // If the transit drops the user too far from the destination, it's a bad route
                        if (distToFinal > 5000) throw new Error("unreachable");
                    }
                } catch (e) {
                    console.log("High-preference transit route failed or dropped too far. Broadening search parameters...");
                    
                    // 2. Medium-Preference: Try the two main rail modes (Metro + MRTS), reset origin to Stadium if needed
                    try {
                        // For Metro mode, if SUBWAY-only failed from Govt Estate, try adding RAIL but reset origin to stadium
                        // to allow Chepauk station to be used if it's better.
                        result = await tryRouting([constants.SUBWAY, constants.RAIL], true);
                    } catch (err) {
                        // 3. Last Resort: Full Multi-Modal (Metro + Rail + Bus) from stadium
                        result = await tryRouting([constants.SUBWAY, constants.RAIL, constants.BUS], true);
                    }
                }
            } else {
                result = await tryRouting([constants.SUBWAY, constants.RAIL, constants.BUS], true);
            }

            const route = result.routes[0].legs[0];
            const narrative = generateTransitNarrative(result.routes[0]);
            setTransitNarrative(narrative);

            setRouteInfo({
                distance: route.distance.text,
                duration: route.duration.text,
                startAddress: route.start_address,
                endAddress: route.end_address
            });
            setDirectionsSteps(route.steps);
            setShowDirections(true);
            
            let finalTransitOptions = { modes: [constants.SUBWAY, constants.RAIL, constants.BUS] };
            if (modeCfg.id === 'train') finalTransitOptions = { modes: [constants.RAIL] };
            else if (modeCfg.id === 'metro') finalTransitOptions = { modes: [constants.SUBWAY] };
            else if (modeCfg.id === 'bus') finalTransitOptions = { modes: [constants.BUS] };

            onRouteRequest({
                origin: route.start_location,
                destination: route.end_location,
                travelMode: travelMode,
                googleMode: modeCfg.googleMode,
                transitOptions: finalTransitOptions,
                result: result
            });
        } catch (status) {
            setError("Tactical route calculation failed. Please check network telemetry.");
        }
    };

    const generateTransitNarrative = (routeData) => {
        const route = routeData.legs[0];
        const transitSteps = route.steps.filter(s => s.travel_mode === 'TRANSIT');
        if (transitSteps.length === 0) return null;

        let narrative = "Yellove Tactics: ";
        
        // Add manual walking prefix if injected by the routing engine
        if (routeData.manualWalkPrefix) {
            narrative += routeData.manualWalkPrefix;
        }

        const firstStep = transitSteps[0];
        const stopName = firstStep.transit.departure_stop.name.toLowerCase();
        const lineName = (firstStep.transit.line.name || '').toLowerCase();
        
        // Context-aware station guidance for Chepauk area (if not already covered by manualWalkPrefix)
        if (!routeData.manualWalkPrefix && (originStr.toLowerCase().includes("chepauk") || originStr.toLowerCase().includes("stadium"))) {
            if (stopName.includes("government estate") || stopName.includes("lic") || stopName.includes("central metro")) {
                narrative += "Head to Government Estate Metro (Blue Line) for Maximum Metro coverage. ";
            } else if (stopName.includes("chepauk") || stopName.includes("beach") || lineName.includes("mrts") || lineName.includes("velachery")) {
                narrative += "Proceed to Chepauk Station for the MRTS / Local Train. ";
            }
        }

        // Metro Bias for Maximum Distance
        if (travelMode === 'metro') {
            narrative += "Metro Max-Distance Strategy: Path is biased towards underground tunnels to minimize surface traffic impacts and walking distance in high-congestion areas. ";
        }

        // Tactical override for Guduvancheri / Kayaramedu
        if (destStr.toLowerCase().includes("guduvancheri") || destStr.toLowerCase().includes("kayaramedu")) {
            narrative += "Tactical Intel: The South Line Suburban Train is optimal, but MTC Express/Deluxe buses (like G70, 500, or E-series) are a high-speed road alternative. Look for 'Express' or 'Deluxe' on the MTC display for a faster commute. ";
        }

        narrative += `Board the ${firstStep.transit.line.name || firstStep.transit.line.short_name} towards ${firstStep.transit.arrival_stop.name}. `;
        
        if (transitSteps.length > 1) {
            for (let i = 1; i < transitSteps.length; i++) {
                const prev = transitSteps[i-1];
                const curr = transitSteps[i];
                narrative += `Switch at ${prev.transit.arrival_stop.name} to the ${curr.transit.line.name || curr.transit.line.short_name}. `;
            }
        } else {
            narrative += `Stay on the line until ${firstStep.transit.arrival_stop.name}. Avoid rush hours for a smoother transition. `;
        }
        
        return narrative;
    };

    const getTacticalAdvice = (step, prevStep) => {
        const isTransit = step.travel_mode === 'TRANSIT' && step.transit;
        const isWalking = step.travel_mode === 'WALKING';
        const distValue = step.distance.value;

        if (isTransit) {
            const vehicleType = step.transit.line.vehicle.type;
            const lineName = (step.transit.line.name || '').toLowerCase();
            const stopName = (step.transit.departure_stop.name || '').toLowerCase();
            const arrivalStop = (step.transit.arrival_stop.name || '').toLowerCase();

            // Tactical hub detection: Chennai MRTS and Suburban hubs
            const isRailHub = 
                stopName.includes('chepauk') || stopName.includes('beach') || stopName.includes('central') || 
                stopName.includes('egmore') || stopName.includes('park') || stopName.includes('fort') ||
                arrivalStop.includes('chepauk') || arrivalStop.includes('beach');

            // INTENT FIX: If user picked 'train' mode, treat all rail/subway/transit as Train details
            const isActuallyTrain = 
                travelMode === 'train' ||
                ['RAIL', 'HEAVY_RAIL', 'COMMUTER_TRAIN', 'SUBURBAN_RAIL'].includes(vehicleType) || 
                lineName.includes('mrts') || 
                lineName.includes('velachery') ||
                isRailHub;

            if (!isActuallyTrain && (vehicleType === 'SUBWAY' || vehicleType === 'METRO_RAIL')) {
                return {
                    title: "Metro Logistics",
                    advice: "Action: Get your Metro QR ticket via CMRL App to skip the counter. Proceed to the platform for the next train.",
                    icon: "fa-ticket"
                };
            }
            if (isActuallyTrain) {
                return {
                    title: "Rail Intel",
                    advice: "Action: Board the Local Train / MRTS. Use UTS App for instant paperless tickets. Local trains help bypass stadium road traffic.",
                    icon: "fa-train-subway"
                };
            }
            if (vehicleType === 'BUS') {
                const isExpress = (step.transit.line.name || '').toLowerCase().includes('express') || (step.transit.line.short_name || '').startsWith('E');
                const isMTC = (step.transit.line.name || '').toUpperCase().includes('MTC');
                
                return {
                    title: isExpress ? "MTC Express Advantage" : "MTC Transit Intel",
                    advice: isExpress 
                        ? "Action: This is an Express service. It has fewer stops and uses the bypass/flyovers where possible. Premium fare applies but saves 15+ mins." 
                        : "Action: Board the MTC bus. Keep change ready for the conductor. Use the Chalo App for live MTC bus tracking if available.",
                    icon: "fa-bus-simple"
                };
            }
            return {
                title: "Transit Transfer",
                advice: "Action: Keep change ready for the bus or use your transit card for a seamless transfer.",
                icon: "fa-bus"
            };
        }

        if (isWalking && distValue > 600) {
            return {
                title: "First-Mile Buffer",
                advice: "Logic: Significant walking distance (approx. 8-10 mins). You might prefer a quick Auto or Cab to the station/destination.",
                icon: "fa-person-walking-arrow-right"
            };
        }

        if (prevStep && prevStep.travel_mode === 'TRANSIT' && isWalking) {
           return {
                title: "Transfer Advice",
                advice: "Logic: You have reached the station. Switch modes now to reach your final target destination.",
                icon: "fa-shuffle"
           };
        }

        return null;
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-end md:p-6 p-0" role="dialog" aria-modal="true" aria-labelledby="nav-panel-title">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            <div className="relative w-full max-w-md h-full md:h-[90vh] bg-gray-900 border-l border-white/10 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gray-950 z-10 stadium-border">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/30">
                            <i className="fas fa-satellite-dish text-white text-xl" aria-hidden="true"></i>
                        </div>
                        <div>
                            <h2 id="nav-panel-title" className="text-base font-black text-white uppercase tracking-[0.2em] scoreboard-font">
                                Global <span className="text-indigo-400">Uplink</span>
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">Optimized routes to reduce congestion</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation panel"
                        className="w-10 h-10 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 transition-all active:scale-90"
                    >
                        <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar turf-pattern">
                    {!showDirections ? (
                        <div className="space-y-8 animate-fade-in relative">
                            <div className="absolute top-0 right-0 opacity-5 pointer-events-none p-10 select-none">
                                <i className="fas fa-route text-[200px] -rotate-12" aria-hidden="true"></i>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                         <label htmlFor="nav-origin" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Origin Link</label>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50" aria-hidden="true">
                                            <i className="fas fa-crosshairs text-sm"></i>
                                        </div>
                                        <input 
                                            id="nav-origin"
                                            type="text"
                                            value={originStr}
                                            onChange={(e) => setOriginStr(e.target.value)}
                                            placeholder="From location..."
                                            className="w-full bg-gray-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center -my-2 relative z-10">
                                    <button 
                                        type="button"
                                        aria-label="Swap origin and destination"
                                        onClick={() => {
                                            const temp = originStr;
                                            setOriginStr(destStr);
                                            setDestStr(temp);
                                        }}
                                        className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-indigo-400 hover:scale-110 transition-transform shadow-lg"
                                    >
                                        <i className="fas fa-arrows-up-down" aria-hidden="true"></i>
                                    </button>
                                </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                                                <label htmlFor="nav-destination" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Target Node</label>
                                            </div>
                                            <div className="text-[9px] font-black text-blue-400/60 uppercase tracking-[0.2em] select-none text-right">
                                                Optimized routes to reduce congestion
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 opacity-50" aria-hidden="true">
                                                <i className="fas fa-location-dot"></i>
                                            </div>
                                            <input 
                                                id="nav-destination"
                                                type="text"
                                                value={destStr}
                                                onChange={(e) => setDestStr(e.target.value)}
                                                placeholder="To location..."
                                                className="w-full bg-gray-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Travel Strategy</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {modes.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setTravelMode(m.id)}
                                            aria-label={`Select ${m.name} mode`}
                                            aria-pressed={travelMode === m.id}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                                travelMode === m.id 
                                                ? (m.id === 'cab' ? 'bg-csk-gold/10 border-csk-gold text-csk-gold shadow-[0_0_15px_rgba(249,205,5,0.1)]' :
                                                   m.id === 'bus' ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                                                   m.id === 'metro' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' :
                                                   'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]')
                                                : 'bg-gray-900/50 border-white/5 text-gray-400 hover:bg-gray-800'
                                            }`}
                                        >
                                            <i className={`fas ${m.icon} text-sm`} aria-hidden="true"></i>
                                            <span className="text-[9px] font-bold uppercase tracking-tighter">{m.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-medium flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle text-rose-500"></i> {error}
                                </div>
                            )}

                            <button 
                                type="button"
                                onClick={handleCalculateRoute}
                                aria-label="Compute optimal navigation path"
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <i className="fas fa-paper-plane" aria-hidden="true"></i> Compute Optimal Path
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in pb-10">
                            <div className="p-5 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Estimated Arrival</div>
                                        <div className="text-3xl font-black text-white">{routeInfo.duration}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Payload</div>
                                        <div className="text-xl font-black text-white">{routeInfo.distance}</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[11px] text-indigo-200">
                                    <i className="fas fa-shield-halved text-emerald-400"></i> Route secure · Encrypted telemetry active
                                </div>
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <i className="fas fa-route text-6xl -rotate-12"></i>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-list-ol text-blue-400"></i> Step-by-Step Maneuvers
                                </h3>

                                {transitNarrative && (
                                     <div className="p-4 bg-csk-gold/10 border border-csk-gold/20 rounded-2xl animate-fade-in shadow-lg relative overflow-hidden group">
                                         <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                             <i className="fas fa-chess-knight text-8xl text-indigo-400 rotate-12"></i>
                                         </div>
                                         <div className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                             <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
                                             Tactical Briefing
                                         </div>
                                         <div className="text-[11px] font-bold text-gray-100 leading-relaxed italic pr-4">
                                             {transitNarrative}
                                         </div>
                                     </div>
                                 )}

                                <div className="space-y-0.5 border-l-2 border-indigo-500/20 ml-2 pl-6">
                                    {directionsSteps.map((step, idx) => {
                                         const isTransit = step.travel_mode === 'TRANSIT' && step.transit;
                                         const tactical = getTacticalAdvice(step, idx > 0 ? directionsSteps[idx-1] : null);
                                         
                                         return (
                                             <div key={idx} className="relative py-4 group">
                                                 <div className={`absolute -left-[33px] top-5 w-4 h-4 rounded-full bg-gray-900 border-2 flex items-center justify-center z-10 ${
                                                     isTransit ? (
                                                         (step.transit.line.vehicle.type === 'BUS') ? 'border-red-400' :
                                                         (step.transit.line.vehicle.type === 'SUBWAY' || step.transit.line.vehicle.type === 'METRO_RAIL') ? 'border-indigo-400' :
                                                         'border-emerald-400'
                                                     ) : 'border-indigo-50'
                                                 }`}>
                                                     <div className={`w-1.5 h-1.5 rounded-full ${
                                                         isTransit ? (
                                                             (step.transit.line.vehicle.type === 'BUS') ? 'bg-red-500' :
                                                             (step.transit.line.vehicle.type === 'SUBWAY' || step.transit.line.vehicle.type === 'METRO_RAIL') ? 'bg-indigo-500' :
                                                             'bg-emerald-500'
                                                         ) : 'bg-indigo-500'
                                                     }`}></div>
                                                 </div>
                                                 <div className="flex flex-col gap-1">
                                                     <div className="flex items-center gap-2 mb-1">
                                                         {isTransit && (
                                                         <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${
                                                             (step.transit.line.vehicle.type === 'BUS') ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                             (step.transit.line.vehicle.type === 'SUBWAY' || step.transit.line.vehicle.type === 'METRO_RAIL') ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                                                             'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                         }`}>
                                                                 {
                                                                     (step.transit.line.name || '').toLowerCase().includes('mrts') || 
                                                                     (step.transit.line.name || '').toLowerCase().includes('velachery') ||
                                                                     ['RAIL', 'HEAVY_RAIL', 'COMMUTER_TRAIN'].includes(step.transit.line.vehicle.type)
                                                                     ? "Local Train" 
                                                                     : step.transit.line.vehicle.name
                                                                 }
                                                             </span>
                                                         )}
                                                         <div 
                                                             className={`text-sm leading-relaxed font-bold ${isTransit ? 'text-white' : 'text-gray-300'}`}
                                                             dangerouslySetInnerHTML={{ __html: step.instructions }}
                                                         ></div>
                                                     </div>

                                                     {isTransit && (
                                                         <div className={`mb-2 p-2.5 border rounded-lg flex flex-col gap-1.5 shadow-inner ${
                                                             (step.transit.line.vehicle.type === 'BUS') ? 'bg-red-500/5 border-red-500/20' :
                                                             (step.transit.line.vehicle.type === 'SUBWAY' || step.transit.line.vehicle.type === 'METRO_RAIL') ? 'bg-indigo-500/5 border-indigo-500/20' :
                                                             'bg-emerald-500/5 border-emerald-500/20'
                                                         }`}>
                                                             <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-black text-[11px] shadow-lg border-2 border-white/20 ${
                                                                 (step.transit.line.vehicle.type === 'BUS') ? 'bg-red-600' :
                                                                 (step.transit.line.vehicle.type === 'SUBWAY' || step.transit.line.vehicle.type === 'METRO_RAIL') ? 'bg-indigo-600' :
                                                                 'bg-emerald-600'
                                                             }`}>
                                                                 {step.transit.line.short_name || (step.transit.line.name ? step.transit.line.name.charAt(0) : 'T')}
                                                             </div>
                                                             <div className="flex flex-col">
                                                                 <span className="text-[12px] font-black text-white leading-none mb-0.5">
                                                                     {step.transit.line.short_name ? `Bus No ${step.transit.line.short_name}` : 
                                                                      step.transit.line.name.toLowerCase().includes('line') ? step.transit.line.name : `Line ${step.transit.line.name}`}
                                                                 </span>
                                                                 {step.transit.headsign && (
                                                                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                                                         Towards {step.transit.headsign}
                                                                     </span>
                                                                 )}
                                                             </div>
                                                             <div className="flex items-center gap-3 mt-0.5 pl-0.5">
                                                                 <div className="flex flex-col">
                                                                     <div className="text-[9px] font-black text-emerald-400/80 uppercase">Board at</div>
                                                                     <div className="text-[10px] font-bold text-gray-200">{step.transit.departure_stop.name}</div>
                                                                 </div>
                                                                 <i className="fas fa-arrow-right text-[8px] text-gray-700"></i>
                                                                 <div className="flex flex-col">
                                                                     <div className="text-[9px] font-black text-rose-400/80 uppercase">Alight at</div>
                                                                     <div className="text-[10px] font-bold text-gray-200">{step.transit.arrival_stop.name}</div>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     )}

                                                     {tactical && (
                                                         <div className="mt-1 p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl animate-fade-in shadow-sm">
                                                             <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                                                 <i className={`fas ${tactical.icon} text-indigo-400`}></i> {tactical.title}
                                                             </div>
                                                             <div className="text-[10px] font-bold text-indigo-100/90 leading-relaxed italic">
                                                                 {tactical.advice}
                                                             </div>
                                                         </div>
                                                     )}

                                                     <div className="flex items-center gap-3 mt-1">
                                                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{step.distance.text}</span>
                                                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{step.duration.text}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                </div>
                            </div>

                            <button 
                                type="button"
                                onClick={() => setShowDirections(false)}
                                aria-label="Edit route parameters and recalculate"
                                className="w-full py-4 bg-gray-800 text-gray-300 font-black text-sm rounded-xl border border-white/5 hover:bg-gray-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <i className="fas fa-edit" aria-hidden="true"></i> Recalculate Logic
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-950 border-t border-white/5 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">GPS Navigation Active</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 opacity-40 select-none">
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Powered by Google Maps Directions API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Transport data via Google Places API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Address conversion via Geocoding API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">ETA via Distance Matrix API</div>
                        <div className="text-[8px] font-bold text-orange-500/80 uppercase">Real-time Telemetry via Google Firebase</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(NavigationPanel);

