export type SprintStatus = 'planning' | 'active' | 'completed';

export type TicketStatus = 'todo' | 'doing' | 'blocking' | 'done';

export type Points = 1 | 2 | 3 | 5 | 8 | 13 | 21;

export const FIBONACCI_POINTS: readonly Points[] = [1, 2, 3, 5, 8, 13, 21];

export interface Settings {
  sprintLengthDays: number;
  standupTime: string;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sprintLengthDays: 14,
  standupTime: '09:30',
  notificationsEnabled: false,
};

export interface Sprint {
  id: string;
  number: number;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  plannedPoints: number;
  completedPoints: number;
  goal?: string;
  retrospective?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  points: Points;
  status: TicketStatus;
  sprintId: string;
  createdAt: string;
  completedAt?: string;
  carriedFromSprintId?: string;
}

export const PERSIST_KEY = 'agile-life-app/v1';
export const PERSIST_VERSION = 1;
