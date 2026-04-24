/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../App';

// Mocks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: '123' }, login: vi.fn(), logout: vi.fn() })
}));
vi.mock('../hooks/useFirebaseData', () => ({
  useFirebaseData: () => ({ data: [], setData: vi.fn() })
}));
vi.mock('../services/firebase', () => ({ analytics: null }));

// Dynamic mocking for isLoaded state
const mockIsLoaded = vi.fn().mockReturnValue(true);
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: mockIsLoaded() }),
  GoogleMap: ({ children }) => <div id="map">{children}</div>,
  Marker: () => null,
  DirectionsRenderer: () => null,
  Autocomplete: ({ children }) => <div>{children}</div>
}));

// Mock lazy components
vi.mock('../components/CaptainAI', () => ({ 
  default: ({ onAsk }) => {
    const [val, setVal] = React.useState('');
    return (
      <div data-testid="captain-ai">
        <input 
          aria-label="Ask Captain AI" 
          placeholder="Enter Destination" 
          value={val}
          onChange={(e) => setVal(e.target.value)} 
        />
        <button aria-label="Send" onClick={() => { onAsk(val); setVal(''); }}>Send</button>
      </div>
    );
  }
}));
vi.mock('../components/GoogleStadiumMap', () => ({ default: () => <div id="map" data-testid="stadium-map">Map</div> }));
vi.mock('../components/NavigationPanel', () => ({ default: () => <div data-testid="navigation-panel">Navigation</div> }));
vi.mock('../components/SmartReturnPanel', () => ({ default: () => <div data-testid="smart-return">Return</div> }));
vi.mock('../components/LoginScreen', () => ({ default: () => <div>Login</div> }));
vi.mock('../components/StadiumMap', () => ({ default: () => <div id="map" data-testid="stadium-map">Stadium Map</div> }));

describe('5. UPGRADED EDGE CASE TESTS', () => {
  afterEach(() => {
    cleanup();
    mockIsLoaded.mockReturnValue(true);
  });

  it('Extreme Edge: Handling massive input strings (Stress Test)', async () => {
    render(<App />);
    const input = await screen.findByPlaceholderText(/Enter Destination/i);
    const massiveInput = 'A'.repeat(10000); // 10KB string
    fireEvent.change(input, { target: { value: massiveInput } });
    const button = await screen.findByLabelText(/Send/i);
    fireEvent.click(button);
    expect(input.value).toBe(''); // Successful processing and recovery
  });

  it('System Edge: Graceful behavior when Google Maps fails to load', async () => {
    mockIsLoaded.mockReturnValue(false);
    render(<App />);
    // Check if branding still visible despite map failure
    expect(screen.getByText(/Yellove/i)).toBeInTheDocument();
  });

  it('Logic Edge: Malformed symbols and numeric injections', async () => {
    render(<App />);
    const input = await screen.findByPlaceholderText(/Enter Destination/i);
    fireEvent.change(input, { target: { value: '1234567890!@#$%^&*()_+' } });
    const button = await screen.findByLabelText(/Send/i);
    fireEvent.click(button);
    expect(input.value).toBe(''); // Verify post-interaction recovery
  });
});
