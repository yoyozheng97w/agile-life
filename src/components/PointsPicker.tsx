import { FIBONACCI_POINTS, type Points } from '../types';

interface PointsPickerProps {
  value: Points;
  onChange: (points: Points) => void;
}

export default function PointsPicker({ value, onChange }: PointsPickerProps) {
  return (
    <div className="flex gap-2">
      {FIBONACCI_POINTS.map((point) => (
        <button
          key={point}
          onClick={() => onChange(point)}
          className={`px-3 py-2 rounded-lg font-semibold transition ${
            value === point
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {point}
        </button>
      ))}
    </div>
  );
}
