import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // Auth
      token: null,
      user:  null,
      setAuth:  (token, user) => set({ token, user }),
      logout:   () => set({ token: null, user: null }),

      // Theme
      darkMode: true,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      // Filters (dashboard)
      filters: {},
      setFilters: (filters) => set({ filters }),

      // Selected leads for bulk ops
      selectedLeads: [],
      setSelectedLeads: (selectedLeads) => set({ selectedLeads }),

      // Active view: 'table' | 'map'
      view: 'table',
      setView: (view) => set({ view }),
    }),
    {
      name: 'leadscout-store',
      partialize: s => ({ token: s.token, user: s.user, darkMode: s.darkMode }),
    }
  )
);

export default useStore;
