# Server Functions Integration Summary

This document describes the server functions that have been wired to existing UI components in the SteelBuild Pro construction management application.

## Completed Integrations

### 1. Project Dashboard Page (`/projects/:projectId`)

**File**: `src/pages/projects/project-dashboard-page.tsx`

**Integrated Functions**:
- `calculateProjectScheduleHealth()` - Computes schedule health score (0-100) using AI analysis of tasks
- `forecastProjectCost()` - Projects cost at completion with 90-day forecast horizon
- `computeMarginAtRisk()` - Calculates financial risk factors and margin exposure
- `getCostRiskSignal()` - Generates red/yellow/green risk signal based on variance thresholds

**UI Features**:
- Real-time schedule health percentage with progress bar
- Cost risk signal indicator (colored dot)
- Contract value display
- Margin at risk highlight
- Cost forecast breakdown with variance analysis
- Risk factors list with impact amounts
- Active alerts panel
- Recommendation display

**Data Flow**:
1. Page loads and extracts `projectId` from URL params
2. Parallel API calls fetch: project details, schedule health, cost forecast, margin risk, and cost signal
3. Dashboard cards display key metrics
4. Detailed sections show breakdowns and recommendations

### 2. RFIs Page (`/projects/:projectId/rfis`)

**File**: `src/pages/rfis/rfis-page.tsx`

**Already Implemented Features**:
- Complete CRUD operations for RFIs
- Status tracking (open, answered, closed, escalated)
- Priority levels (low, medium, high, critical)
- Days open calculation
- Visual status badges

**Available Server Functions** (Ready for integration):
-`listRFIs()` - Retrieves all RFIs for a project
- `updateRFI()` - Updates RFI details
- `predictRFIRisk()` - AI-powered risk assessment for aging RFIs
- `updateRFIEscalation()` - Auto-escalates high-risk RFIs
- `autoUpdateTaskOnRFI()` - Links/blocks tasks based on RFI impact

**Suggested Next Steps**:
- Add "Analyze Risk" button to call `predictRFIRisk()` for individual RFIs
- Implement automatic escalation on save using `updateRFIEscalation()`
- Add task linking UI to utilize `autoUpdateTaskOnRFI()`

### 3. Drawings Page (`/projects/:projectId/drawings`)

**File**: `src/pages/drawings/drawings-page.tsx`

**Already Implemented Features**:
- Drawing set management
- Sheet organization by discipline
- Revision tracking
- Hierarchical display with accordion UI

**Available Server Functions** (Ready for integration):
- `extractDrawingMetadata()` - Extracts metadata from drawing files
- `runDrawingQA()` - Performs quality assurance checks
- `detectScopeChanges()` - Compares revisions to identify scope impacts
- `detectRevisionClouds()` - Analyzes revision cloud locations and priorities
- `analyzeDrawingSetAI()` - Evaluates complete set readiness

**Suggested Next Steps**:
- Add "Run QA" button to sheets to call `runDrawingQA()`
- Implement scope change detection on revision upload
- Add drawing set analysis dashboard using `analyzeDrawingSetAI()`
- Display revision cloud detection results in sheet details

## Server Function Capabilities

### Dashboard Functions

Located in: `src/lib/functions/dashboard.ts`

1. **getDashboardData(userId)**
   - Aggregates data across all projects
   - Returns active projects, budget totals, schedule health average
   - Identifies critical RFIs and upcoming milestones

2. **calculateProjectScheduleHealth(projectId)**
   - AI-powered schedule analysis
   - Considers task completion rates, critical path, dependencies
   - Returns 0-100 health score

3. **forecastProjectCost(projectId, horizonDays)**
   - Projects cost at completion
   - Calculates variance from budget
   - Provides confidence level and category breakdowns

4. **computeMarginAtRisk(projectId)**
   - Analyzes cost variance, open RFIs, active risks
   - Quantifies margin exposure in dollars
   - Provides risk factors with impact amounts

5. **getCostRiskSignal(projectId)**
   - Traffic light system (green/yellow/red)
   - Based on variance thresholds (8% yellow, 15% red)
   - Returns score and alert messages

