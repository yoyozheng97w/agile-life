import type { StateCreator } from 'zustand';
import type { AppStore } from '../appStore';
import { DEFAULT_SETTINGS, type Settings } from '../../types';

export interface SettingsSlice {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

export const createSettingsSlice: StateCreator<
  AppStore,
  [['zustand/persist', unknown]],
  [],
  SettingsSlice
> = (set) => ({
  settings: DEFAULT_SETTINGS,
  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),
});
