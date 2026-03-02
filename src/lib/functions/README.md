# Server Functions Implementation

This directory contains AI-powered server functions for SteelBuild Pro, leveraging the Spark LLM SDK to provide intelligent analysis and automation across the construction management platform.

## Implemented Function Modules

### Dashboard Functions (`dashboard.ts`)
- **getDashboardData(userId)** - Aggregates project metrics, health scores, and upcoming milestones
- **calculateProjectScheduleHealth(projectId)** - AI-powered schedule health assessment (0-100 score)
- **forecastProjectCost(projectId, horizonDays)** - Predictive cost forecasting with variance analysis
- **computeMarginAtRisk(projectId)** - Financial risk assessment with impact factors
- **getCostRiskSignal(projectId)** - Traffic-light risk indicator (green/yellow/red)

### RFI Functions (`rfi.ts`)
- **listRFIs(projectId)** - Retrieve all RFIs for a project
- **updateRFI(rfiId, updates)** - Update RFI with tracking
- **predictRFIRisk(rfiId)** - AI-powered RFI risk analysis based on age, priority, and status
- **updateRFIEscalation(rfiId, escalate)** - Auto-escalate high-risk RFIs
- **autoUpdateTaskOnRFI(rfiId, action)** - Intelligently link/block/unblock tasks based on RFI content

### Drawings Functions (`drawings.ts`)
- **extractDrawingMetadata(drawingId)** - AI extraction of drawing metadata and disciplines
- **runDrawingQA(drawingId)** - Quality assurance checks with scoring and issues
- **detectScopeChanges(drawingId, previousRevisionId)** - AI detection of scope changes between revisions
- **detectRevisionClouds(drawingId)** - Identify and prioritize revision cloud locations
- **analyzeDrawingSetAI(drawingSetId)** - Comprehensive drawing set readiness analysis

### Work Packages Functions (`work-packages.ts`)
- **evaluateExecutionReadiness(workPackageId)** - Multi-factor readiness assessment
- **getWorkPackageExecutionState(workPackageId)** - Current execution state and progress
- **evaluateWorkPackageExecutionRisk(workPackageId)** - Risk analysis for work package execution
- **computeFabReadiness(workPackageId)** - Fabrication readiness with gap analysis
- **recalculateWPInstallReadiness(workPackageId)** - Installation readiness with prerequisites
- **propagateExecutionImpacts(workPackageId, impactType)** - Cascade analysis for schedule/cost/scope changes

### Data Integrity Functions (`data-integrity.ts`)
- **checkDataIntegrity(projectId?)** - Comprehensive data validation across entities
- **applyAutoFix(issueEntity, issueId, issueType)** - Automated fixes for common data issues
- **runFullAppAudit()** - Full application audit with recommendations
- **cascadeDeleteProject(projectId)** - Safe project deletion with entity cleanup
- **cleanupDuplicateProjects()** - Detect and remove duplicate project numbers
- **validateSecrets()** - Environment variable validation

### Notifications Functions (`notifications.ts`)
- **generateNotifications(projectId)** - Smart notification generation for aging RFIs, overdue tasks, blocked packages
- **notifyDeliveryStatusChange(deliveryId, oldStatus, newStatus)** - Delivery status change notifications with task updates

### Integrations Functions (`integrations.ts`)
- **syncGoogleDrive(projectId, folderId?)** - Google Drive document synchronization
- **getIntegrationStatus(projectId, integrationName)** - Integration connection status and health

## Usage Patterns

All functions use the Spark LLM SDK for AI-powered analysis:

```typescript
import { getDashboardData, forecastProjectCost } from '@/lib/functions'

// Get dashboard metrics
const data = await getDashboardData(userId)

// Forecast costs
const forecast = await forecastProjectCost(projectId, 90)
```

## AI-Powered Features

Functions leverage `spark.llm` and `spark.llmPrompt` for:
- Intelligent risk assessment
- Predictive analytics
- Natural language analysis of project data
- Automated decision support
- Pattern recognition across project entities

## Data Persistence

All functions integrate with the Spark KV store for:
- Reading project and entity data
- Persisting analysis results
- Tracking integration status
- Managing notifications

## Error Handling

Each function includes:
- Try/catch wrappers for LLM calls
- Fallback default values
- Error logging for debugging
- Graceful degradation when AI unavailable
