# Advanced Features Implementation Guide

This document describes the advanced database schema and features implemented for SteelBuild Pro.

## Overview

The following advanced features have been implemented:

1. **Comprehensive Database Schema** with proper constraints and relationships
2. **Budget Variance Tracking** with drill-down analysis
3. **Automated Schedule Conflict Detection** and resolution
4. **Resource Management System** for crews, labor, and equipment
5. **Custom Dashboard Widgets** for executive portfolio insights

---

## 1. Database Schema (`/src/lib/schema.ts`)

### Key Features

#### Timestamps and Audit Trail
All entities include:
- `created_at`: Timestamp when entity was created
- `updated_at`: Timestamp when entity was last modified
- `created_by`: User ID who created the entity
- `updated_by`: User ID who last modified the entity

#### Soft Deletes
Entities that support soft deletion include `deleted_at` field:
- Projects
- Project Contacts
- Project Risks
- Tasks
- RFIs
- Documents
- Drawing Sets/Sheets
- Budget Line Items
- Expenses
- Cost Codes
- Contracts
- Change Orders
- And many more...

#### Project Scoping
All project-related entities include `project_id` for:
- Access control enforcement
- Data isolation between projects
- Cascade delete behavior

### Uniqueness Constraints

```typescript
{
  project_number: 'Must be unique across all projects',
  rfi_per_project: '(project_id, rfi_number) must be unique',
  cost_code_per_project: '(project_id, cost_code) must be unique',
  submittal_number_per_project: '(project_id, submittal_number) must be unique',
  co_number_per_project: '(project_id, co_number) must be unique',
}
```

### Foreign Keys

All relationships are properly defined with foreign keys:
- `ProjectMember.project_id` → `Project.id`
- `Task.project_id` → `Project.id`
- `RFI.project_id` → `Project.id`
- `BudgetLineItem.cost_code_id` → `CostCode.id`
- And 50+ more relationships...

### Indexes

Recommended indexes for performance:
- `project_id` on all project-scoped entities
- `created_at` on all entities (for sorting)
- `status` fields (for filtering)
- Date fields (`start_date`, `end_date`, `due_date`)
- All foreign key fields

### Cascade Behaviors

#### Project Deletion
- **Strategy**: Soft-delete cascade
- **Behavior**: When `project.deleted_at` is set, all child entities are also soft-deleted
- **Protection**: Admin confirmation required, or blocked if active work exists

#### Change Order Deletion
- **Strategy**: Hard cascade
- **Entities**: `ChangeOrderLineItem`
- **Behavior**: Deleting a change order also deletes all its line items

#### Drawing Set Deletion
- **Strategy**: Restricted
- **Entities**: `DrawingSheet`, `DrawingRevision`
- **Behavior**: Cannot delete if sheets exist unless admin force flag is set

#### Task Deletion
- **Strategy**: Restricted
- **Behavior**: Cannot delete if other tasks depend on it (dependency check)

---

## 2. Budget Variance Tracking (`/src/lib/budget-variance-tracker.ts`)

### Features

#### Comprehensive Variance Analysis
```typescript
const analysis = await BudgetVarianceTracker.analyzeProjectVariance(
  projectId,
  budgetLineItems,
  expenses,
  costCodes
)
```

Returns:
- Total variance amount and percentage
- Favorable vs unfavorable counts
- Category breakdowns (labor, material, equipment, other)
- Top variances (largest deviations)
- Trend data over time
- Actionable recommendations

#### Category-Level Analysis
Automatically categorizes costs into:
- **Labor**: Manpower, crew costs
- **Material**: Supplies, materials
- **Equipment**: Machinery, tools
- **Other**: Miscellaneous costs

#### Drill-Down Capability
```typescript
const drillDown = await BudgetVarianceTracker.drillDownVariance(
  costCodeId,
  budgetLineItem,
  expenses,
  costCode
)
```

Provides:
- Detailed breakdown by category
- Individual expense line items
- Root cause analysis
- Corrective actions
- Variance attribution

### Usage Example

