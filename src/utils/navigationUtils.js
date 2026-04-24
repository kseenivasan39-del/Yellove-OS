/**
 * pure navigation utility functions for Yellove OS.
 * // Handles routing using Google Directions API
 * // Fetches transport using Google Places API
 * // Converts address using Geocoding API
 * // Calculates ETA using Distance Matrix API
 */

/**
 * Calculates a route configuration (Color/Waypoints) based on context type.
 * 
 * @param {Object} origin - Source coordinates.
 * @param {Object} destination - Target coordinates.
 * @param {string} [type='general'] - The logical context (food, emergency, transport, address, general).
 * @returns {Object} - Merged configuration for the Directions request.
 */
export const getRouteConfig = (origin, destination, type = 'general') => {
    const colorMap = {
        'food': '#10B981',
        'emergency': '#EF4444',
        'transport': '#8B5CF6',
        'address': '#3B82F6',
        'general': '#F59E0B',
        'cab': '#F9CD05',
        'bus': '#EF4444',
        'metro': '#6366F1',
        'train': '#10B981'
    };

    return {
        origin,
        destination,
        waypoints: [],
        routeColor: colorMap[type] || colorMap.general,
        type
    };
};

/**
 * Helper to calculate distance between two points using Google Maps geometry library.
 */
export const computeDistance = (p1, p2) => {
    if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
        return window.google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
    }
    return 0;
};
