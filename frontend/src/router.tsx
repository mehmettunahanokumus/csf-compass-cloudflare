/**
 * React Router Configuration
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import NewAssessment from './pages/NewAssessment';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'assessments',
        element: <Assessments />,
      },
      {
        path: 'assessments/new',
        element: <NewAssessment />,
      },
      {
        path: 'assessments/:id',
        element: <AssessmentDetail />,
      },
      {
        path: 'vendors',
        element: <Vendors />,
      },
      {
        path: 'vendors/:id',
        element: <VendorDetail />,
      },
    ],
  },
]);
