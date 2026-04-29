import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppStore, selectCompletedSprints } from '../store/appStore';
import type { Sprint } from '../types';

export default function HistoryPage() {
  const { updateSprint, deleteSprintAndTickets } = useAppStore();
  const completedSprints = useAppStore(selectCompletedSprints);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlanned, setEditPlanned] = useState<number>(0);
  const [editCompleted, setEditCompleted] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const chartData = completedSprints.map((sprint) => ({
    sprint: `${sprint.startDate}`,
    planned: sprint.plannedPoints,
    completed: sprint.completedPoints,
  }));

  const handleEdit = (sprint: Sprint) => {
    setEditingId(sprint.id);
    setEditPlanned(sprint.plannedPoints);
    setEditCompleted(sprint.completedPoints);
  };

  const handleSave = (sprintId: string) => {
    updateSprint(sprintId, {
      plannedPoints: editPlanned,
      completedPoints: editCompleted,
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
      <h1 className="text-3xl font-bold">Sprint History</h1>

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
            {completedSprints.map((sprint) => {
              const isEditing = editingId === sprint.id;
              const displayPlanned = isEditing ? editPlanned : sprint.plannedPoints;
              const displayCompleted = isEditing ? editCompleted : sprint.completedPoints;
              const rate =
                displayPlanned > 0
                  ? Math.round((displayCompleted / displayPlanned) * 100)
                  : 0;

              return (
                <tr key={sprint.id} className="border-b border-slate-100">
                  <td className="py-3 px-4 font-semibold text-slate-700">{sprint.startDate} ~ {sprint.endDate}</td>
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
