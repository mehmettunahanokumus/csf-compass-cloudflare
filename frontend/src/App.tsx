/**
 * Main App Component
 * Provides React Router for the application
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export default function App() {
  return <RouterProvider router={router} />;
}
