import { create } from 'zustand';
import { createAppSlice, type AppSlice } from './appSlice';

describe('appSlice', () => {
  afterEach(() => document.documentElement.classList.remove('dark'));

  it('starts in light mode', () => {
    expect(create<AppSlice>()(createAppSlice).getState().darkMode).toBe(false);
  });

  it('toggleDarkMode flips the flag and the <html class="dark">', () => {
    const store = create<AppSlice>()(createAppSlice);
    store.getState().toggleDarkMode();
    expect(store.getState().darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    store.getState().toggleDarkMode();
    expect(store.getState().darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
