// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
/**
 * Navigation Service - Centralized logic for route calculation and optimization.
 * Orchestrates the Google Directions API and Routes API to provide tactical routing for Yellove OS.
 */

import { getRoute } from './routesService';

/**
 * Executes a path calculation request. 
 * Normalizes travel modes and transit preferences to ensure reliable routing.
 */
export const drawRoute = async (map, origin, destination, renderer, travelMode = 'DRIVING', waypoints = [], transitOptions = null) => {
    let effectiveMode = travelMode;
    const lowerMode = String(travelMode || '').toLowerCase();

    // Mapping intent to effective Google Travel Modes
    if (lowerMode.includes('train')) {
        effectiveMode = 'TRANSIT';
    } else if (lowerMode.includes('metro')) {
        if (!lowerMode.includes('transit')) effectiveMode = 'TRANSIT';
    } else if (lowerMode.includes('bus')) {
        if (!lowerMode.includes('transit')) effectiveMode = 'TRANSIT';
    } else if (lowerMode.includes('cab') || lowerMode.includes('taxi')) {
        effectiveMode = 'DRIVING';
    }

    const isTransitIntent = effectiveMode === 'TRANSIT' || lowerMode.includes('transit');

    /**
     * Requirement: Use Directions API (v1) for ALL Transit requests.
     * Legacy Directions API is more reliable for specialized transport like the Chennai MRTS.
     */
    if (!isTransitIntent && waypoints.length === 0 && (typeof origin !== 'string' && typeof destination !== 'string')) {
        try {
            const routesResult = await getRoute(origin, destination, effectiveMode, transitOptions);
            if (renderer && typeof renderer.setDirections === 'function') {
                renderer.setDirections(routesResult);
            }
            return routesResult;
        } catch (_err) {
            console.warn("Routes API optimized path failed, falling back to Directions Service.");
        }
    }

    // Standard Directions API Fallback / Primary for Transit & Address queries
    const maps = window.google?.maps;
    if (!maps || !maps.DirectionsService) {
        return Promise.reject(new Error("Google Maps Directions Service not available"));
    }

    const directionsService = new maps.DirectionsService();
    
    let mode = maps.TravelMode.DRIVING;
    const finalLower = effectiveMode.toLowerCase();
    
    if (finalLower.includes('walk')) mode = maps.TravelMode.WALKING;
    else if (finalLower.includes('transit')) mode = maps.TravelMode.TRANSIT;
    else if (finalLower.includes('bike')) mode = maps.TravelMode.BICYCLING;

    const request = {
        origin,
        destination,
        waypoints: waypoints.map(wp => ({ location: wp, stopover: true })),
        travelMode: mode,
    };

    /**
     * Transit Normalization - Ensures compatibility between UI intent and API constants.
     */
    if (mode === maps.TravelMode.TRANSIT) {
        if (transitOptions) {
            const normalizedOptions = { ...transitOptions };
            if (normalizedOptions.modes) {
                normalizedOptions.modes = normalizedOptions.modes.map(m => {
                    // Normalize string ids to Google Enums with robust fallbacks
                    if (m === 'RAIL' || m === 'train' || m === 'COMMUTER_TRAIN') return maps.TransitMode?.RAIL || 'RAIL';
                    if (m === 'SUBWAY' || m === 'metro' || m === 'METRO_RAIL') return maps.TransitMode?.SUBWAY || 'SUBWAY';
                    if (m === 'BUS' || m === 'bus') return maps.TransitMode?.BUS || 'BUS';
                    return m;
                });
            }
            // Ensure routing preference is set if not provided
            if (!normalizedOptions.routingPreference) {
                normalizedOptions.routingPreference = maps.TransitRoutePreference?.FEWER_TRANSFERS;
            }
            request.transitOptions = normalizedOptions;
        } else if (lowerMode.includes('train')) {
            request.transitOptions = {
                modes: [maps.TransitMode?.RAIL || 'RAIL'],
                routingPreference: maps.TransitRoutePreference?.FEWER_TRANSFERS
            };
        } else if (lowerMode.includes('metro')) {
            request.transitOptions = {
                modes: [maps.TransitMode?.SUBWAY || 'SUBWAY'],
                routingPreference: maps.TransitRoutePreference?.FEWER_TRANSFERS
            };
        } else if (lowerMode.includes('bus')) {
            request.transitOptions = {
                modes: [maps.TransitMode?.BUS || 'BUS'],
                routingPreference: maps.TransitRoutePreference?.FEWER_TRANSFERS
            };
        }
    }

    return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                const route = result.routes[0];
                const steps = route.legs[0].steps;
                

                if (renderer && typeof renderer.setDirections === 'function') {
                    renderer.setDirections(result);
                }
                resolve(result);
            } else {
                reject(new Error(`Routing calculation failed: ${status}`));
            }
        });
    });
};

/**
 * Tactical Mode Resolver - Forces mode conventions based on transit type.
 */
export const getTransitConstants = () => {
    const maps = window.google?.maps;
    return {
        SUBWAY: maps?.TransitMode?.SUBWAY || 'SUBWAY',
        RAIL: maps?.TransitMode?.RAIL || 'RAIL',
        BUS: maps?.TransitMode?.BUS || 'BUS',
        FEWER_TRANSFERS: maps?.TransitRoutePreference?.FEWER_TRANSFERS || 'FEWER_TRANSFERS'
    };
};

/**
 * Accessor for core map constants to ensure zero direct window.google usage in UI components.
 */
export const getMapConstants = () => {
    const maps = window.google?.maps;
    return {
        CIRCLE: maps?.SymbolPath?.CIRCLE || 0,
        UNIT_METRIC: maps?.UnitSystem?.METRIC || 0,
        TRAVEL_DRIVING: maps?.TravelMode?.DRIVING || 'DRIVING'
    };
};