```typescript
import { BudgetVarianceTracker } from '@/lib/budget-variance-tracker'

// Analyze project variance
const analysis = await BudgetVarianceTracker.analyzeProjectVariance(
  projectId,
  budgetLineItems,
  expenses,
  costCodes
)

// Display summary
console.log(`Total Variance: $${analysis.total_variance.toFixed(2)}`)
console.log(`Variance %: ${analysis.total_variance_percent.toFixed(1)}%`)

// Show recommendations
analysis.recommendations.forEach(rec => {
  console.log(`- ${rec}`)
})

// Drill down into specific cost code
if (analysis.top_variances[0]) {
  const drillDown = await BudgetVarianceTracker.drillDownVariance(
    budgetLineItems[0].cost_code_id,
    budgetLineItems[0],
    expenses,
    costCodes[0]
  )
  
  console.log('Labor Variance:', drillDown.breakdown.labor.variance)
  console.log('Root Causes:', drillDown.root_causes)
  console.log('Corrective Actions:', drillDown.corrective_actions)
}
```

### Integration Points

- **Budget Tracking Page**: Display variance analysis charts
- **Cost Codes Page**: Show variance by cost code
- **Financial Dashboard**: Portfolio-level variance rollup
- **Alerts System**: Trigger alerts for significant variances

---

## 3. Schedule Conflict Detection (`/src/lib/schedule-conflict-detector.ts`)

### Features

#### Automated Conflict Detection
```typescript
const result = await ScheduleConflictDetector.detectConflicts(
  projectId,
  tasks,
  resourceAllocations,
  resources,
  constraints
)
```

Detects:
- **Resource Conflicts**: Over-allocation of crews, labor, equipment
- **Dependency Conflicts**: Tasks starting before predecessors finish
- **Circular Dependencies**: Invalid dependency loops
- **Constraint Violations**: Must-start-on, finish-no-later violations
- **Milestone Risks**: Predecessors with insufficient slack

#### Resolution Options
Each conflict includes multiple resolution strategies:
- **Reschedule**: Adjust task dates
- **Reallocate Resource**: Find alternative resources
- **Split Task**: Break into smaller tasks
- **Add Resource**: Increase capacity
- **Remove Constraint**: Eliminate invalid constraints

#### Auto-Resolution
```typescript
const { resolved, failed } = await ScheduleConflictDetector.autoResolveConflicts(
  conflicts,
  tasks
)
```

Automatically resolves conflicts where:
- Solution is deterministic
- No user input required
- Low risk of unintended consequences

### Conflict Types

#### 1. Resource Over-Allocation
Detected when a resource is allocated >100% on any day.

**Example:**
```
Crane #1 allocated to:
- Task A: 60% (Mon-Wed)
- Task B: 70% (Tue-Thu)
→ Tuesday overallocated at 130%
```

**Resolution Options:**
- Stagger tasks (delay Task B to Thursday)
- Use backup crane for Task B
- Reduce scope of one task

#### 2. Dependency Violations
Detected when a task starts before its predecessor finishes.

**Example:**
```
Task A: Jan 1 - Jan 5
Task B: Jan 3 - Jan 7 (depends on A)
→ Task B starts 2 days before A finishes
```

**Auto-Resolution:**
- Reschedule Task B to start Jan 6

#### 3. Circular Dependencies
Detected using depth-first search (DFS) algorithm.

**Example:**
```
Task A depends on Task B
Task B depends on Task C
Task C depends on Task A
→ Circular dependency detected
```

**Resolution:**
- Remove weakest dependency link
- Manual review required

#### 4. Constraint Violations
Detected when task dates don't satisfy constraints.

**Example:**
```
Task A: Jan 10 - Jan 15
Constraint: Must finish by Jan 12
→ Finishes 3 days late
```

**Resolution:**
- Compress task duration
- Start earlier
- Remove/modify constraint

### Usage Example

```typescript
import { ScheduleConflictDetector } from '@/lib/schedule-conflict-detector'

// Run conflict detection
const detection = await ScheduleConflictDetector.detectConflicts(
  projectId,
  tasks,
  resourceAllocations,
  resources,
  constraints
)

// Display summary
console.log(`Found ${detection.conflicts.length} conflicts`)
console.log(`Auto-resolvable: ${detection.auto_resolvable}`)
console.log(`Manual review: ${detection.manual_review_required}`)

if (detection.critical_path_affected) {
  console.warn('⚠️ Critical path is affected!')
}

// Auto-resolve what we can
const { resolved, failed } = await ScheduleConflictDetector.autoResolveConflicts(
  detection.conflicts.filter(c => c.auto_resolvable),
  tasks
)

console.log(`Auto-resolved ${resolved.length} conflicts`)

// Show remaining conflicts requiring manual review
failed.forEach(conflict => {
  console.log(`${conflict.severity}: ${conflict.description}`)
  conflict.resolution_options.forEach(option => {
    console.log(`  - ${option.strategy}: ${option.description}`)
  })
})

// Follow recommended actions
detection.recommended_actions.forEach(action => {
  console.log(`Priority ${action.priority}: ${action.action}`)
  console.log(`  Rationale: ${action.rationale}`)
})
```

