import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PERSIST_KEY, PERSIST_VERSION } from '../types';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import { createSprintsSlice, type SprintsSlice } from './slices/sprintsSlice';
import { createTicketsSlice, type TicketsSlice } from './slices/ticketsSlice';

export interface AppStoreExtended {
  deleteSprintAndTickets: (sprintId: string) => void;
}

export type AppStore = SettingsSlice & SprintsSlice & TicketsSlice & AppStoreExtended;

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createSettingsSlice(...a),
      ...createSprintsSlice(...a),
      ...createTicketsSlice(...a),
      deleteSprintAndTickets: (sprintId) =>
        a[0]((state) => ({
          sprints: state.sprints.filter((s) => s.id !== sprintId),
          tickets: state.tickets.filter((t) => t.sprintId !== sprintId),
        })),
    }),
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        sprints: state.sprints,
        tickets: state.tickets,
      }),
    }
  )
);

export const selectActiveSprint = (state: AppStore) =>
  state.sprints.find((s) => s.status === 'active');

export const selectDraftSprint = (state: AppStore) =>
  state.sprints.find((s) => s.status === 'planning');

export const selectCompletedSprints = (state: AppStore) =>
  state.sprints
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.number - b.number);

export const selectTicketsForSprint = (sprintId: string) => (state: AppStore) =>
  state.tickets.filter((t) => t.sprintId === sprintId);
