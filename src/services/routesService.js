// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
/**
 * Routes Service - Core pathfinding logic using Google Routes API (v2).
 * Optimized for compute-intensive routing tasks including multi-modal transit legs.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Executes a path calculation request to the Google Routes API.
 */
export const getRoute = async (origin, destination, mode, _options = null) => {
    let routingMode = 'DRIVE';
    const lowerMode = String(mode || '').toLowerCase();

    if (lowerMode.includes('transit') || lowerMode.includes('metro') || lowerMode.includes('bus') || lowerMode.includes('train')) {
        routingMode = 'TRANSIT';
    } else if (lowerMode.includes('walk')) {
        routingMode = 'WALK';
    } else if (lowerMode.includes('drive') || lowerMode.includes('taxi') || lowerMode.includes('cab')) {
        routingMode = 'DRIVE';
    } else if (lowerMode.includes('bike')) {
        routingMode = 'BICYCLE';
    }

    const start = {
        location: {
            latLng: {
                latitude: typeof origin.lat === 'function' ? origin.lat() : origin.lat,
                longitude: typeof origin.lng === 'function' ? origin.lng() : origin.lng
            }
        }
    };

    const end = {
        location: {
            latLng: {
                latitude: typeof destination.lat === 'function' ? destination.lat() : destination.lat,
                longitude: typeof destination.lng === 'function' ? destination.lng() : destination.lng
            }
        }
    };

    /**
     * Requirement: Multi-modal fallback.
     * We don't restrict to a single mode here if the intent is "Train" to allow the API to return the best transit combo.
     */
    let transitPreferences = null;
    if (routingMode === 'TRANSIT') {
        const allowed = [];
        
        // If it's a specific metro/bus request, we can restrict. 
        // For 'Train', we allow any mode to ensure a result is returned.
        if (lowerMode.includes('metro')) {
            allowed.push("SUBWAY");
        } else if (lowerMode.includes('bus')) {
            allowed.push("BUS");
        } else if (lowerMode.includes('train')) {
            // No restriction for train to ensure suburban/MRTS fallback
        }

        if (allowed.length > 0) {
            transitPreferences = { allowedTravelModes: allowed };
        }
    }

    try {
        const fetchBody = {
            origin: start,
            destination: end,
            travelMode: routingMode,
            computeAlternativeRoutes: false,
            routeModifiers: {
                avoidTolls: false,
                avoidHighways: false,
                avoidFerries: false
            },
            languageCode: "en-US",
            units: "METRIC"
        };

        if (routingMode === 'TRANSIT' && transitPreferences) {
            fetchBody.transitPreferences = transitPreferences;
        }

        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
            },
            body: JSON.stringify(fetchBody)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Routes API Error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            throw new Error("No routes found by Routes API");
        }

        const route = data.routes[0];
        const durationSeconds = parseInt(route.duration?.replace('s', '') || '0');
        const distanceKm = (route.distanceMeters / 1000).toFixed(1);

        return {
            routes: [{
                overview_polyline: { points: route.polyline.encodedPolyline },
                legs: [{
                    distance: { text: `${distanceKm} km`, value: route.distanceMeters || 0 },
                    duration: { text: `${Math.round(durationSeconds / 60)} mins`, value: durationSeconds },
                    steps: [],
                    start_location: origin,
                    end_location: destination
                }],
                bounds: null,
                copyrights: "Map data ©2024 Google",
                warnings: [],
                waypoint_order: []
            }],
            status: 'OK',
            request: { origin, destination, travelMode: routingMode }
        };
    } catch (error) {
        console.warn("Routes API execution halted:", error.message);
        throw error;
    }
};
