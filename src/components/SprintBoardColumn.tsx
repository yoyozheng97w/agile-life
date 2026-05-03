import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Ticket, TicketStatus, Points } from '../types';
import TicketCard from './TicketCard';
import PointsPicker from './PointsPicker';

interface SprintBoardColumnProps {
  status: TicketStatus;
  label: string;
  tickets: Ticket[];
  onAddTicket?: (title: string, description: string, points: Points) => void;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onEdit?: (ticket: Ticket) => void;
  onDelete?: (ticketId: string) => void;
}

const statusColors: Record<TicketStatus, string> = {
  todo: 'bg-slate-100',
  doing: 'bg-yellow-100',
  blocking: 'bg-red-100',
  done: 'bg-green-100',
};

export default function SprintBoardColumn({
  status,
  label,
  tickets,
  onAddTicket,
  onEditTicket,
  onDeleteTicket,
  onEdit,
  onDelete,
}: SprintBoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const ticketIds = tickets.map((t) => t.id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<Points>(3);

  const handleAddTicket = () => {
    if (title.trim() && onAddTicket) {
      onAddTicket(title, description, points);
      setTitle('');
      setDescription('');
      setPoints(3);
      setShowAddForm(false);
    }
  };

  const totalPoints = tickets.reduce((sum, ticket) => sum + ticket.points, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-lg p-4 min-h-[600px] ${statusColors[status]} flex flex-col`}
    >
      <h2 className="font-bold text-slate-900 mb-4">
        {label}
        <span className="ml-2 text-sm font-normal text-slate-600">
          {totalPoints} pt
        </span>
      </h2>

      {onAddTicket && (
        <div className="mb-4">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 px-3 border-2 border-dashed border-slate-400 rounded text-sm font-semibold text-slate-700 hover:border-slate-600 hover:text-slate-900 transition"
            >
              + Add Ticket
            </button>
          ) : (
            <div className="bg-white rounded-lg p-3 space-y-2 border border-slate-300">
              <input
                type="text"
                placeholder="Ticket title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAddTicket}
                  disabled={!title.trim()}
                  className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setTitle('');
                    setDescription('');
                    setPoints(3);
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 px-2 py-1 rounded text-xs font-semibold hover:bg-slate-400"
                >
                  Cancel
                </button>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-700 mb-1">Story Points</p>
                <PointsPicker value={points} onChange={setPoints} />
              </div>
            </div>
          )}
        </div>
      )}

      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onEdit={onEdit || onEditTicket}
              onDelete={onDelete || onDeleteTicket}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
