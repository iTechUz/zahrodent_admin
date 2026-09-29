import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store/useStore';
import { resetStore } from '@/test/resetStore';

describe('appSlice', () => {
  beforeEach(resetStore);

  it('starts in light mode', () => {
    expect(useStore.getState().darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleDarkMode turns dark mode on and adds the html class', () => {
    useStore.getState().toggleDarkMode();
    expect(useStore.getState().darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggling twice returns to light mode and removes the class', () => {
    useStore.getState().toggleDarkMode();
    useStore.getState().toggleDarkMode();
    expect(useStore.getState().darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('syncs the class to state even if the DOM was changed externally', () => {
    document.documentElement.classList.add('dark');
    useStore.getState().toggleDarkMode(); // false -> true
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    useStore.getState().toggleDarkMode(); // true -> false
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
