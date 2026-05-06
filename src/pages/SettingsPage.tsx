import { useAppStore } from '../store/appStore';

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();

  const handleNotificationToggle = async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updateSettings({ notificationsEnabled: true });
      }
    } else if (Notification.permission === 'granted') {
      updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Sprint Length */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Sprint Length (days)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={settings.sprintLengthDays}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) updateSettings({ sprintLengthDays: val });
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">Default: 14 days</p>
        </div>

        {/* Standup Time */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Daily Standup Time
          </label>
          <input
            type="time"
            value={settings.standupTime}
            onChange={(e) => updateSettings({ standupTime: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            You'll get a notification at this time each day (if enabled and browser is open)
          </p>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Notifications
          </label>
          <button
            onClick={handleNotificationToggle}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              settings.notificationsEnabled && Notification.permission === 'granted'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {Notification.permission === 'denied'
              ? 'Blocked by browser'
              : settings.notificationsEnabled
                ? 'Enabled ✓'
                : 'Enable notifications'}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            {Notification.permission === 'denied'
              ? 'Notifications are blocked. Check browser settings to allow.'
              : 'Grant permission to receive daily standup reminders.'}
          </p>
        </div>
      </div>
    </div>
  );
}
