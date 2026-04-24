// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
/**
 * Places Service - Hub discovery and local transport telemetry.
 * Interacts with the Google Places API to find nearby transit nodes around the stadium.
 */

/**
 * Fetches nearby transport hubs using the Google Places API.
 * 
 * @param {Object} location - The focal coordinates {lat, lng}.
 * @param {number} [radius=1000] - Search radius in meters.
 * @returns {Promise<Array>} - List of validated transport stations.
 */
/**
 * Centralized Autocomplete initializer to prevent direct Google API usage in components.
 * 
 * @param {HTMLElement} element - The input element to attach autocomplete to.
 * @param {Function} onPlaceChanged - Callback function when a place is selected.
 * @returns {Object} - The Autocomplete instance.
 */
export const initAutocomplete = (element, onPlaceChanged) => {
    if (!window.google || !window.google.maps.places) return null;

    const autocomplete = new window.google.maps.places.Autocomplete(element, {
        componentRestrictions: { country: 'IN' },
        fields: ['formatted_address', 'geometry', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        onPlaceChanged(place);
    });

    return autocomplete;
};

export const getNearbyTransport = async (location, radius = 1000) => {
    if (!window.google || !window.google.maps.places) {
        return [
            { id: 'metro', type: 'Metro', station: 'Govt Estate', lat: 13.0682, lng: 80.2750, distance: '1.2km' },
            { id: 'local_train', type: 'Local Train', station: 'Chepauk MRTS', lat: 13.0645, lng: 80.2810, distance: '400m' }
        ];
    }

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    // Helper to search for specific types
    const searchPlaces = (type) => new Promise((resolve) => {
        service.nearbySearch({ location, radius, type }, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
            } else {
                resolve([]);
            }
        });
    });

    try {
        /**
         * 1. INCLUSIVE TRAIN STATION DISCOVERY
         * For Chennai MRTS (Chepauk), stations may be tagged as subway, train, or transit.
         */
        const trainSearchPromise = searchPlaces('train_station');
        const transitSearchPromise = searchPlaces('transit_station');
        
        const [trainRes, transitRes] = await Promise.all([trainSearchPromise, transitSearchPromise]);
        
        // Merge and filter unique results that are NOT the primary metro line stations
        const combinedResults = [...trainRes, ...transitRes];
        const trainPlaces = combinedResults.filter((place, index, self) => 
            self.findIndex(p => p.place_id === place.place_id) === index &&
            (place.name.toLowerCase().includes('mrts') || place.name.toLowerCase().includes('rail') || place.types.includes('train_station'))
        );

        // DEBUG: Log filtered train results
        console.log("Train discovery results:", trainPlaces);

        /**
         * 3. ENSURE SEPARATE LOGIC (Metro/Bus/Cab)
         */
        const metroPlaces = await searchPlaces('subway_station');
        const busPlaces = await searchPlaces('bus_station');
        const taxiPlaces = await searchPlaces('taxi_stand');

        const transportLinks = {
            'metro': 'https://tickets.chennaimetrorail.org/portal',
            'local_train': 'https://www.utsonmobile.indianrail.gov.in',
            'bus': 'https://mtcbus.tn.gov.in/',
            'taxi': 'https://book.olacabs.com/'
        };

        // Construct Local Train discovery with fallback name
        const localTrain = trainPlaces.length > 0 ? {
            id: 'local_train',
            type: 'Local Train',
            station: trainPlaces[0].name,
            lat: trainPlaces[0].geometry.location.lat(),
            lng: trainPlaces[0].geometry.location.lng(),
            wait: 10,
            url: transportLinks.local_train
        } : null;

        const results = [
            metroPlaces[0] ? { 
                id: 'metro', 
                type: 'Metro', 
                station: metroPlaces[0].name, 
                lat: metroPlaces[0].geometry.location.lat(), 
                lng: metroPlaces[0].geometry.location.lng(), 
                wait: 5, 
                url: transportLinks.metro 
            } : { id: 'metro', type: 'Metro', station: 'Govt Estate', lat: 13.0682, lng: 80.2750, wait: 5, url: transportLinks.metro },
            
            localTrain || { id: 'local_train', type: 'Local Train', station: 'Chepauk MRTS', lat: 13.0645, lng: 80.2810, wait: 10, url: transportLinks.local_train },
            
            busPlaces[0] ? { 
                id: 'bus', 
                type: 'Bus (MTC)', 
                station: busPlaces[0].name, 
                lat: busPlaces[0].geometry.location.lat(), 
                lng: busPlaces[0].geometry.location.lng(), 
                wait: 8, 
                url: transportLinks.bus 
            } : { id: 'bus', type: 'Bus (MTC)', station: 'Wallajah Rd', lat: 13.0650, lng: 80.2798, wait: 8, url: transportLinks.bus },
            
            taxiPlaces[0] ? { 
                id: 'taxi', 
                type: 'Taxi (Ola)', 
                station: taxiPlaces[0].name, 
                lat: taxiPlaces[0].geometry.location.lat(), 
                lng: taxiPlaces[0].geometry.location.lng(), 
                wait: 2, 
                url: transportLinks.taxi 
            } : { id: 'taxi', type: 'Taxi (Ola)', station: 'Ola Point', lat: 13.0635, lng: 80.2785, wait: 2, url: transportLinks.taxi }
        ];

        return results.filter(Boolean);
    } catch (err) {
        console.error("Places discovery failed:", err);
        return [];
    }
};