### Integration Points

- **Schedule Page**: Display conflicts and warnings
- **Task Edit Dialog**: Show conflicts when editing
- **Dashboard**: Schedule health indicators
- **Alerts System**: Notify when critical conflicts detected

---

## 4. Resource Management (`/src/lib/resource-manager.ts`)

### Features

#### Utilization Tracking
```typescript
const utilizations = ResourceManager.calculateUtilization(
  resources,
  allocations,
  laborHours,
  equipmentUsage,
  periodStart,
  periodEnd
)
```

Tracks:
- Total capacity vs actual hours
- Idle time and utilization percentage
- Cost per hour
- Efficiency rating (actual vs allocated)

#### Crew Performance Analysis
```typescript
const performance = ResourceManager.analyzeCrewPerformance(
  crews,
  laborHours,
  tasks,
  period
)
```

Measures:
- Tasks completed vs in-progress
- Total hours worked
- Average productivity
- Cost efficiency
- Quality and safety incidents

#### Equipment Utilization
```typescript
const equipUtilization = ResourceManager.analyzeEquipmentUtilization(
  equipment,
  equipmentLogs,
  equipmentUsage,
  periodStart,
  periodEnd
)
```

Analyzes:
- Usage vs maintenance vs idle time
- Operating cost per hour
- Breakdown incidents
- Rental vs ownership recommendations

#### Resource Forecasting
```typescript
const forecasts = ResourceManager.forecastResourceNeeds(
  tasks,
  currentAllocations,
  resources,
  forecastPeriods
)
```

Projects:
- Required capacity by period
- Gaps (shortages or surplus)
- Recommended actions
- Cost impact

#### Labor Analysis
```typescript
const laborAnalysis = ResourceManager.analyzeLaborByCategory(
  laborEntries,
  laborCategories,
  budgetedHours,
  periodStart,
  periodEnd
)
```

Tracks by labor category:
- Budgeted vs actual hours
- Cost variance
- Productivity index
- Overtime percentage

#### Allocation Optimization
```typescript
const optimization = ResourceManager.optimizeResourceAllocation(
  tasks,
  resources,
  currentAllocations
)
```

Generates:
- Optimized allocation plan
- List of improvements
- Projected cost savings

### Usage Example

```typescript
import { ResourceManager } from '@/lib/resource-manager'

// Calculate utilization for last month
const utilizations = ResourceManager.calculateUtilization(
  resources,
  allocations,
  laborHours,
  equipmentUsage,
  '2024-01-01',
  '2024-01-31'
)

// Find underutilized resources
const underutilized = utilizations.filter(u => u.utilization_percent < 50)
console.log(`${underutilized.length} resources under 50% utilization`)

// Analyze crew performance
const crewPerformance = ResourceManager.analyzeCrewPerformance(
  crews,
  laborHours,
  tasks,
  'January 2024'
)

const topCrew = crewPerformance.sort((a, b) => 
  b.cost_efficiency - a.cost_efficiency
)[0]

console.log(`Top crew: ${topCrew.crew_name}`)
console.log(`Cost efficiency: ${topCrew.cost_efficiency.toFixed(2)}`)

// Forecast next quarter needs
const forecasts = ResourceManager.forecastResourceNeeds(
  futureTasks,
  currentAllocations,
  resources,
  ['2024-04-01 to 2024-04-30', '2024-05-01 to 2024-05-31', '2024-06-01 to 2024-06-30']
)

forecasts.forEach(forecast => {
  if (forecast.gap_type === 'shortage') {
    console.warn(`${forecast.resource_type} shortage in ${forecast.period}`)
    console.log('Actions:', forecast.recommended_actions)
  }
})

// Optimize allocations
const optimization = ResourceManager.optimizeResourceAllocation(
  tasks,
  resources,
  currentAllocations
)

console.log(`Optimization suggestions: ${optimization.improvements.length}`)
console.log(`Projected savings: $${optimization.projected_savings}`)
```

