/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMapLogic } from './useMapLogic';
import { renderHook, act } from '@testing-library/react';
import * as services from '../services';

// Mock Services
vi.mock('../services', () => ({
  drawRoute: vi.fn(),
  geocodeAddress: vi.fn(),
  getNearbyTransport: vi.fn(),
  getTravelTimes: vi.fn()
}));

// Mock Utils
vi.mock('../utils', () => ({
  getRouteConfig: vi.fn((origin, target, type) => ({
    origin,
    destination: target,
    waypoints: [],
    routeColor: '#10B981'
  }))
}));

describe('useMapLogic Hook (Advanced)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default stadium location', () => {
    const { result } = renderHook(() => useMapLogic());
    expect(result.current.markers).toHaveLength(1);
    expect(result.current.markers[0].title).toBe("Your Location");
  });

  it('should orchestrate routing and handle service successes', async () => {
    services.drawRoute.mockResolvedValue({ status: 'OK' });
    const { result } = renderHook(() => useMapLogic());
    
    const target = { lat: 13.1, lng: 80.1, name: 'Target Point' };
    
    await act(async () => {
      await result.current.drawRoute(target, 'general');
    });

    expect(services.drawRoute).toHaveBeenCalled();
    expect(result.current.destination).toEqual(target);
    expect(result.current.markers).toHaveLength(2);
  });

  it('should integrate geocoding for address-based routing', async () => {
    const mockLoc = { lat: 13.2, lng: 80.2, name: 'Anna Nagar' };
    services.geocodeAddress.mockResolvedValue(mockLoc);
    services.drawRoute.mockResolvedValue({ status: 'OK' });

    const { result } = renderHook(() => useMapLogic());
    
    let routeResult;
    await act(async () => {
      routeResult = await result.current.calculateAddressRoute('Anna Nagar');
    });

    expect(routeResult.success).toBe(true);
    expect(routeResult.loc).toEqual(mockLoc);
    expect(services.geocodeAddress).toHaveBeenCalledWith('Anna Nagar');
  });

  it('should handle transport telemetry batches and calculate ETAs', async () => {
    const mockTransports = [
      { id: 'm1', type: 'Metro', lat: 13, lng: 80 },
      { id: 'b1', type: 'Bus', lat: 13.1, lng: 80.1 }
    ];
    services.getNearbyTransport.mockResolvedValue(mockTransports);
    services.getTravelTimes.mockResolvedValue([
      { duration: '5 mins', distance: '1 km' },
      { duration: '12 mins', distance: '3 km' }
    ]);

    const { result } = renderHook(() => useMapLogic());
    
    let transportResult;
    await act(async () => {
      transportResult = await result.current.fetchTransitOptions();
    });

    expect(transportResult).toHaveLength(2);
    expect(transportResult[0].travelTime).toBe('5 mins');
    expect(transportResult[1].travelDistance).toBe('3 km');
  });

  it('should clear all telemetry state mapping points', async () => {
    const { result } = renderHook(() => useMapLogic());
    
    await act(async () => {
      await result.current.drawRoute({ lat: 1, lng: 1 }, 'general');
    });
    
    expect(result.current.destination).not.toBeNull();

    act(() => {
      result.current.clearRoutes();
    });

    expect(result.current.destination).toBeNull();
    expect(result.current.markers).toHaveLength(1);
  });
});
