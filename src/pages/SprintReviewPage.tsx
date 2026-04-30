import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAppStore, selectActiveSprint, selectTicketsForSprint } from '../store/appStore';
import TicketCard from '../components/TicketCard';

export default function SprintReviewPage() {
  const navigate = useNavigate();
  const state = useAppStore.getState();
  const activeSprint = selectActiveSprint(state);

  useEffect(() => {
    if (!activeSprint) {
      navigate('/');
    }
  }, [activeSprint, navigate]);

  if (!activeSprint) {
    return null;
  }

  const sprintTickets = selectTicketsForSprint(activeSprint.id)(state);
  const completedTickets = sprintTickets.filter((t) => t.status === 'done');
  const incompleteTickets = sprintTickets.filter((t) => t.status !== 'done');
  const completedPoints = completedTickets.reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {format(new Date(activeSprint.startDate), 'MMM d')} – {format(new Date(activeSprint.endDate), 'MMM d')} Review
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-slate-600 mb-1">Planned</p>
            <p className="text-3xl font-bold">{activeSprint.plannedPoints}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedPoints}</p>
          </div>
        </div>

        <div className="text-sm">
          <p className="text-slate-600">
            Completion rate:{' '}
            <span className="font-semibold">
              {activeSprint.plannedPoints > 0
                ? Math.round((completedPoints / activeSprint.plannedPoints) * 100)
                : 0}
              %
            </span>
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 mb-6"
      >
        Back to Kanban
      </button>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">
            ✓ Done ({completedTickets.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {completedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>

        {incompleteTickets.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-amber-700">
              ⚠ Incomplete ({incompleteTickets.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {incompleteTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            <p className="text-sm text-slate-600 mt-4">
              These will be carried over to the next sprint.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
