import { useAppStore } from '../store/appStore';

const STANDUP_REMINDER_KEY = 'lastStandupNotified';
const GRACE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function initNotificationScheduler() {
  const intervalId = setInterval(() => {
    const { settings } = useAppStore.getState();

    // Check permission
    if (Notification.permission !== 'granted') {
      return;
    }

    // Check if enabled
    if (!settings.notificationsEnabled) {
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if we already notified today
    const lastNotified = localStorage.getItem(STANDUP_REMINDER_KEY);
    if (lastNotified === today) {
      return;
    }

    // Parse standup time (HH:mm format)
    const [hours, minutes] = settings.standupTime.split(':').map(Number);
    const standupTime = new Date();
    standupTime.setHours(hours, minutes, 0, 0);

    // Check if we're within the grace window
    const timeSinceStandup = now.getTime() - standupTime.getTime();
    if (timeSinceStandup >= 0 && timeSinceStandup <= GRACE_WINDOW_MS) {
      new Notification('Daily Standup', {
        body: 'Time for your daily standup! What did you do, what will you do, any blockers?',
        icon: '📋',
      });

      // Mark as notified for today
      localStorage.setItem(STANDUP_REMINDER_KEY, today);
    }
  }, 30 * 1000); // 30-second polling

  return () => clearInterval(intervalId);
}
