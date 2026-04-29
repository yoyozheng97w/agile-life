import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  type DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import { useAppStore, selectActiveSprint, selectTicketsForSprint } from '../store/appStore';
import KanbanColumn from '../components/KanbanColumn';
import type { TicketStatus } from '../types';

export default function KanbanPage() {
  const navigate = useNavigate();
  const { moveTicket } = useAppStore();
  const state = useAppStore.getState();
  const activeSprint = selectActiveSprint(state);

  useEffect(() => {
    if (!activeSprint) {
      navigate('/plan');
      return;
    }

    if (new Date() > new Date(activeSprint.endDate)) {
      navigate('/review');
    }
  }, [activeSprint, navigate]);

  if (!activeSprint) return null;

  const sprintTickets = selectTicketsForSprint(activeSprint.id)(state);
  const statusesInOrder: TicketStatus[] = ['todo', 'doing', 'blocking', 'done'];
  const statusLabels: Record<TicketStatus, string> = {
    todo: 'To-Do',
    doing: 'Doing',
    blocking: 'Blocking',
    done: 'Done',
  };

  const completedPoints = sprintTickets
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.points, 0);

  const daysRemaining = Math.ceil(
    (new Date(activeSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as TicketStatus;
    moveTicket(ticketId, newStatus);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sprint {activeSprint.number}</h1>
        <div className="flex gap-8 text-sm text-slate-600">
          <div>
            <span className="font-semibold">Planned:</span> {activeSprint.plannedPoints} points
          </div>
          <div>
            <span className="font-semibold">Completed:</span>{' '}
            <span className="text-green-600 font-semibold">{completedPoints}</span> points
          </div>
          <div>
            <span className="font-semibold">Days left:</span> {Math.max(0, daysRemaining)}
          </div>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {statusesInOrder.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              label={statusLabels[status]}
              tickets={sprintTickets.filter((t) => t.status === status)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
