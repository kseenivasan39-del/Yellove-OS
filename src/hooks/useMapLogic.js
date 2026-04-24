// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
/**
 * useMapLogic - Custom hook for managing stadium topography and navigation states.
 * Orchestrates interaction between UI and Domain Services.
 */

import { useState, useCallback } from 'react';
import { getRouteConfig } from '../utils';
import { geocodeAddress, getNearbyTransport, getTravelTimes, drawRoute } from '../services';

// Centralized location and transport config
export const STADIUM_LOCATIONS = {
    STADIUM_CENTER: { lat: 13.0628, lng: 80.2793 },
    GATES: [
        { id: 'gate-3', name: 'Gate 3 (North)', lat: 13.0640, lng: 80.2805 },
        { id: 'gate-5', name: 'Gate 5 (South)', lat: 13.0610, lng: 80.2770 }
    ],
    FOOD: { lat: 13.0632, lng: 80.2798, name: 'Quick Bites' }
};

/**
 * useMapLogic Hook - Orchestrates stadium navigation state and service interaction
 */
export const useMapLogic = () => {
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [waypoints, setWaypoints] = useState([]);
    const [markers, setMarkers] = useState([{ ...STADIUM_LOCATIONS.STADIUM_CENTER, title: "Your Location" }]);
    const [routeColor, setRouteColor] = useState('#10B981');
    const [externalDirections, setExternalDirections] = useState(null);

    /**
     * Resets all active routes on the map
     */
    const clearRoutes = useCallback(() => {
        setOrigin(null);
        setDestination(null);
        setWaypoints([]);
        setExternalDirections(null);
        setMarkers([{ ...STADIUM_LOCATIONS.STADIUM_CENTER, title: "Your Location" }]);
    }, []);

    /**
     * Updates visual path and markers using drawRoute utility
     * // Using drawRoute utility for navigation
     */
    const handleDrawRoute = useCallback(async (target, type = 'general', travelMode = 'DRIVING', transitOptions = null, originOverride = null) => {
        if (!target) return false;

        const effectiveOrigin = originOverride || STADIUM_LOCATIONS.STADIUM_CENTER;
        const configType = type === 'transport' || type === 'address' ? travelMode.toLowerCase() : type;
        const config = getRouteConfig(effectiveOrigin, target, configType);
        setRouteColor(config.routeColor);
        setOrigin(config.origin);
        setDestination(config.destination);
        setWaypoints(config.waypoints);
        
        try {
            // Using drawRoute for ALL routing
            const result = await drawRoute(null, config.origin, config.destination, null, travelMode, config.waypoints, transitOptions);
            setExternalDirections(result);
        } catch (err) {
            console.error("Internal routing failed, using visual path fallback:", err);
            setExternalDirections(null);
        }

        setMarkers([
            { ...STADIUM_LOCATIONS.STADIUM_CENTER, title: "Your Location" },
            { ...target, title: target.name || "Destination" }
        ]);

        return true;
    }, []);

    /**
     * Converts address string to geocoordinates and draws route
     * // Using Geocoding API for address conversion
     */
    const handleAddressRouteCalculation = useCallback(async (addressString) => {
        try {
            // Using geocodeAddress for manual address input
            const loc = await geocodeAddress(addressString);
            await handleDrawRoute(loc, 'address');
            return { success: true, loc };
        } catch (_e) {
            console.warn(`Routing failed for ${addressString}.`);
            return { success: false };
        }
    }, [handleDrawRoute]);

    /**
     * Fetches nearest transit options for the stadium user
     * // Using Places API for nearby transport
     */
    const fetchTransitOptions = useCallback(async () => {
        // Using getNearbyTransport to fetch transport options
        const transportRaw = await getNearbyTransport(STADIUM_LOCATIONS.STADIUM_CENTER);

        // Uses Google Distance Matrix API to calculate travel time
        if (transportRaw && transportRaw.length > 0) {
            try {
                const destinations = transportRaw.map(t => ({ 
                    lat: typeof t.lat === 'function' ? t.lat() : t.lat, 
                    lng: typeof t.lng === 'function' ? t.lng() : t.lng 
                }));
                
                const times = await getTravelTimes(STADIUM_LOCATIONS.STADIUM_CENTER, destinations);
                
                // Combine distance matrix results with transport data logic
                return transportRaw.map((t, idx) => ({
                    ...t,
                    travelTime: times[idx]?.duration || 'N/A',
                    travelDistance: times[idx]?.distance || 'N/A'
                }));
            } catch (err) {
                console.warn("Distance Matrix calculation failed internal logic", err);
                return transportRaw;
            }
        }
        return transportRaw;
    }, []);

    return {
        origin, destination, waypoints, routeColor, markers, externalDirections,
        clearRoutes,
        drawRoute: handleDrawRoute,
        calculateAddressRoute: handleAddressRouteCalculation,
        fetchTransitOptions,
        STADIUM_LOCATIONS
    };
};
