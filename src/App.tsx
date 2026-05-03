import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import KanbanPage from './pages/KanbanPage';
import HistoryPage from './pages/HistoryPage';
import RetroPage from './pages/RetroPage';
import SettingsPage from './pages/SettingsPage';
import { initNotificationScheduler } from './lib/notificationScheduler';
import { syncSprintStatuses } from './lib/sprintLifecycle';

export default function App() {
  useEffect(() => {
    syncSprintStatuses();
    const cleanup = initNotificationScheduler();
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<KanbanPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/retro" element={<RetroPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
