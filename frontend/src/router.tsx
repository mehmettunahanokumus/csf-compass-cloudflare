/**
 * React Router Configuration
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppShell.shadcn';
import Dashboard from './pages/Dashboard.shadcn';
import Assessments from './pages/Assessments.shadcn';
import AssessmentDetail from './pages/AssessmentDetail.shadcn';
import AssessmentComparison from './pages/AssessmentComparison.shadcn';
import AssessmentChecklist from './pages/AssessmentChecklist.shadcn';
import AssessmentReport from './pages/AssessmentReport';
import NewAssessment from './pages/NewAssessment.new';
import Vendors from './pages/Vendors.shadcn';
import VendorDetail from './pages/VendorDetail.shadcn';
import VendorRanking from './pages/VendorRanking';
import VendorTemplates from './pages/VendorTemplates';
import VendorNew from './pages/VendorNew';
import VendorEdit from './pages/VendorEdit';
import VendorPortal from './pages/VendorPortal.shadcn';
import Analytics from './pages/Analytics.shadcn';
import Exports from './pages/Exports.shadcn';
import Organization from './pages/Organization.shadcn';
import Profile from './pages/Profile.shadcn';
import AssessmentWizard from './pages/AssessmentWizard.shadcn';

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
