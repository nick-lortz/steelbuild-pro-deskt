# SteelBuild Pro - Construction Project Management for Steel Contractors

Enterprise-grade project management platform purpose-built for structural steel erection and fabrication subcontractors to manage projects, track costs, coordinate drawings, and streamline field operations.

**Implementation Status**: Business rules layer fully implemented (`/src/lib/business-rules.ts`)

**Experience Qualities**:
1. **Professional** - Inspires confidence through precision, reliability, and attention to construction industry workflows
2. **Efficient** - Reduces administrative overhead with fast data entry, bulk operations, and intelligent defaults
3. **Robust** - Handles real-world complexity: change orders, cost tracking, drawing revisions, equipment scheduling

**Complexity Level**: Complex Application (advanced functionality with multiple views)
This is a multi-module construction ERP system with project hierarchies, cost tracking, document management, scheduling, and role-based workflows typical of enterprise construction software.

## Essential Features

### Project Management
- **Functionality**: Create, view, and manage steel erection/fabrication projects with full lifecycle tracking
- **Purpose**: Central hub for all project data, costs, schedules, and documentation
- **Trigger**: User clicks "New Project" or selects existing project from dashboard
- **Progression**: Dashboard → Project List → Project Detail → Tabs (Overview/Costs/Schedule/Drawings/Equipment)
- **Success criteria**: Projects persist correctly, data loads without crashes, navigation is intuitive

### Cost Code Management
- **Functionality**: Define and track cost codes (labor/material categories) across projects
- **Purpose**: Accurate job costing and budget tracking for steel fabrication workflows
- **Trigger**: User navigates to Cost Codes section, clicks "Add Cost Code"
- **Progression**: Cost Code List → Create Modal → Validation → Save → Toast Confirmation → Refresh List
- **Success criteria**: Cost codes save reliably, validate required fields, are editable/deletable

### Change Order System
- **Functionality**: Create change orders with line items, track approvals, calculate cost impacts
- **Purpose**: Manage scope changes and maintain audit trail for contract modifications
- **Trigger**: User clicks "New Change Order" within a project
- **Progression**: Change Order List → Create Form → Add Line Items → Calculate Total → Submit → Approval Workflow
- **Success criteria**: Full CRUD on change orders and line items, calculations are accurate, deletions cascade safely

### Contract Management
- **Functionality**: Store contract details, payment terms, and link to projects
- **Purpose**: Track legal agreements and payment schedules
- **Trigger**: User creates new contract from project or contracts module
- **Progression**: Contract Form → Validation → Save → Link to Project → Display in Project Overview
- **Success criteria**: Contracts save and update correctly, validation prevents incomplete data

### Drawing Management
- **Functionality**: Organize drawing sets, sheets, and revision history for steel shop drawings with in-app PDF viewing
- **Purpose**: Version control, distribution, and viewing of fabrication/erection drawings
- **Trigger**: User uploads drawing set, adds revision to existing set, or clicks to view PDF
- **Progression**: Drawing Sets List → Create Set → Add Sheets → Upload Revision → Mark Current → Distribution Log → View PDF in-app
- **Success criteria**: Usable workflow, clear current vs superseded status, no confusion about which revision is active, PDFs viewable with zoom/navigation controls

### Equipment Scheduling
- **Functionality**: Track equipment availability, assignments, and maintenance
- **Purpose**: Optimize crane, welder, and fabrication equipment utilization
- **Trigger**: User navigates to Equipment page or schedules equipment for project
- **Progression**: Equipment List → View Details → Schedule Assignment → Conflict Check → Confirm
- **Success criteria**: No crashes, all queries return safely, empty states handled, data loads correctly

### Checklist System
- **Functionality**: Safety inspections, QA/QC checks, pre-erection checklists
- **Purpose**: Ensure compliance and quality standards
- **Trigger**: User creates checklist template or starts checklist from project
- **Progression**: Template Selection → Checklist Instance → Toggle Items → Mark Complete → Archive
- **Success criteria**: Full CRUD on items, completion state persists, templates are reusable

### Project Management Assistant (PMA)
- **Functionality**: AI-powered assistant for project insights, schedule analysis, and decision support
- **Purpose**: Proactive recommendations and intelligent summaries
- **Trigger**: User clicks PMA icon or asks question in chat interface
- **Progression**: Open PMA Panel → Enter Query → LLM Analysis → Contextual Response → Suggested Actions
- **Success criteria**: End-to-end functional, returns useful responses, handles loading/error states

### Budget Tracking & Cost Forecasting
- **Functionality**: Real-time budget analysis with AI-powered cost projections and variance tracking
- **Purpose**: Proactive financial management, early warning of budget overruns
- **Trigger**: User navigates to Budget Tracking page from project nav
- **Progression**: Load Budget Data → Calculate Forecasts → Display Trends → Show Health Score → Cost Code Analysis
- **Success criteria**: Accurate forecasts with confidence levels, clear visualizations, actionable alerts

