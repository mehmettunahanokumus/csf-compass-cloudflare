/**
 * Main App Component
 * Provides React Router and Toast notifications for the application
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
