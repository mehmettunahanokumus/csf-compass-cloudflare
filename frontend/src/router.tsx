/**
 * React Router Configuration
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppShell.new';
import Dashboard from './pages/Dashboard.new';
import Assessments from './pages/Assessments.new';
import AssessmentDetail from './pages/AssessmentDetail.new';
import AssessmentComparison from './pages/AssessmentComparison.new';
import AssessmentChecklist from './pages/AssessmentChecklist';
import AssessmentReport from './pages/AssessmentReport';
import NewAssessment from './pages/NewAssessment.new';
import Vendors from './pages/Vendors.new';
import VendorDetail from './pages/VendorDetail.new';
import VendorRanking from './pages/VendorRanking';
import VendorTemplates from './pages/VendorTemplates';
import VendorNew from './pages/VendorNew';
import VendorEdit from './pages/VendorEdit';
import VendorPortal from './pages/VendorPortal.new';
import Analytics from './pages/Analytics.new';
import Exports from './pages/Exports.new';
import Organization from './pages/Organization.new';
import Profile from './pages/Profile.new';
import AssessmentWizard from './pages/AssessmentWizard';

export const router = createBrowserRouter([
  // Public routes (outside AppLayout)
  {
    path: '/vendor-portal/:token',
    element: <VendorPortal />,
  },

  // Protected routes (inside AppLayout)
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
        path: 'assessments/:id/comparison',
        element: <AssessmentComparison />,
      },
      {
        path: 'assessments/:id/wizard',
        element: <AssessmentWizard />,
      },
      {
        path: 'assessments/:id/checklist',
        element: <AssessmentChecklist />,
      },
      {
        path: 'assessments/:id/report',
        element: <AssessmentReport />,
      },
      {
        path: 'vendors',
        element: <Vendors />,
      },
      {
        path: 'vendors/ranking',
        element: <VendorRanking />,
      },
      {
        path: 'vendors/templates',
        element: <VendorTemplates />,
      },
      {
        path: 'vendors/new',
        element: <VendorNew />,
      },
      {
        path: 'vendors/:id/edit',
        element: <VendorEdit />,
      },
      {
        path: 'vendors/:id',
        element: <VendorDetail />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'exports',
        element: <Exports />,
      },
      {
        path: 'organization',
        element: <Organization />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
]);
