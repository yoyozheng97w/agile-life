import { v4 as uuid } from 'uuid';
import { useAppStore } from '../store/appStore';
import type { Sprint } from '../types';

export function closeAndCarryOver(sprintId: string) {
  const store = useAppStore.getState();
  const { sprints, tickets, updateSprint, addTicket } = store;

  const sprint = sprints.find((s) => s.id === sprintId);
  if (!sprint) return;

  // Get all tickets for this sprint
  const sprintTickets = tickets.filter((t) => t.sprintId === sprintId);

  // Calculate completed points
  const completedPoints = sprintTickets
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.points, 0);

  // Mark sprint as completed
  updateSprint(sprintId, {
    status: 'completed',
    completedPoints,
  });

  // Get incomplete tickets and create new sprint with them
  const incompleteTickets = sprintTickets.filter((t) => t.status !== 'done');

  if (incompleteTickets.length > 0) {
    // Create new draft sprint
    const newSprint: Sprint = {
      id: uuid(),
      number: sprint.number + 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'planning',
      plannedPoints: 0,
      completedPoints: 0,
    };

    // Add new sprint
    useAppStore.setState((state) => ({
      sprints: [...state.sprints, newSprint],
    }));

    // Carry over incomplete tickets
    incompleteTickets.forEach((ticket) => {
      addTicket({
        title: ticket.title,
        description: ticket.description,
        points: ticket.points,
        sprintId: newSprint.id,
        status: 'todo',
        carriedFromSprintId: sprintId,
      });
    });
  }
}
