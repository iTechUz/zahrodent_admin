import { useStore } from '@/store/useStore';

/**
 * Restore the global Zustand store to its pristine initial state
 * (replace = true drops any keys added during a test).
 */
export const resetStore = () => {
  useStore.setState(useStore.getInitialState(), true);
  document.documentElement.classList.remove('dark');
};
