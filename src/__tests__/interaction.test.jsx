/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../App';

// Comprehensive Mocks
const mockDrawRoute = vi.fn().mockResolvedValue(true);
const mockProcessQuery = vi.fn().mockResolvedValue("AI Thinking Result");

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: '123', displayName: 'MS Dhoni' }, login: vi.fn(), logout: vi.fn() })
}));

vi.mock('../hooks/useFirebaseData', () => ({
  useFirebaseData: (path) => ({ 
    data: path === 'queueTimes' ? [{ id: 'f1', name: 'Cafe', wait: 5, type: 'food' }] : [], 
    setData: vi.fn() 
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
    drawRoute: mockDrawRoute,
    calculateAddressRoute: vi.fn(),
    fetchTransitOptions: vi.fn().mockResolvedValue([]),
    STADIUM_LOCATIONS: { STADIUM_CENTER: { lat: 13, lng: 80 }, FOOD: { lat: 13, lng: 80 } }
  })
}));

vi.mock('../services/geminiService', () => ({
  geminiService: { processQuery: mockProcessQuery }
}));

vi.mock('../services/firebase', () => ({ analytics: null }));
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: () => null,
  Marker: () => null,
  DirectionsRenderer: () => null,
  Autocomplete: ({ children }) => <div>{children}</div>
}));

describe('Yellove OS Interaction Flows (Advanced)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('Orchestration: Assistant Query -> Routing Action -> AI Response', async () => {
    render(<App />);
    
    // 1. Locate Assistant components
    const input = await screen.findByPlaceholderText(/Ask Captain/i);
    const sendBtn = await screen.findByRole('button', { name: /Submit/i || /paper-plane/i });
    
    // 2. Trigger "Food" query
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Where is food?' } });
      fireEvent.click(screen.getByRole('button', { name: /Submit/i || /paper-plane/i }));
    });

    // 3. Verify tactical routing was triggered immediately
    expect(mockDrawRoute).toHaveBeenCalled();
    
    // 4. Verify Gemini was called for conversational layer
    expect(mockProcessQuery).toHaveBeenCalledWith(expect.stringContaining('food'), expect.anything());
    
    // 5. Verify the response appears in chat
    const aiResponse = await screen.findByText(/AI Thinking Result/i);
    expect(aiResponse).toBeInTheDocument();
  });

  it('Logistics: Triggering Quick Actions from the Hub', async () => {
    render(<App />);
    
    const foodActionBtn = screen.getByLabelText(/Find fastest food/i);
    
    await act(async () => {
      fireEvent.click(foodActionBtn);
    });

    // Strategy: Food button should trigger immediate drawRoute to STADIUM_LOCATIONS.FOOD
    expect(mockDrawRoute).toHaveBeenCalledWith(expect.anything(), 'food');
  });

  it('Navigation: Opening and closing the Precision Routing system', async () => {
    const { container } = render(<App />);
    
    // Open
    const navBtn = screen.getByLabelText(/Open Navigation System/i);
    fireEvent.click(navBtn);
    
    expect(screen.getByText(/Precision Routing/i)).toBeInTheDocument();

    // Close
    const closeBtn = screen.getByLabelText(/Close/i);
    fireEvent.click(closeBtn);
    
    expect(screen.queryByText(/Precision Routing/i)).not.toBeInTheDocument();
  });
});