### SOV (Schedule of Values) Tracking
- **Functionality**: Manage billing periods, line items, retainage, and payment applications
- **Purpose**: Streamline client billing and track work completion percentages
- **Trigger**: User navigates to SOV Tracking page, creates version or adds line items
- **Progression**: Create Version → Add Line Items → Calculate Totals → Submit for Approval → Export for Billing
- **Success criteria**: Accurate calculations, clear progress tracking, version history, export capability

### Reporting & Analytics Dashboard
- **Functionality**: Comprehensive project performance analytics with multi-dimensional KPIs
- **Purpose**: Executive-level insights and data-driven decision making
- **Trigger**: User navigates to Reporting & Analytics page
- **Progression**: Generate Metrics → Display Performance Radar → Cost/Schedule/Quality Analysis → Trend Charts
- **Success criteria**: Real-time calculations, interactive charts, export capability, clear performance indicators

### Submittal Tracking
- **Functionality**: Manage all project submittals with status tracking, ball-in-court visibility, and aging analysis
- **Purpose**: Ensure timely review and approval of submittals to prevent schedule delays
- **Trigger**: User navigates to Submittals page, creates new submittal
- **Progression**: Create Submittal → Assign Reviewer → Track Status → Days Outstanding Alert → Approval/Rejection
- **Success criteria**: Full CRUD operations, status workflow, automatic days outstanding calculation, filtering by status/priority

### Alerts & Notifications System
- **Functionality**: Centralized alert dashboard for budget, schedule, RFI, submittal, delivery, and safety alerts
- **Purpose**: Proactive notification of critical issues requiring attention
- **Trigger**: System generates alerts based on thresholds, user views Alerts page
- **Progression**: Alert Generated → Displayed by Severity → User Reviews → Take Action → Dismiss
- **Success criteria**: Multi-severity alerts, action URLs, filtering, dismissal tracking, type categorization

### To-Do List
- **Functionality**: Task tracking with priority, category, assignment, and due dates
- **Purpose**: Manage action items and follow-ups across all project areas
- **Trigger**: User creates to-do from any context or manually adds task
- **Progression**: Create Task → Assign → Set Due Date → Track Progress → Mark Complete
- **Success criteria**: Full CRUD, status management, category filters, completion tracking

### Production Notes
- **Functionality**: Daily field notes with categorization, urgency flags, and follow-up tracking
- **Purpose**: Capture critical field observations and issues in real-time
- **Trigger**: Field staff creates note, optionally marks urgent or requires follow-up
- **Progression**: Create Note → Categorize → Tag Location/Crew → Flag if Urgent → Set Follow-up
- **Success criteria**: Category filtering, urgency indicators, tag system, shift tracking, follow-up dates

### Fabrication Tracking
- **Functionality**: Track fabrication items through detailing, material, production, and shipping stages
- **Purpose**: Monitor shop production progress and identify bottlenecks
- **Trigger**: User creates fabrication item, updates status/progress
- **Progression**: Create Item → Detailing → Material Ordered/Received → Production → QC Checks → Completed → Shipped
- **Success criteria**: Status workflow, progress bars for detailing and fabrication, weight/quantity tracking, QC checkpoints

### Look-Ahead Planning
- **Functionality**: Weekly planning with activities, constraints, materials, equipment, labor, and safety considerations
- **Purpose**: Proactive coordination and resource planning for upcoming work
- **Trigger**: User creates weekly look-ahead plan
- **Progression**: Create Plan → Define Activities → Identify Constraints → List Resources → Safety Review → Publish → Complete
- **Success criteria**: Week-based organization, constraint tracking, resource planning, safety checklist, status workflow

### Project Contacts
- **Functionality**: Centralized contact management organized by company with roles, email, phone, and notes
- **Purpose**: Quick access to stakeholder contact information
- **Trigger**: User adds contact from project setup or ad-hoc
- **Progression**: Add Contact → Enter Details → Organize by Company → Edit/Update → Reference Throughout Project
- **Success criteria**: Company grouping, full contact details, search/filter, edit/delete, integration with communication features

### Job Setup Checklist
- **Functionality**: Pre-construction checklist with categories, assignments, dependencies, and completion tracking
- **Purpose**: Ensure all mobilization tasks are completed before work begins
- **Purpose**: User creates checklist items, assigns responsibility, tracks completion
- **Progression**: Define Setup Items → Categorize → Assign → Set Due Dates → Track Status → Mark Complete
- **Success criteria**: Category organization, required vs optional items, status tracking, completion percentage, dependency awareness

