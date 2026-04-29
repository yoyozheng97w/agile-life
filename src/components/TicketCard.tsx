import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Ticket } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  onEdit?: () => void;
}

export default function TicketCard({ ticket, onEdit }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onEdit}
      className={`bg-white p-4 rounded-lg border-2 cursor-grab active:cursor-grabbing transition ${
        isDragging
          ? 'border-blue-500 opacity-50 shadow-lg'
          : 'border-slate-200 hover:shadow-md'
      }`}
      {...attributes}
      {...listeners}
    >
      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
        {ticket.title}
      </h3>
      {ticket.description && (
        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
          {ticket.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {ticket.carriedFromSprintId && '↻ '}
          Created {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
        <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">
          {ticket.points}
        </span>
      </div>
    </div>
  );
}
