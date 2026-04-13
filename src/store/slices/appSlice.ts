import { StateCreator } from 'zustand';

export interface AppSlice {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const createAppSlice: StateCreator<AppSlice> = (set) => ({
  darkMode: false,
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    document.documentElement.classList.toggle('dark', next);
    return { darkMode: next };
  }),
});