### In-Depth Financial Analysis
- **Functionality**: Integrated analysis connecting Budget, SOV, Expenses, and Change Orders with visual dashboards
- **Purpose**: Comprehensive financial health monitoring with cross-module data correlation
- **Trigger**: Automatically calculated from budget, SOV, expense, and change order data
- **Progression**: Data Collection → Calculate Metrics → Generate Charts → Identify Variances → Provide Insights
- **Success criteria**: Budget vs Actual by cost code, SOV alignment with budget, cost distribution pie charts, cash flow analysis, change order impact visualization, all metrics accurately calculated and displayed

## Edge Case Handling

- **Empty States**: All lists show helpful "no data" messages with CTAs to create first item
- **Query Failures**: All data fetches have error boundaries, show retry options, never crash the app
- **Concurrent Edits**: Optimistic updates with rollback on failure
- **Deleted Dependencies**: Cascade deletes safely (e.g., deleting project warns about child data)
- **Invalid Input**: Form validation with clear error messages before submission
- **Network Issues**: Graceful degradation, show cached data when possible
- **Large Datasets**: Pagination and virtual scrolling for equipment lists, change orders, etc.

## Design Direction

Industrial strength meets modern precision. The design should feel like professional-grade engineering software - not flashy, but confident, detailed, and built for serious work. Think CAD software meets construction site ruggedness. Strong visual hierarchy, clear data tables, and purposeful use of construction industry color language (steel blue, safety orange accents, concrete neutrals).

## Color Selection

The palette draws from the steel construction environment: industrial blues for trust and structure, concrete grays for neutrality, and safety orange for critical actions.

- **Primary Color**: Steel Blue `oklch(0.45 0.10 250)` - Communicates reliability, precision, industrial engineering
- **Secondary Colors**: 
  - Concrete Gray `oklch(0.65 0.02 270)` - Backgrounds, supporting UI
  - Slate `oklch(0.35 0.03 260)` - Text, borders, structure
- **Accent Color**: Safety Orange `oklch(0.68 0.18 45)` - CTAs, warnings, important status indicators
- **Foreground/Background Pairings**:
  - Primary (Steel Blue): White text `oklch(0.98 0 0)` - Ratio 7.2:1 ✓
  - Secondary (Concrete Gray): Dark Slate text `oklch(0.25 0.03 260)` - Ratio 6.1:1 ✓
  - Accent (Safety Orange): White text `oklch(0.98 0 0)` - Ratio 5.3:1 ✓
  - Background (Light Gray): Foreground Slate `oklch(0.25 0.03 260)` - Ratio 12.1:1 ✓

## Font Selection

Typography should convey technical precision and readability under field conditions. Choose fonts that work equally well in data tables and on tablets in bright sunlight.

- **Primary Font**: Inter - Clean, highly legible, excellent for data-dense interfaces
- **Monospace (optional)**: JetBrains Mono - For cost codes, reference numbers, technical identifiers

**Typographic Hierarchy**:
- H1 (Page Title): Inter Bold / 32px / -0.02em letter spacing / 1.2 line height
- H2 (Section Header): Inter Semibold / 24px / -0.01em / 1.3
- H3 (Card Title): Inter Semibold / 18px / normal / 1.4
- Body (Data): Inter Regular / 15px / normal / 1.5
- Small (Labels): Inter Medium / 13px / normal / 1.4
- Data (Numbers): Inter Medium / 15px / tabular-nums / 1.5

## Financial Integration & Data Flow

All financial statistics are interconnected and populate dynamically across the application:

### Core Financial Entities & Relationships

1. **Cost Codes** → Foundation for all financial tracking
   - Budgets link to cost codes
   - SOV items map to cost codes
   - Expenses categorize by cost codes
   - Change orders impact cost codes

2. **Budget System** → Central cost control
   - `budgetedAmount`: Original planned cost
   - `actualAmount`: Sum of approved/paid expenses for that cost code
   - `committedAmount`: Contracts and POs not yet expensed
   - `variance`: Auto-calculated as `budgetedAmount - actualAmount`
   - Updates flow from Expenses → Budget.actualAmount

3. **SOV (Schedule of Values)** → Billing and revenue tracking
   - `scheduledValue`: Total value allocated to each line item (must align with budget)
   - `workCompleted`: Current period work
   - `materialsStored`: Materials on site
   - `totalCompleted`: `workCompleted + materialsStored`
   - `percentComplete`: `(totalCompleted / scheduledValue) * 100`
   - `retainage`: Typically 10% held back
   - `currentBilling`: `totalCompleted - previouslyBilled - retainage`
   - SOV items link to cost codes via `costCodeId` or `SOVCostCodeMap` for allocation

