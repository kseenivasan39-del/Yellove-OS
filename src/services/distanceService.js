// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
/**
 * Distance Matrix Service - Mass travel-time synchronization.
 * Leverages Google Maps Distance Matrix API for high-throughput ETA calculations.
 */

/**
 * Calculates real-time travel times from an origin to multiple destinations.
 * 
 * @param {Object} origin - The starting coordinates {lat, lng}.
 * @param {Array<Object>} destinations - Array of target coordinates.
 * @returns {Promise<Array>} - Resolved distance/duration metrics for each pair.
 */
export const getTravelTimes = (origin, destinations) => {
    return new Promise((resolve) => {
        if (!window.google || !window.google.maps.DistanceMatrixService) {
            console.warn("Distance Matrix API unavailable - skipping telemetry sync");
            return resolve([]);
        }

        const service = new window.google.maps.DistanceMatrixService();
        
        // Execute Batch Distance Matrix Request
        service.getDistanceMatrix(
            {
                origins: [origin],
                destinations: destinations,
                travelMode: window.google.maps.TravelMode.DRIVING,
                unitSystem: window.google.maps.UnitSystem.METRIC,
            },
            (response, status) => {
                if (status === 'OK' && response?.rows[0]) {
                    const metrics = response.rows[0].elements.map((element) => ({
                        duration: element.status === 'OK' ? element.duration.text : 'N/A',
                        distance: element.status === 'OK' ? element.distance.text : 'N/A',
                        status: element.status
                    }));
                    resolve(metrics);
                } else {
                    console.error("Distance Matrix telemetry failed status:", status);
                    resolve([]);
                }
            }
        );
    });
};
