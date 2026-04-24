import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawRoute } from '../services/navigationService';
import * as routesService from '../services/routesService';

// Mock Routes API (v2)
vi.mock('../services/routesService', () => ({
  getRoute: vi.fn()
}));

// Mock Google Maps Global
const mockDirectionsService = {
  route: vi.fn()
};

global.window = {
  google: {
    maps: {
      DirectionsService: vi.fn(function() { return mockDirectionsService; }),
      TravelMode: {
        DRIVING: 'DRIVING',
        TRANSIT: 'TRANSIT',
        WALKING: 'WALKING'
      },
      TransitMode: {
        RAIL: 'RAIL',
        SUBWAY: 'SUBWAY',
        BUS: 'BUS'
      },
      TransitRoutePreference: {
        FEWER_TRANSFERS: 'FEWER_TRANSFERS'
      }
    }
  }
};

describe('Navigation Service Cascading Logic (Advanced)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should prioritize Routes API (v2) for non-transit driving requests', async () => {
        const mockResult = { routes: [{ legs: [{ steps: [] }] }], status: 'OK' };
        routesService.getRoute.mockResolvedValue(mockResult);

        const result = await drawRoute(null, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }, null, 'DRIVING');

        expect(routesService.getRoute).toHaveBeenCalled();
        expect(mockDirectionsService.route).not.toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should fallback to Directions API (v1) if Routes API (v2) fails', async () => {
        routesService.getRoute.mockRejectedValue(new Error("API Limit"));
        mockDirectionsService.route.mockImplementation((req, cb) => {
            cb({ routes: [{ legs: [{ steps: [] }] }] }, 'OK');
        });

        const result = await drawRoute(null, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }, null, 'DRIVING');

        expect(routesService.getRoute).toHaveBeenCalled();
        expect(mockDirectionsService.route).toHaveBeenCalled();
        expect(result.status).toBeUndefined(); // Result was resolved from CB
    });

    it('should force Directions API (v1) for ALL transit intents', async () => {
        mockDirectionsService.route.mockImplementation((req, cb) => {
            cb({ routes: [{ legs: [{ steps: [] }] }] }, 'OK');
        });

        await drawRoute(null, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }, null, 'TRANSIT');

        expect(routesService.getRoute).not.toHaveBeenCalled();
        expect(mockDirectionsService.route).toHaveBeenCalled();
        expect(mockDirectionsService.route.mock.calls[0][0].travelMode).toBe('TRANSIT');
    });

    it('should correctly normalize "metro" intent to SUBWAY transit mode', async () => {
        mockDirectionsService.route.mockImplementation((req, cb) => {
            cb({ routes: [{ legs: [{ steps: [] }] }] }, 'OK');
        });

        await drawRoute(null, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }, null, 'metro');

        const request = mockDirectionsService.route.mock.calls[0][0];
        expect(request.travelMode).toBe('TRANSIT');
        expect(request.transitOptions.modes).toContain('SUBWAY');
    });

    it('should handle terminal routing failures gracefully', async () => {
        routesService.getRoute.mockRejectedValue(new Error("Fail 1"));
        mockDirectionsService.route.mockImplementation((req, cb) => {
            cb(null, 'ZERO_RESULTS');
        });

        await expect(drawRoute(null, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }, null, 'DRIVING'))
            .rejects.toThrow('Routing calculation failed');
    });
});