4. **Expenses** → Actual costs incurred
   - Each expense categorized by cost code
   - Status flow: `pending` → `approved` → `paid`
   - Only `approved` and `paid` expenses roll into Budget.actualAmount
   - Cash flow analysis uses expense dates for monthly aggregation

5. **Change Orders** → Budget modifications
   - Approved change orders add to total project budget
   - Change order line items can map to specific cost codes
   - Original Budget + Approved COs = Revised Budget
   - Impact tracked in financial analysis charts

### Data Calculation Flow

```
Expenses (approved/paid) 
  ↓
Budget.actualAmount (by cost code)
  ↓
Budget variance = budgetedAmount - actualAmount
  ↓
Financial Analysis Dashboard (Budget vs Actual)

SOV Items (work completed)
  ↓
SOV percentComplete & currentBilling
  ↓
Cash Flow (income from billing)
  ↓
Financial Analysis Dashboard (SOV vs Budget alignment)

Change Orders (approved)
  ↓
Revised Budget = Original Budget + CO Total
  ↓
Financial Analysis Dashboard (Change Order Impact)
```

### Cross-Module Integration Points

- **Budget Tracking Page**: Shows forecasts based on Budget + Expenses + SOV progress
- **SOV Tracking Page**: Can auto-generate from cost codes, validates against budget
- **Financial Analysis Component**: Integrates all financial data into unified dashboards:
  - Budget vs Actual by Cost Code (bar charts)
  - SOV vs Budget Alignment (compares scheduled vs budget)
  - Cost Breakdown by Category (pie chart from cost code categories)
  - Monthly Cash Flow (SOV billing as income, Expenses as outflow)
  - Change Order Impact (original vs revised budget visualization)
  
### Key Business Rules

- Division-by-zero protection on all percentage calculations
- SOV scheduled value should not exceed budget + approved change orders
- Actual costs must be ≤ committed + budgeted
- Retainage typically 10% but configurable per project
- Budget health: `(budget - actual) / budget * 100`
- Cost at completion: `actual + committed`
- Projected variance: `(budget + change orders) - cost at completion`

### Automated Calculations

All financial metrics auto-update when underlying data changes:
- Budget variance recalculated on expense approval
- SOV percentages recalculated on work completion entry
- Cash flow charts regenerate on new billing/expense
- Financial health scores update in real-time
- Forecasts regenerate using earned value methodology

## Animations

Animations should enhance clarity and provide feedback without slowing down power users. Fast, purposeful, spring-based physics for drawer/modal entry. Subtle hover states on interactive elements. Loading skeletons for data fetches.

- **Entry/Exit**: 250ms spring for dialogs and sheets (not linear easing - use spring physics)
- **Hover States**: 120ms ease-out for button/row hovers
- **Data Loading**: Skeleton pulses at 1.5s intervals
- **Success Feedback**: 200ms scale bounce on save confirmation

## Component Selection

**Components**:
- **Navigation**: Sidebar component (collapsible on mobile) with nested project structure
- **Data Tables**: Table component with sortable headers, row selection, inline actions
- **Forms**: Form + Input + Select + Textarea components with react-hook-form integration
- **Modals**: Dialog for create/edit forms, AlertDialog for destructive confirmations
- **Notifications**: Sonner toasts for save confirmations, errors, and warnings
- **Empty States**: Card with centered icon + message + CTA button
- **Loading**: Skeleton components matching expected content layout

**Customizations**:
- Custom data table with sticky headers, virtual scrolling for large datasets
- Project tree navigation component with expand/collapse
- Drawing revision timeline component
- Cost summary cards with sparkline charts (using recharts)

**States**:
- Buttons: default / hover (lighter) / active (darker) / disabled (muted + no pointer)
- Inputs: default / focus (ring) / error (destructive border) / disabled (muted)
- Rows: default / hover (light bg) / selected (accent bg)

**Icon Selection**:
- Projects: Buildings, Folders (Phosphor Icons)
- Cost: CurrencyDollar, ChartBar
- Change Orders: FilePlus, ArrowsClockwise
- Contracts: FileText, Signature
- Drawings: Blueprint, Stack
- Equipment: Crane, Toolbox, Wrench
- Checklist: CheckSquare, ListChecks
- PMA: Robot, ChatCircle

**Spacing**:
- Container padding: 6 (24px)
- Card padding: 4-6 (16-24px)
- Form field gaps: 4 (16px)
- Section gaps: 8 (32px)
- Table cell padding: 3 (12px)

**Mobile**:
- Sidebar collapses to drawer (Sheet component)
- Tables switch to card-based layout on mobile
- Forms stack vertically, full-width inputs
- Action buttons become bottom sheets on mobile
- Tabs become horizontal scroll on narrow screens
