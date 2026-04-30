import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Ticket } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  onEdit?: (ticket: Ticket) => void;
  onDelete?: (ticketId: string) => void;
}

export default function TicketCard({ ticket, onEdit, onDelete }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(ticket);
    setShowMenu(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(ticket.id);
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded-lg border-2 transition relative group ${
        isDragging
          ? 'border-blue-500 opacity-50 shadow-lg cursor-grabbing'
          : 'border-slate-200 hover:shadow-md cursor-grab'
      }`}
      {...attributes}
      {...listeners}
    >
      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 pr-8">
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

      {(onEdit || onDelete) && (
        <div
          className="absolute top-2 right-2 z-20"
          ref={menuRef}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleMenuClick}
            className="p-1 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition text-lg leading-none"
            title="More options"
          >
            ⋮
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-max" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  onClick={handleEditClick}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  ✏️ Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition border-t border-slate-200"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
