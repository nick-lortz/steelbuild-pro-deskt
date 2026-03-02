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
- **Functionality**: Organize drawing sets, sheets, and revision history for steel shop drawings
- **Purpose**: Version control and distribution of fabrication/erection drawings
- **Trigger**: User uploads drawing set or adds revision to existing set
- **Progression**: Drawing Sets List → Create Set → Add Sheets → Upload Revision → Mark Current → Distribution Log
- **Success criteria**: Usable workflow, clear current vs superseded status, no confusion about which revision is active

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
