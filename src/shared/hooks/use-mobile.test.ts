import { act, renderHook } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

function setWidth(w: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w });
}

describe('useIsMobile', () => {
  const originalMatchMedia = window.matchMedia;
  const originalWidth = window.innerWidth;
  let listeners: Array<() => void> = [];

  beforeEach(() => {
    listeners = [];
    window.matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: (_: string, cb: () => void) => {
        listeners = listeners.filter((l) => l !== cb);
      },
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    setWidth(originalWidth);
  });

  it('is true below 768px and queries max-width 767px', () => {
    setWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('is false at 768px and above', () => {
    setWidth(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates on media-query change and unsubscribes on unmount', () => {
    setWidth(1200);
    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    setWidth(400);
    act(() => listeners.forEach((l) => l()));
    expect(result.current).toBe(true);
    unmount();
    expect(listeners).toHaveLength(0);
  });
});