### Integration Points

- **Equipment Page**: Display utilization charts
- **Labor Page**: Show productivity and overtime metrics
- **Schedule Page**: Resource conflict warnings
- **Dashboard**: Resource capacity overview
- **Reports**: Resource utilization reports

---

## 5. Dashboard Widgets (`/src/lib/dashboard-widgets.ts`)

### Features

#### Portfolio Health Metrics
```typescript
const health = DashboardWidgetManager.calculatePortfolioHealth(
  projects,
  projectMetrics
)
```

Provides executive-level view:
- Total projects and active count
- Schedule status (on-time, at-risk, delayed)
- Budget status (on-budget, at-risk, overrun)
- Portfolio margin and margin percentage
- Critical issues and high-priority RFIs

#### Project Health Cards
```typescript
const healthCards = DashboardWidgetManager.generateProjectHealthCards(
  projects,
  projectMetrics
)
```

For each project:
- Overall health score (0-100)
- Health status (excellent, good, warning, critical)
- Schedule and cost variance
- Quick action links
- Last updated timestamp

#### Executive Summary
```typescript
const summary = DashboardWidgetManager.generateExecutiveSummary(
  projects,
  projectMetrics,
  'Q1 2024'
)
```

Generates:
- Key highlights (successes, warnings, critical issues)
- Key metrics with period-over-period changes
- Projects requiring attention
- Executive recommendations

#### Custom Widgets
```typescript
const widget = DashboardWidgetManager.createWidget(userId, {
  widget_type: 'portfolio-health',
  title: 'Portfolio Overview',
  data_source: 'active-projects',
  filters: { project_status: ['active'] },
  visualization: {
    chart_type: 'gauge',
    color_scheme: ['#22c55e', '#eab308', '#ef4444'],
    show_legend: true
  },
  refresh_interval_minutes: 15
})
```

Widget types:
- `portfolio-health`: Overall portfolio metrics
- `cost-summary`: Financial overview
- `schedule-status`: Schedule performance
- `risk-alerts`: Active risk alerts
- `custom-chart`: User-defined visualizations

### Usage Example

```typescript
import { DashboardWidgetManager } from '@/lib/dashboard-widgets'

// Calculate portfolio health
const portfolioHealth = DashboardWidgetManager.calculatePortfolioHealth(
  allProjects,
  projectMetricsMap
)

console.log('Portfolio Overview:')
console.log(`Active Projects: ${portfolioHealth.active_projects}`)
console.log(`On Schedule: ${portfolioHealth.on_schedule}`)
console.log(`On Budget: ${portfolioHealth.on_budget}`)
console.log(`Portfolio Margin: ${portfolioHealth.portfolio_margin_percent.toFixed(1)}%`)

// Generate executive summary
const execSummary = DashboardWidgetManager.generateExecutiveSummary(
  allProjects,
  projectMetricsMap,
  'Q1 2024'
)

// Display highlights
execSummary.highlights.forEach(highlight => {
  const icon = highlight.type === 'success' ? '✅' : 
               highlight.type === 'warning' ? '⚠️' : '🔴'
  console.log(`${icon} ${highlight.title}: ${highlight.description}`)
})

// Show projects needing attention
console.log('\nProjects Requiring Attention:')
execSummary.projects_requiring_attention.forEach(project => {
  console.log(`- ${project.project_name} (Health: ${project.health_score.toFixed(0)})`)
  project.quick_actions.forEach(action => {
    const urgent = action.urgent ? '🔴' : ''
    console.log(`  ${urgent} ${action.label}`)
  })
})

// Display recommendations
console.log('\nExecutive Recommendations:')
execSummary.recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec}`)
})

// Create custom widget
const costWidget = DashboardWidgetManager.createWidget(currentUserId, {
  widget_type: 'cost-summary',
  title: 'Cost Performance',
  data_source: 'all-projects',
  filters: {
    project_status: ['active', 'planning'],
    date_range: { start: '2024-01-01', end: '2024-12-31' }
  },
  visualization: {
    chart_type: 'bar',
    color_scheme: ['#3b82f6', '#ef4444'],
    show_legend: true
  },
  refresh_interval_minutes: 30,
  alert_thresholds: {
    warning: 10,
    critical: 20
  }
})