### RFI Functions

Located in: `src/lib/functions/rfi.ts`

1. **listRFIs(projectId)**
   - Retrieves all RFIs for a project from KV store

2. **updateRFI(rfiId, updates)**
   - Updates RFI with partial data
   - Automatically adds updatedAt timestamp

3. **predictRFIRisk(rfiId)**
   - AI analysis of RFI age, priority, and status
   - Returns risk level (low/medium/high), score, and factors
   - Provides actionable recommendations

4. **updateRFIEscalation(rfiId, escalate)**
   - Auto-escalates high-risk RFIs
   - Updates escalation status and timestamp

5. **autoUpdateTaskOnRFI(rfiId, action)**
   - AI-powered task identification
   - Links, blocks, or unblocks related tasks
   - Maintains task-RFI relationships

### Drawing Functions

Located in: `src/lib/functions/drawings.ts`

1. **extractDrawingMetadata(drawingId)**
   - Extracts sheets, revisions, disciplines
   - Returns structured metadata object

2. **runDrawingQA(drawingId)**
   - Quality assurance checks
   - Returns pass/fail, score, issues list, recommendations

3. **detectScopeChanges(drawingId, previousRevisionId)**
   - Compares revision notes
   - Identifies scope impact (none/minor/moderate/major)
   - Lists specific changes with estimated impact

4. **detectRevisionClouds(drawingId)**
   - Analyzes revision history
   - Estimates cloud count and locations
   - Prioritizes revision areas

5. **analyzeDrawingSetAI(drawingSetId)**
   - Completeness analysis
   - Coordination check
   - Readiness score for construction

## Data Storage Pattern

All server functions use the Spark KV API for data persistence:

```typescript
// Reading data
const rfis = await spark.kv.get<RFI[]>('rfis')
const tasks = await spark.kv.get<Task[]>('tasks')

// Writing data
await spark.kv.set('rfis', updatedRFIs)

// In React components (with reactivity)
const [rfis, setRfis] = useKV<RFI[]>(`rfis-${projectId}`, [])
```

## AI Integration Pattern

Server functions use the Spark LLM API for intelligent analysis:

```typescript
// Create prompt using template literals
const prompt = spark.llmPrompt`You are a construction AI assistant...
Analyze: ${data}
Return JSON: {...}`

// Execute LLM call
const result = await spark.llm(prompt, 'gpt-4o', true) // jsonMode = true
const parsed = JSON.parse(result)
```

## Integration Benefits

1. **Real-time Intelligence**: AI-powered analysis provides actionable insights
2. **Risk Detection**: Automatic identification of schedule, cost, and RFI risks
3. **Proactive Alerts**: Early warning system for project issues
4. **Data-Driven**: Calculations based on actual project data
5. **Consistent UX**: Unified pattern across all analysis features

## Next Steps for Full Integration

1. **RFI Page Enhancements**:
   - Add risk analysis button per RFI
   - Implement automatic escalation workflow
   - Add task linking interface

2. **Drawings Page Enhancements**:
   - QA button on each sheet
   - Scope change detection on revision upload
   - Drawing set readiness dashboard

3. **Global Dashboard**:
   - Portfolio-level aggregation using `getDashboardData()`
   - Cross-project risk visualization
   - Resource allocation insights

4. **Notifications**:
   - Wire notification functions from `src/lib/functions/notifications.ts`
   - Real-time alerts for escalations and risks

5. **Work Packages**:
   - Integrate execution readiness functions
   - Display fabrication and installation status
   - Show readiness scores and blockers

## Technical Notes

- All functions are designed to be non-blocking and async
- Error handling includes fallback values for resilience
- LLM calls have timeout protection
- Data validation occurs at function boundaries
- TypeScript types ensure type safety across the stack

## Testing Recommendations

1. Create test projects with realistic data
2. Verify AI responses are relevant and actionable
3. Test with various project sizes and complexities
4. Validate cost calculations with known scenarios
5. Ensure UI remains responsive during async operations
