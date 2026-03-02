import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layouts/main-layout'
import { ProjectLayout } from '@/components/layouts/project-layout'
import { DashboardPage } from '@/pages/dashboard'
import { ProjectsListPage } from '@/pages/projects/projects-list-page'
import { ProjectDashboardPage } from '@/pages/projects/project-dashboard-page'
import { ProjectSettingsPage } from '@/pages/projects/project-settings-page'
import { SchedulePage } from '@/pages/schedule/schedule-page'
import { FinancialsPage } from '@/pages/financials/financials-page'
import { BudgetTrackingPage } from '@/pages/financials/budget-tracking-page'
import { SOVTrackingPage } from '@/pages/financials/sov-tracking-page'
import { ReportingAnalyticsPage } from '@/pages/financials/reporting-analytics-page'
import { CustomReportBuilderPage } from '@/pages/financials/custom-report-builder-page'
import { RFIsPage } from '@/pages/rfis/rfis-page'
import { DocumentsPage } from '@/pages/documents/documents-page'
import { DrawingsPage } from '@/pages/drawings/drawings-page'
import { WorkPackagesPage } from '@/pages/work-packages/work-packages-page'
import { DeliveriesPage } from '@/pages/deliveries/deliveries-page'
import { LaborPage } from '@/pages/labor/labor-page'
import { EquipmentPage as ProjectEquipmentPage } from '@/pages/equipment/equipment-page'
import { ChangeOrdersPage } from '@/pages/change-orders/change-orders-page'
import { ContractsPage } from '@/pages/contracts/contracts-page'
import { CostCodesPage } from '@/pages/cost-codes/cost-codes-page'
import { DailyLogsPage } from '@/pages/daily-logs/daily-logs-page'
import { MeetingsPage } from '@/pages/meetings/meetings-page'
import { AuditDashboardPage } from '@/pages/audit/audit-dashboard-page'
import { GlobalEquipmentPage } from '@/pages/global/equipment-page'
import { GlobalCostCodesPage } from '@/pages/global/cost-codes-page'
import { PortfolioPulsePage } from '@/pages/portfolio/portfolio-pulse-page'
import { SubmittalsPage } from '@/pages/submittals/submittals-page'
import { AlertsPage } from '@/pages/alerts/alerts-page'
import { TodoListPage } from '@/pages/todo/todo-list-page'
import { ProductionNotesPage } from '@/pages/production-notes/production-notes-page'
import { FabricationTrackingPage } from '@/pages/fabrication/fabrication-tracking-page'
import { LookAheadPlanningPage } from '@/pages/lookahead/lookahead-planning-page'
import { ProjectContactsPage } from '@/pages/contacts/project-contacts-page'
import { JobSetupPage } from '@/pages/job-setup/job-setup-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'projects',
        element: <ProjectsListPage />,
      },
      {
        path: 'portfolio',
        element: <PortfolioPulsePage />,
      },
      {
        path: 'equipment',
        element: <GlobalEquipmentPage />,
      },
      {
        path: 'cost-codes',
        element: <GlobalCostCodesPage />,
      },
      {
        path: 'audit',
        element: <AuditDashboardPage />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [
          {
            index: true,
            element: <ProjectDashboardPage />,
          },
          {
            path: 'settings',
            element: <ProjectSettingsPage />,
          },
          {
            path: 'schedule',
            element: <SchedulePage />,
          },
          {
            path: 'financials',
            element: <FinancialsPage />,
          },
          {
            path: 'budget-tracking',
            element: <BudgetTrackingPage />,
          },
          {
            path: 'sov-tracking',
            element: <SOVTrackingPage />,
          },
          {
            path: 'reporting',
            element: <ReportingAnalyticsPage />,
          },
          {
            path: 'custom-reports',
            element: <CustomReportBuilderPage />,
          },
          {
            path: 'rfis',
            element: <RFIsPage />,
          },
          {
            path: 'documents',
            element: <DocumentsPage />,
          },
          {
            path: 'drawings',
            element: <DrawingsPage />,
          },
          {
            path: 'work-packages',
            element: <WorkPackagesPage />,
          },
          {
            path: 'deliveries',
            element: <DeliveriesPage />,
          },
          {
            path: 'labor',
            element: <LaborPage />,
          },
          {
            path: 'equipment',
            element: <ProjectEquipmentPage />,
          },
          {
            path: 'change-orders',
            element: <ChangeOrdersPage />,
          },
          {
            path: 'contracts',
            element: <ContractsPage />,
          },
          {
            path: 'cost-codes',
            element: <CostCodesPage />,
          },
          {
            path: 'daily-logs',
            element: <DailyLogsPage />,
          },
          {
            path: 'meetings',
            element: <MeetingsPage />,
          },
          {
            path: 'submittals',
            element: <SubmittalsPage />,
          },
          {
            path: 'alerts',
            element: <AlertsPage />,
          },
          {
            path: 'todo',
            element: <TodoListPage />,
          },
          {
            path: 'production-notes',
            element: <ProductionNotesPage />,
          },
          {
            path: 'fabrication',
            element: <FabricationTrackingPage />,
          },
          {
            path: 'lookahead',
            element: <LookAheadPlanningPage />,
          },
          {
            path: 'contacts',
            element: <ProjectContactsPage />,
          },
          {
            path: 'job-setup',
            element: <JobSetupPage />,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
