/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import * as drawRouteUtil from '../utils/drawRoute';
import * as geocodeService from '../services/geocodeService';
import * as placesService from '../services/placesService';
import { STADIUM_LOCATIONS } from '../hooks/useMapLogic';

// Force global google mock for consistent function testing
global.window = global.window || {};
global.window.google = {
    maps: {
        Geocoder: function() {
            this.geocode = vi.fn();
        },
        places: {
            PlacesService: vi.fn()
        },
        DirectionsService: function() {
            this.route = (req, cb) => cb({ routes: [{ legs: [{ distance: { text: '1km' }, duration: { text: '5m' } }] }] }, 'OK');
        },
        TravelMode: { DRIVING: 'DRIVING' }
    }
};

describe('4. TOP-LEVEL FUNCTION LOGIC & SIGNATURES', () => {
  describe('drawRoute Logic', () => {
    it('Function exists and maintains an asynchronous execution contract', async () => {
      expect(drawRouteUtil.drawRoute).toBeDefined();
      // Test drawing route to verify Promise resolution
      const result = await drawRouteUtil.drawRoute(null, { lat: 13, lng: 80 }, { lat: 13.1, lng: 80.1 }, null);
      expect(result).toHaveProperty('routes');
    });

    it('getRouteConfig returns correct visual metadata', () => {
      const config = drawRouteUtil.getRouteConfig({ lat: 13, lng: 80 }, { lat: 13.1, lng: 80.1 }, 'food');
      expect(config.routeColor).toBe('#10B981');
    });
  });

  describe('Geocode & Places Service Availability', () => {
    it('geocodeAddress maintains an asynchronous signature', () => {
      expect(geocodeService.geocodeAddress).toBeInstanceOf(Function);
      const promise = geocodeService.geocodeAddress('Stadium');
      expect(promise).toBeInstanceOf(Promise);
      promise.catch(() => {}); 
    });

    it('getNearbyTransport provides fallback data in disconnected environments', async () => {
      const transport = await placesService.getNearbyTransport({ lat: 13, lng: 80 });
      expect(Array.isArray(transport)).toBe(true);
      expect(transport.length).toBeGreaterThan(0);
    });
  });
});
