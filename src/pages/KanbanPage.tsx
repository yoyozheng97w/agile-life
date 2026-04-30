import { useEffect, useState } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import {
  DndContext,
  type DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import { useAppStore, selectActiveSprint, selectTicketsForSprint } from '../store/appStore';
import { syncSprintStatuses } from '../lib/sprintLifecycle';
import KanbanColumn from '../components/KanbanColumn';
import PointsPicker from '../components/PointsPicker';
import type { TicketStatus, Points, Ticket } from '../types';

export default function KanbanPage() {
  const { moveTicket, createDraftSprint, addTicket, settings, updateSprint, updateTicket, deleteTicket } = useAppStore();
  const state = useAppStore.getState();
  const activeSprint = selectActiveSprint(state);
  const [sprintStartDate, setSprintStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editingTicket, setEditingTicket] = useState<{ id: string; title: string; description: string; points: number } | null>(null);

  useEffect(() => {
    syncSprintStatuses();
  }, []);

  useEffect(() => {
    if (activeSprint) {
      setEditStartDate(activeSprint.startDate);
      setEditEndDate(activeSprint.endDate);
    }
  }, [activeSprint?.id]);

  const handleCreateSprint = () => {
    createDraftSprint({ startDate: sprintStartDate, lengthDays: settings.sprintLengthDays });
    syncSprintStatuses();
    setShowSprintForm(false);
  };

  if (!activeSprint) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6">Create Sprint</h1>
          {!showSprintForm ? (
            <button
              onClick={() => setShowSprintForm(true)}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              + Create New Sprint
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={sprintStartDate}
                  onChange={(e) => setSprintStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  End Date
                </p>
                <div className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                  {format(
                    addDays(parseISO(sprintStartDate), Math.max(1, settings.sprintLengthDays) - 1),
                    'yyyy-MM-dd'
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateSprint}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Create Sprint
                </button>
                <button
                  onClick={() => setShowSprintForm(false)}
                  className="flex-1 bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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

  const handleSaveDates = () => {
    if (activeSprint) {
      updateSprint(activeSprint.id, {
        startDate: editStartDate,
        endDate: editEndDate,
      });
      setIsEditingDates(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        {!isEditingDates ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">
                {format(new Date(activeSprint.startDate), 'MMM d')} – {format(new Date(activeSprint.endDate), 'MMM d')}
              </h1>
              <button
                onClick={() => setIsEditingDates(true)}
                className="text-sm text-slate-600 hover:text-blue-600 px-3 py-1 rounded hover:bg-slate-100 transition"
              >
                ✏️ Edit Dates
              </button>
            </div>
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
        ) : (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h2 className="font-bold text-slate-900">Edit Sprint Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDates}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingDates(false);
                  setEditStartDate(activeSprint.startDate);
                  setEditEndDate(activeSprint.endDate);
                }}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
              onAddTicket={status === 'todo' ? (title, desc, pts) => {
                addTicket({
                  title,
                  description: desc,
                  points: pts,
                  sprintId: activeSprint.id,
                  status: 'todo',
                });
              } : undefined}
              onEditTicket={(ticket: Ticket) => {
                setEditingTicket({
                  id: ticket.id,
                  title: ticket.title,
                  description: ticket.description || '',
                  points: ticket.points,
                });
              }}
              onDeleteTicket={(ticketId: string) => {
                if (confirm('Delete this ticket?')) {
                  deleteTicket(ticketId);
                }
              }}
            />
          ))}
        </div>
      </DndContext>

      {editingTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-xl font-bold">Edit Ticket</h2>
            <input
              type="text"
              value={editingTicket.title}
              onChange={(e) =>
                setEditingTicket({ ...editingTicket, title: e.target.value })
              }
              placeholder="Ticket title"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={editingTicket.description}
              onChange={(e) =>
                setEditingTicket({
                  ...editingTicket,
                  description: e.target.value,
                })
              }
              placeholder="Description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div>
              <p className="text-sm font-semibold mb-2">Story Points</p>
              <PointsPicker value={editingTicket.points as Points} onChange={(pts: Points) => setEditingTicket({ ...editingTicket, points: pts })} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateTicket(editingTicket.id, {
                    title: editingTicket.title,
                    description: editingTicket.description,
                    points: editingTicket.points as Points,
                  });
                  setEditingTicket(null);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTicket(null)}
                className="flex-1 bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