// Get widget data
const widgetData = await DashboardWidgetManager.getWidgetData(
  costWidget,
  allProjects,
  projectMetricsMap
)

console.log('Widget Data:', widgetData)
```

### Integration Points

- **Dashboard Page**: Display multiple widgets
- **Portfolio Pulse**: Executive summary view
- **Project Dashboard**: Individual project widgets
- **User Preferences**: Save widget configurations
- **Reports**: Export widget data

---

## Integration with Existing System

### Database Functions

Update `/src/lib/db.ts` to include schema validation:

```typescript
import { SCHEMA_CONSTRAINTS, VALIDATION_RULES } from './schema'

export async function validateEntity(entityType: string, data: any): Promise<boolean> {
  // Apply validation rules
  // Check uniqueness constraints
  // Verify foreign keys
  return true
}
```

### Business Rules

Update `/src/lib/business-rules.ts` to enforce:

```typescript
import { SCHEMA_CONSTRAINTS } from './schema'

export async function enforceUniqueConstraint(
  entityType: string,
  field: string,
  value: any,
  projectId?: string
): Promise<void> {
  // Check uniqueness based on SCHEMA_CONSTRAINTS
}
```

### Server Functions

Create new server functions in `/src/lib/functions/`:

- `analyzeProjectVariance.ts`
- `detectScheduleConflicts.ts`
- `calculateResourceUtilization.ts`
- `generateExecutiveSummary.ts`

### React Hooks

Create custom hooks in `/src/hooks/`:

```typescript
// useVarianceAnalysis.ts
export function useVarianceAnalysis(projectId: string) {
  // Fetch budget line items
  // Fetch expenses
  // Run variance analysis
  // Return results
}

// useScheduleConflicts.ts
export function useScheduleConflicts(projectId: string) {
  // Fetch tasks, resources, allocations
  // Run conflict detection
  // Return conflicts and warnings
}

// useResourceUtilization.ts
export function useResourceUtilization(
  projectId: string,
  periodStart: string,
  periodEnd: string
) {
  // Fetch resource data
  // Calculate utilization
  // Return metrics
}
```

### UI Components

Create new components in `/src/components/`:

- `BudgetVarianceChart.tsx` - Visualize variance analysis
- `ScheduleConflictAlert.tsx` - Display detected conflicts
- `ResourceUtilizationGrid.tsx` - Show resource metrics
- `ExecutiveDashboard.tsx` - Portfolio-level widgets
- `CustomWidgetBuilder.tsx` - Widget configuration UI

---

## Next Steps

1. **Database Migration**: Implement schema changes in persistence layer
2. **API Endpoints**: Create endpoints for new analysis functions
3. **UI Implementation**: Build components to display new features
4. **Testing**: Comprehensive testing of all features
5. **Documentation**: User documentation and training materials

---

## Performance Considerations

- **Indexing**: Ensure all foreign keys and frequently queried fields are indexed
- **Caching**: Cache expensive calculations (variance analysis, conflict detection)
- **Pagination**: Implement pagination for large datasets
- **Background Jobs**: Run heavy computations asynchronously
- **Materialized Views**: Consider materialized views for complex rollups

---

## Security Considerations

- **Access Control**: Enforce project-scoped access on all queries
- **Audit Logging**: Log all data modifications
- **Input Validation**: Validate all inputs against schema rules
- **SQL Injection**: Use parameterized queries
- **Soft Delete**: Implement soft delete to prevent data loss

---

## Maintenance

### Regular Tasks

1. **Data Integrity Checks**: Run periodic audits using audit system
2. **Cascade Cleanup**: Ensure soft-deleted projects have cascaded deletes
3. **Index Maintenance**: Rebuild indexes periodically
4. **Archive Old Data**: Archive completed projects after retention period
5. **Performance Monitoring**: Monitor query performance and optimize slow queries

### Troubleshooting

- **Constraint Violations**: Check SCHEMA_CONSTRAINTS and validation rules
- **Cascade Issues**: Review cascade behaviors in schema
- **Performance**: Check indexes and query execution plans
- **Data Inconsistencies**: Run audit system to identify and fix issues

---

## Support

For questions or issues:
1. Review this documentation
2. Check schema definitions in `/src/lib/schema.ts`
3. Review business rules in `/src/lib/business-rules.ts`
4. Contact development team
