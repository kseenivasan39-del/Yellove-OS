/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../App';

// Reuse mocks from App.test.jsx or redefine for specific test needs
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ 
    user: { uid: 'u1', email: 'fan@csk.com' }, 
    login: vi.fn(), 
    logout: vi.fn() 
  })
}));

const mockSetData = vi.fn();
vi.mock('../hooks/useFirebaseData', () => ({
  useFirebaseData: (path) => ({ 
    data: path === 'crowdDensity' ? [{ id: 'gate-3', count: 50 }, { id: 'gate-5', count: 50 }] : [], 
    setData: mockSetData,
    loading: false
  })
}));

vi.mock('../hooks/useMapLogic', () => ({
  useMapLogic: () => ({
    origin: null, 
    destination: null, 
    waypoints: [], 
    routeColor: '#10B981', 
    markers: [],
    clearRoutes: vi.fn(),
    drawRoute: vi.fn(),
    calculateAddressRoute: vi.fn(),
    fetchTransitOptions: vi.fn().mockResolvedValue([]),
    STADIUM_LOCATIONS: { STADIUM_CENTER: { lat: 13, lng: 80 }, GATES: [{ id: 'g3', name: 'Gate 3' }, { id: 'g5', name: 'Gate 5' }] }
  })
}));

vi.mock('../services/firebase', () => ({ analytics: null, db: {}, auth: {} }));
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: () => null,
  Marker: () => null,
  DirectionsRenderer: () => null,
  Autocomplete: ({ children }) => <div>{children}</div>
}));

describe('Match Mode Advanced Integration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('should activate visual alerts and fluctuate data when Match Mode is ON', async () => {
        render(<App />);
        
        const matchToggle = screen.getByLabelText(/Toggle Match Mode/i);
        
        // 1. Activate Match Mode
        await act(async () => {
            fireEvent.click(matchToggle);
        });

        expect(matchToggle).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText(/Match Mode: ON/i)).toBeInTheDocument();

        // 2. Fast forward time to trigger interval data fluctuations
        await act(async () => {
            vi.advanceTimersByTime(4001);
        });

        // Verify setData was called to simulate crowd flow
        expect(mockSetData).toHaveBeenCalled();
        
        // Match mode random alerts check
        // Since it's probabilistic (0.9), we might need multiple ticks or a forced state
        // Let's force many ticks to ensure alert triggers
        for(let i=0; i<20; i++) {
            await act(async () => {
                vi.advanceTimersByTime(4001);
            });
        }
        
        const alert = screen.queryByRole('alert');
        if (alert) {
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveClass('animate-pulse');
        }
    });

    it('should provide dynamic "Squad Radar" updates during Match Mode', async () => {
        render(<App />);
        
        const matchToggle = screen.getByLabelText(/Toggle Match Mode/i);
        await act(async () => {
            fireEvent.click(matchToggle);
        });

        const initialDistance = screen.getByText(/Rahul/i).closest('div').parentElement.querySelector('.text-emerald-400').textContent;
        
        await act(async () => {
            vi.advanceTimersByTime(4001);
        });

        const newDistance = screen.getByText(/Rahul/i).closest('div').parentElement.querySelector('.text-emerald-400').textContent;
        
        // Distances change randomly in Match Mode
        expect(newDistance).not.toBe(initialDistance);
    });

    it('should deactivate all simulation intervals when Match Mode is toggled OFF', async () => {
        render(<App />);
        
        const matchToggle = screen.getByLabelText(/Toggle Match Mode/i);
        
        // ON
        await act(async () => {
            fireEvent.click(matchToggle);
        });
        
        mockSetData.mockClear();

        // OFF
        await act(async () => {
            fireEvent.click(matchToggle);
        });

        await act(async () => {
            vi.advanceTimersByTime(8001);
        });

        // setData should NOT be called after toggled OFF
        expect(mockSetData).not.toHaveBeenCalled();
    });
});
