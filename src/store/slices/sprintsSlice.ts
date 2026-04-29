import type { StateCreator } from 'zustand';
import { v4 as uuid } from 'uuid';
import { addDays, format, parseISO } from 'date-fns';
import type { AppStore } from '../appStore';
import type { Sprint } from '../../types';

export interface SprintsSlice {
  sprints: Sprint[];
  createDraftSprint: (input: {
    startDate: string;
    lengthDays: number;
  }) => Sprint;
  startSprint: (sprintId: string, plannedPoints: number) => void;
  updateSprint: (sprintId: string, partial: Partial<Sprint>) => void;
  deleteSprint: (sprintId: string) => void;
}

export const createSprintsSlice: StateCreator<
  AppStore,
  [['zustand/persist', unknown]],
  [],
  SprintsSlice
> = (set, get) => ({
  sprints: [],
  createDraftSprint: ({ startDate, lengthDays }) => {
    const existing = get().sprints;
    const number = existing.length + 1;
    const endDate = format(
      addDays(parseISO(startDate), Math.max(1, lengthDays) - 1),
      'yyyy-MM-dd'
    );
    const sprint: Sprint = {
      id: uuid(),
      number,
      startDate,
      endDate,
      status: 'planning',
      plannedPoints: 0,
      completedPoints: 0,
    };
    set({ sprints: [...existing, sprint] });
    return sprint;
  },
  startSprint: (sprintId, plannedPoints) =>
    set((state) => ({
      sprints: state.sprints.map((s) =>
        s.id === sprintId
          ? { ...s, status: 'active' as const, plannedPoints }
          : s
      ),
    })),
  updateSprint: (sprintId, partial) =>
    set((state) => ({
      sprints: state.sprints.map((s) =>
        s.id === sprintId ? { ...s, ...partial } : s
      ),
    })),
  deleteSprint: (sprintId) =>
    set((state) => ({
      sprints: state.sprints.filter((s) => s.id !== sprintId),
    })),
});
