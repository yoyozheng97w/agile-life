import type { StateCreator } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { AppStore } from '../appStore';
import type { Points, Ticket, TicketStatus } from '../../types';

export interface TicketsSlice {
  tickets: Ticket[];
  addTicket: (input: {
    title: string;
    description?: string;
    points: Points;
    sprintId: string;
    status?: TicketStatus;
    carriedFromSprintId?: string;
  }) => Ticket;
  updateTicket: (
    id: string,
    partial: Partial<Omit<Ticket, 'id' | 'createdAt'>>
  ) => void;
  deleteTicket: (id: string) => void;
  moveTicket: (id: string, status: TicketStatus) => void;
}

export const createTicketsSlice: StateCreator<
  AppStore,
  [['zustand/persist', unknown]],
  [],
  TicketsSlice
> = (set) => ({
  tickets: [],
  addTicket: ({
    title,
    description,
    points,
    sprintId,
    status = 'todo',
    carriedFromSprintId,
  }) => {
    const ticket: Ticket = {
      id: uuid(),
      title,
      description,
      points,
      status,
      sprintId,
      createdAt: new Date().toISOString(),
      carriedFromSprintId,
    };
    set((state) => ({ tickets: [...state.tickets, ticket] }));
    return ticket;
  },
  updateTicket: (id, partial) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, ...partial } : t
      ),
    })),
  deleteTicket: (id) =>
    set((state) => ({ tickets: state.tickets.filter((t) => t.id !== id) })),
  moveTicket: (id, status) =>
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id !== id) return t;
        const next: Ticket = { ...t, status };
        if (status === 'done' && !t.completedAt) {
          next.completedAt = new Date().toISOString();
        }
        return next;
      }),
    })),
});
