import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import KanbanPage from './pages/KanbanPage';
import SprintPlanningPage from './pages/SprintPlanningPage';
import SprintReviewPage from './pages/SprintReviewPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { initNotificationScheduler } from './lib/notificationScheduler';

export default function App() {
  useEffect(() => {
    const cleanup = initNotificationScheduler();
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<KanbanPage />} />
          <Route path="/plan" element={<SprintPlanningPage />} />
          <Route path="/review" element={<SprintReviewPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
