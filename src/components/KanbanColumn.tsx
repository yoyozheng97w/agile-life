import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Ticket, TicketStatus } from '../types';
import TicketCard from './TicketCard';

interface KanbanColumnProps {
  status: TicketStatus;
  label: string;
  tickets: Ticket[];
}

const statusColors: Record<TicketStatus, string> = {
  todo: 'bg-slate-100',
  doing: 'bg-yellow-100',
  blocking: 'bg-red-100',
  done: 'bg-green-100',
};

export default function KanbanColumn({
  status,
  label,
  tickets,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const ticketIds = tickets.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-lg p-4 min-h-[600px] ${statusColors[status]}`}
    >
      <h2 className="font-bold text-slate-900 mb-4">
        {label}
        <span className="ml-2 text-sm font-normal text-slate-600">
          {tickets.length}
        </span>
      </h2>
      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
