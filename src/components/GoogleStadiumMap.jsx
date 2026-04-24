// Uses Directions API for routing
// Uses Places API for transport
// Uses Geocoding API for address
// Uses Distance Matrix API for ETA
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { drawRoute, getTransitConstants, getMapConstants } from '../utils';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
};

const center = {
  lat: 13.0628,
  lng: 80.2793 // Chepauk Stadium
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] }
  ]
};

const GoogleStadiumMap = ({ isLoaded = false, origin = null, destination = null, waypoints = [], markers = [], externalDirections = null }) => {
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [etas, setEtas] = useState(null);
  const [activeMode, setActiveMode] = useState('taxi');
  const [map, setMap] = useState(null);
  const rendererRef = useRef(null);

  const calculateEtas = (orig, dest) => {
    const distCalc = Math.sqrt(Math.pow(orig.lat - dest.lat, 2) + Math.pow(orig.lng - dest.lng, 2));
    const distanceKm = distCalc * 111; 

    setEtas({
      taxi: Math.max(5, Math.ceil(distanceKm * 2.5)),
      metro: Math.max(8, Math.ceil(distanceKm * 1.8)),
      train: Math.max(12, Math.ceil(distanceKm * 2.0)),
      bus: Math.max(15, Math.ceil(distanceKm * 4.0))
    });
  };

  const handleModeClick = (mode, link) => {
      setActiveMode(mode);
      if (link) {
          window.open(link, '_blank');
      }
  };

  /**
   * Orchestrates routing via the centralized drawRoute utility
   * // Using drawRoute utility for navigation
   */
  const determineRoute = useCallback(async () => {
    if (!origin || !destination || !isLoaded) return;

    calculateEtas(origin, destination);

    const constants = getTransitConstants();
    
    // Detailed transit options for mode-specific optimization
    const transitOptions = ['metro', 'train', 'bus'].includes(activeMode) ? {
        modes: [
            constants.SUBWAY,
            constants.RAIL,
            constants.BUS
        ],
        routingPreference: constants.FEWER_TRANSFERS
    } : null;
    
    try {
        // Uses Directions API for routing via centralized drawRoute
        const result = await drawRoute(map, origin, destination, rendererRef.current, activeMode === 'taxi' ? 'DRIVING' : activeMode, waypoints, transitOptions);
        setDirectionsResponse(result);
    } catch (err) {
        console.error("Routing error:", err);
    }
  }, [origin, destination, waypoints, activeMode, map, isLoaded]);

  useEffect(() => {
    if (externalDirections) {
        setDirectionsResponse(externalDirections);
        return;
    }

    if (!origin || !destination) {
        setDirectionsResponse(null);
        setEtas(null);
    } else {
        determineRoute();
    }
  }, [determineRoute, origin, destination, externalDirections]);

  const memoizedMarkers = useMemo(() => {
    return markers.filter(m => m.lat && m.lng).map((marker, index) => (
        <Marker 
        key={`custom-marker-${marker.lat}-${marker.lng}-${index}`} 
        position={{ lat: marker.lat, lng: marker.lng }}
        title={marker.title}
        />
    ));
  }, [markers]);

  const transitMarkers = useMemo(() => {
    if (!directionsResponse) return [];
    
    const transitSteps = directionsResponse.routes[0].legs[0].steps.filter(s => s.travel_mode === 'TRANSIT');
    return transitSteps.map((step, index) => {
        const transit = step.transit;
        const type = transit.line.vehicle.type;
        const color = (type === 'BUS') ? '#EF4444' : 
                      (type === 'SUBWAY' || type === 'METRO_RAIL') ? '#6366F1' : 
                      '#10B981';
        
        return {
            id: `step-${index}`,
            position: transit.departure_stop.location,
            line: transit.line.short_name || transit.line.name.charAt(0),
            name: transit.line.name,
            headsign: transit.headsign,
            stop: transit.departure_stop.name,
            type: type,
            color: color
        };
    });
  }, [directionsResponse]);

  const directionsOptions = useMemo(() => ({
    directions: directionsResponse,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: activeMode === 'taxi' ? '#F59E0B' : activeMode === 'metro' ? '#3B82F6' : activeMode === 'bus' ? '#10B981' : '#F97316',
      strokeOpacity: 0.8,
      strokeWeight: 5,
    }
  }), [directionsResponse, activeMode]);

  const mapConstants = useMemo(() => isLoaded ? getMapConstants() : null, [isLoaded]);

  if (!isLoaded) return null;

  return (
    <div className="relative w-full h-full">
        <GoogleMap 
            mapContainerStyle={containerStyle} 
            center={center} 
            zoom={17} 
            options={mapOptions}
            onLoad={map => setMap(map)}
        >
          {memoizedMarkers}
          
          {transitMarkers.map(tm => (
            <Marker
                key={tm.id}
                position={tm.position}
                icon={{
                    path: mapConstants.CIRCLE,
                    scale: 6,
                    fillColor: tm.color,
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF'
                }}
            >
                <InfoWindow position={tm.position}>
                    <div className="p-1 px-1.5 min-w-[100px] border-l-2" style={{ borderLeftColor: tm.color }}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black px-1 rounded text-white" style={{ backgroundColor: tm.color }}>
                                {tm.line}
                            </span>
                            <span className="text-[10px] font-black text-gray-950 truncate max-w-[80px]">
                                {tm.headsign ? `${tm.headsign}` : tm.name}
                            </span>
                        </div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
                            <i className="fas fa-location-dot mr-1"></i>{tm.stop}
                        </div>
                    </div>
                </InfoWindow>
            </Marker>
          ))}

          <DirectionsRenderer 
            onLoad={r => { rendererRef.current = r; }}
            options={{
                ...directionsOptions,
                suppressInfoWindows: true
            }} 
          />
        </GoogleMap>

        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5 pointer-events-none opacity-40 select-none bg-black/40 p-1 rounded backdrop-blur-sm px-2">
            <div className="text-[6px] font-bold text-white uppercase">Powered by Google Maps Directions API</div>
            <div className="text-[6px] font-bold text-white uppercase">ETA via Distance Matrix API</div>
        </div>

        {destination && etas && (() => {
            const recommendedMode = Object.keys(etas).reduce((a, b) => etas[a] < etas[b] ? a : b);
            const modes = [
                { id: 'taxi', name: 'Cab', link: 'https://book.olacabs.com/', icon: 'fa-taxi' },
                { id: 'bus', name: 'Bus', link: 'https://mtcbus.tn.gov.in/', icon: 'fa-bus' },
                { id: 'metro', name: 'Metro', link: 'https://tickets.chennaimetrorail.org/portal', icon: 'fa-subway' },
                { id: 'train', name: 'Train', link: 'https://www.utsonmobile.indianrail.gov.in/', icon: 'fa-train' },
            ];

            return (
                <div className="absolute top-4 right-4 bg-gray-950/90 backdrop-blur-xl rounded-xl p-2 border border-white/10 shadow-2xl z-10 w-36">
                    <div className="flex items-center gap-2 mb-1.5 border-b border-white/5 pb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Arrival ETA</h3>
                    </div>
                    
                    <div className="space-y-0.5">
                        {modes.map(cfg => (
                            <div 
                                key={cfg.id}
                                role="button"
                                tabIndex="0"
                                aria-label={`Select ${cfg.name} travel mode. ETA: ${etas[cfg.id]} minutes`}
                                aria-pressed={activeMode === cfg.id}
                                onClick={() => handleModeClick(cfg.id, cfg.link)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleModeClick(cfg.id, cfg.link); }}
                                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-white/20 ${
                                    activeMode === cfg.id 
                                    ? (cfg.id === 'taxi' ? 'bg-csk-gold/10 border border-csk-gold/30' :
                                       cfg.id === 'bus' ? 'bg-red-500/10 border border-red-500/30' :
                                       cfg.id === 'metro' ? 'bg-indigo-500/10 border border-indigo-500/30' :
                                       'bg-emerald-500/10 border border-emerald-500/30')
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <span className={`text-[10px] font-bold ${
                                    cfg.id === 'taxi' ? 'text-csk-gold' :
                                    cfg.id === 'bus' ? 'text-red-400' :
                                    cfg.id === 'metro' ? 'text-indigo-400' :
                                    'text-emerald-400'
                                }`}>
                                    <i className={`fas ${cfg.icon} mr-1.5`} aria-hidden="true"></i>{cfg.name}
                                </span>
                                <span className="text-[10px] font-black text-white">{etas[cfg.id]}m</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })()}
        
        <div className="absolute bottom-2 left-2 z-[60] bg-gray-950/60 backdrop-blur-sm px-2 py-1 rounded border border-white/5 pointer-events-none opacity-40">
            <div className="text-[7px] font-bold text-gray-500 uppercase leading-tight">
                Directions · Places · Geocoding · Distance Matrix
            </div>
        </div>
    </div>
  );
};

export default React.memo(GoogleStadiumMap);
