import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';
import { useAppStore, selectCompletedSprints } from '../store/appStore';
import type { Sprint } from '../types';

export default function HistoryPage() {
  const { updateSprint, deleteSprintAndTickets } = useAppStore();
  const completedSprints = useAppStore(selectCompletedSprints);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlanned, setEditPlanned] = useState<number>(0);
  const [editCompleted, setEditCompleted] = useState<number>(0);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | '3m' | '6m' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const filteredSprints = useMemo(() => {
    const filtered = completedSprints.filter((sprint) => {
      const sprintEnd = new Date(sprint.endDate);
      sprintEnd.setHours(0, 0, 0, 0);

      if (filterMode === 'all') return true;

      if (filterMode === '3m') {
        const cutoff = subMonths(today, 3);
        return sprintEnd >= cutoff;
      }

      if (filterMode === '6m') {
        const cutoff = subMonths(today, 6);
        return sprintEnd >= cutoff;
      }

      if (filterMode === 'custom') {
        if (!customFrom || !customTo) return true;
        const fromDate = new Date(customFrom);
        const toDate = new Date(customTo);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return sprintEnd >= fromDate && sprintEnd <= toDate;
      }

      return true;
    });

    return filtered;
  }, [completedSprints, filterMode, customFrom, customTo, today]);

  const chartData = filteredSprints.map((sprint) => ({
    sprint: `${format(new Date(sprint.startDate), 'MMM d')} – ${format(new Date(sprint.endDate), 'MMM d')}`,
    planned: sprint.plannedPoints,
    completed: sprint.completedPoints,
  }));

  const handleEdit = (sprint: Sprint) => {
    setEditingId(sprint.id);
    setEditPlanned(sprint.plannedPoints);
    setEditCompleted(sprint.completedPoints);
    setEditStartDate(sprint.startDate);
    setEditEndDate(sprint.endDate);
  };

  const handleSave = (sprintId: string) => {
    updateSprint(sprintId, {
      plannedPoints: editPlanned,
      completedPoints: editCompleted,
      startDate: editStartDate,
      endDate: editEndDate,
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (sprintId: string) => {
    deleteSprintAndTickets(sprintId);
    setDeletingId(null);
  };

  if (completedSprints.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Sprint History</h1>
        <p className="text-slate-600">No completed sprints yet. Complete your first sprint to see history.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sprint History</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFilterMode('all');
              setCustomFrom('');
              setCustomTo('');
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilterMode('3m');
              setCustomFrom('');
              setCustomTo('');
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterMode === '3m'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Last 3 Months
          </button>
          <button
            onClick={() => {
              setFilterMode('6m');
              setCustomFrom('');
              setCustomTo('');
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterMode === '6m'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setFilterMode('custom')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterMode === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Custom
          </button>
        </div>

        {filterMode === 'custom' && (
          <div className="mt-4 flex gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Velocity Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              name="Completed Points"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Planned vs Completed</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
            <Bar dataKey="completed" fill="#10b981" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Sprint Summary</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="text-left py-2 px-4">Date Range</th>
              <th className="text-right py-2 px-4">Planned</th>
              <th className="text-right py-2 px-4">Completed</th>
              <th className="text-right py-2 px-4">Rate</th>
              <th className="text-center py-2 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSprints.map((sprint) => {
              const isEditing = editingId === sprint.id;
              const displayPlanned = isEditing ? editPlanned : sprint.plannedPoints;
              const displayCompleted = isEditing ? editCompleted : sprint.completedPoints;
              const rate =
                displayPlanned > 0
                  ? Math.round((displayCompleted / displayPlanned) * 100)
                  : 0;

              return (
                <tr key={sprint.id} className="border-b border-slate-100">
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                        <span className="text-slate-600">~</span>
                        <input
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>
                    ) : (
                      `${sprint.startDate} ~ ${sprint.endDate}`
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPlanned}
                        onChange={(e) => setEditPlanned(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-right"
                      />
                    ) : (
                      displayPlanned
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600 font-semibold">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editCompleted}
                        onChange={(e) => setEditCompleted(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-right"
                      />
                    ) : (
                      displayCompleted
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">{rate}%</td>
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleSave(sprint.id)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-slate-400 text-white text-xs rounded hover:bg-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : deletingId === sprint.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleDelete(sprint.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1 bg-slate-400 text-white text-xs rounded hover:bg-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(sprint)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(sprint.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Click "Edit" to adjust sprint metrics if your initial estimates were off or if you need to correct recorded data.
        </p>
      </div>
    </div>
  );
}
