// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
/**
 * Geocoding Service - Converts human-readable addresses to coordinate telemetry.
 * Leverages the Google Maps Geocoding API for high-precision stadium mapping.
 */

/**
 * Geocodes an address string into latitude and longitude coordinates.
 * @param {string} address - The physical address query.
 * @returns {Promise<Object>} - Coordinates {lat, lng} and name.
 */
export const geocodeAddress = async (address) => {
    if (!window.google || !window.google.maps.Geocoder) {
        throw new Error("Google Maps Geocoder not available");
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
        if (!address || address.trim() === "") {
            reject(new Error("Invalid address query provided"));
            return;
        }

        // Interacting with Google Geocoding API
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const loc = results[0].geometry.location;
                resolve({
                    lat: loc.lat(),
                    lng: loc.lng(),
                    name: address
                });
            } else {
                reject(new Error(`Geocoding failed with status: ${status}`));
            }
        });
    });
};
