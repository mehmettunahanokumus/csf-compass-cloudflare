/**
 * Main App Component
 * Provides React Router and Toast notifications for the application
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  );
}
