import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { useAppStore, selectDraftSprint, selectTicketsForSprint } from '../store/appStore';
import PointsPicker from '../components/PointsPicker';
import TicketCard from '../components/TicketCard';
import type { Points } from '../types';

export default function SprintPlanningPage() {
  const navigate = useNavigate();
  const {
    createDraftSprint,
    startSprint,
    addTicket,
    deleteTicket,
    updateSprint,
    settings,
  } = useAppStore();

  const draftSprint = useAppStore((state) => selectDraftSprint(state));
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<Points>(3);

  if (!draftSprint) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Create Sprint</h1>
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => {
              const startDateInput = (
                document.getElementById('startDate') as HTMLInputElement
              ).value;
              createDraftSprint({
                startDate: startDateInput,
                lengthDays: settings.sprintLengthDays,
              });
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Create Sprint
          </button>
        </div>
      </div>
    );
  }

  const sprintTickets = selectTicketsForSprint(draftSprint.id)(useAppStore.getState());
  const plannedPoints = sprintTickets.reduce((sum, t) => sum + t.points, 0);

  const handleAddTicket = () => {
    if (title.trim()) {
      addTicket({
        title,
        description,
        points,
        sprintId: draftSprint.id,
        status: 'todo',
      });
      setTitle('');
      setDescription('');
      setPoints(3);
      setShowNewTicketForm(false);
    }
  };

  const handleStartDateChange = (value: string) => {
    if (!draftSprint) return;

    const nextEndDate = format(
      addDays(parseISO(value), Math.max(1, settings.sprintLengthDays) - 1),
      'yyyy-MM-dd'
    );

    updateSprint(draftSprint.id, {
      startDate: value,
      endDate: nextEndDate,
    });
  };

  const handleStartSprint = () => {
    startSprint(draftSprint.id, plannedPoints);
    navigate('/');
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Sprint Planning</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-slate-600">Dates</p>
            <p className="text-2xl font-bold">
              {format(new Date(draftSprint.startDate), 'MMM d')} –{' '}
              {format(new Date(draftSprint.endDate), 'MMM d')}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Duration</p>
            <p className="text-2xl font-bold">{settings.sprintLengthDays} days</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Planned Points</p>
            <p className="text-2xl font-bold text-blue-600">{plannedPoints}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={draftSprint.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">End Date</p>
            <div className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
              {format(new Date(draftSprint.endDate), 'yyyy-MM-dd')}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartSprint}
          disabled={plannedPoints === 0}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          Start Sprint
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tickets</h2>
          <button
            onClick={() => setShowNewTicketForm(!showNewTicketForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Add Ticket
          </button>
        </div>

        {showNewTicketForm && (
          <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
            <input
              type="text"
              placeholder="Ticket title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-semibold mb-2">Story Points</p>
              <PointsPicker value={points} onChange={setPoints} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTicket}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowNewTicketForm(false)}
                className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {sprintTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="relative"
              onContextMenu={(e) => {
                e.preventDefault();
                deleteTicket(ticket.id);
              }}
            >
              <TicketCard ticket={ticket} />
              <button
                onClick={() => deleteTicket(ticket.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-red-600 text-lg"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
