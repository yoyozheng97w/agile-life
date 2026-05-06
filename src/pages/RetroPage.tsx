import { useState } from 'react';
import { format } from 'date-fns';
import { useAppStore, selectCompletedSprints, selectPlannedPointsForSprint, selectCompletedPointsForSprint } from '../store/appStore';

export default function RetroPage() {
  const completedSprints = useAppStore(selectCompletedSprints);
  const updateSprint = useAppStore((s) => s.updateSprint);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const selectedSprint = completedSprints.find((s) => s.id === selectedSprintId);
  const plannedPoints = useAppStore(selectPlannedPointsForSprint(selectedSprintId ?? ''));
  const completedPoints = useAppStore(selectCompletedPointsForSprint(selectedSprintId ?? ''));

  const handleSelectSprint = (sprintId: string) => {
    setSelectedSprintId(sprintId);
    const sprint = completedSprints.find((s) => s.id === sprintId);
    setEditText(sprint?.retrospective || '');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (selectedSprint) {
      updateSprint(selectedSprint.id, { retrospective: editText });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(selectedSprint?.retrospective || '');
    setIsEditing(false);
  };

  if (completedSprints.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Retrospective</h1>
        <p className="text-slate-600">No completed sprints yet. Complete your first sprint to start recording retrospectives.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Retrospective</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Completed Sprints</h2>
          <div className="space-y-2">
            {completedSprints.map((sprint) => (
              <button
                key={sprint.id}
                onClick={() => handleSelectSprint(sprint.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  selectedSprintId === sprint.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900">
                  {format(new Date(sprint.startDate), 'MMM d')} – {format(new Date(sprint.endDate), 'MMM d')}
                </div>
                {sprint.retrospective && (
                  <div className="text-xs text-blue-600 mt-1">✓ Has notes</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          {selectedSprint ? (
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {format(new Date(selectedSprint.startDate), 'MMM d, yyyy')} – {format(new Date(selectedSprint.endDate), 'MMM d, yyyy')}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Completed: {completedPoints}/{plannedPoints} points
                </p>
              </div>

              {isEditing ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Write your retrospective notes here... What went well? What could be improved?"
                    rows={12}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {editText ? (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 min-h-[300px] whitespace-pre-wrap text-slate-700">
                      {editText}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300 min-h-[300px] flex items-center justify-center text-slate-500">
                      No retrospective notes yet
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    ✏️ Edit
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-6 border-2 border-dashed border-slate-300 flex items-center justify-center min-h-[400px]">
              <p className="text-slate-500 text-center">Select a sprint to view or write retrospective notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
