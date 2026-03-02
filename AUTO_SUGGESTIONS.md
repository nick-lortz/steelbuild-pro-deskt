# Auto-Gradient Suggestions System

## Overview

The Auto-Gradient Suggestions system automatically recommends gradient themes for projects based on contextual information such as project type, name, client, location, budget, and current phase. This intelligent system analyzes project characteristics and suggests the most appropriate aesthetic from SteelBuild Pro's curated gradient library.

## Features

### 1. **Smart Context Analysis**
The system analyzes multiple data points to make intelligent suggestions:
- **Project Type**: Matches structural steel, commercial, industrial, etc.
- **Project Name**: Detects keywords like "tower", "hospital", "bridge"
- **Client Name**: Identifies industry-specific terminology
- **Location**: Geographic region influences (arctic, desert, etc.)
- **Budget Level**: High-budget projects get premium aesthetics
- **Project Phase**: Different gradients for planning vs. fabrication
- **Season**: Time-appropriate seasonal themes

### 2. **Confidence Scoring**
Each suggestion includes:
- **Score**: Numerical match quality (0-100+)
- **Confidence Level**: Low, Medium, or High
- **Reasons**: Explicit explanation of why the gradient matches
- **Match Percentage**: User-friendly percentage display

### 3. **Auto-Presentation**
Suggestions appear automatically:
- **Banner on Project Dashboard**: Shows when entering a new project
- **Inline in Creation Form**: Real-time suggestions as user types
- **Dismissible**: User can hide suggestions permanently per project
- **One-Click Apply**: Instant gradient application

### 4. **Multi-Context Support**
Different suggestion modes for various scenarios:
- New project creation
- Project phase transitions
- Seasonal changes
- Location-based aesthetics

## Components

### `AutoSuggestionBanner`
A prominent banner that appears at the top of project dashboards:
```tsx
<AutoSuggestionBanner 
  context={{
    projectType: 'Structural Steel',
    projectName: 'ASM Garage Tower',
    client: 'ASM Corporation',
    location: 'Seattle, WA',
    budget: 'high',
    phase: 'fabrication'
  }}
  projectId="project-123"
  onDismiss={() => {}}
/>
```

**Features:**
- Shows top suggestion prominently
- Displays match percentage badge
- Lists primary reason for match
- "Apply Now" button for instant activation
- "View More" popover for additional suggestions
- Dismissible with persistent state

### `InlineGradientSuggestions`
Compact suggestions displayed inline in forms:
```tsx
<InlineGradientSuggestions
  projectType="High-Rise"
  projectName="Downtown Tower"
  client="Metropolitan Construction"
  onSelect={(presetId) => setSelectedGradient(presetId)}
/>
```

**Features:**
- Shows top 3 suggestions
- Grid layout with preview squares
- "Best match" badge on top pick
- Click to select for application
- Auto-updates as form fields change

## Smart Suggestion Algorithm

### Scoring System

The algorithm assigns points based on various match criteria:

| Match Type | Points | Condition |
|------------|--------|-----------|
| Project Type Match | 50 | Direct match with preset's project types |
| Industry Match | 40 | Detected industry matches preset |
| Seasonal Match | 30 | Current season matches seasonal preset |
| Budget-Premium Match | 20 | High budget + premium aesthetic preset |
| Phase-Fabrication | 25 | Fabrication phase + Steel Forge preset |
| Phase-Erection | 20 | Erection phase + energy-focused preset |
| Phase-Planning Focus | 15 | Planning phase + focus-oriented mood |
| Phase-Design Creative | 15 | Design phase + creative mood preset |
| Location-Arctic | 20 | Cold climate + arctic/winter presets |
| Location-Desert | 20 | Desert region + desert-themed preset |

### Confidence Levels
- **High (≥40 points)**: Strong contextual match, 95% displayed
- **Medium (20-39 points)**: Moderate match, 75% displayed
- **Low (<20 points)**: Weak match, 50% displayed

### Fallback Behavior
If no suggestions score above 0:
- Returns "Steel Forge" as default
- Shows "Default steel construction aesthetic" as reason
- Confidence set to "medium"

## Context Detection

### Industry Auto-Detection
Keywords in project name or client:
```typescript
'hospital' | 'medical' | 'health' → Healthcare
'data center' | 'server' | 'tech' → Data Center
'power' | 'energy' | 'solar' | 'wind' → Energy
'port' | 'marine' | 'dock' | 'ship' → Maritime
'bridge' | 'highway' | 'infrastructure' → Infrastructure
```

### Project Type Auto-Detection
Keywords in project name or client:
```typescript
'tower' | 'high-rise' | 'skyscraper' → High-Rise
'residential' | 'apartment' | 'housing' → Residential
'commercial' | 'office' | 'retail' → Commercial
'industrial' | 'factory' | 'plant' | 'warehouse' → Industrial
```

### Season Detection
Automatically determines current season based on month:
- **Spring**: March-May (months 2-4)
- **Summer**: June-August (months 5-7)
- **Autumn**: September-November (months 8-10)
- **Winter**: December-February (months 11, 0-1)

## Integration Points

### Project Dashboard
When a user opens a project dashboard, the system:
1. Checks if gradient is already customized (skip if yes)
2. Checks if suggestions were dismissed (skip if yes)
3. Analyzes project context
4. Scores all presets
5. Shows banner if confidence ≥ medium

### Project Creation Form
As the user fills out the form:
1. Watches `projectType`, `projectName`, `client` fields
2. Re-calculates suggestions on each change
3. Shows inline suggestions if any field has data
4. Updates in real-time as user types
5. Stores selected preset ID
6. Applies gradient after project creation

### Project Settings
Users can manually trigger suggestions:
1. Opens gradient selector
2. Shows "Smart Suggestions" tab
3. Displays all suggestions with scores
4. Allows manual selection

## Suggestion Functions

### `getSmartSuggestions(context, limit)`
Main function that returns scored and ranked suggestions:
```typescript
const suggestions = getSmartSuggestions({
  projectType: 'Structural Steel',
  projectName: 'Tower Project',
  client: 'ABC Corp',
  location: 'Phoenix, AZ',
  season: 'summer',
  budget: 'medium',
  phase: 'design'
}, 5)
```

**Returns:**
```typescript
[
  {
    preset: GradientPreset,
    score: 75,
    reasons: ['Matches Structural Steel project type', 'Ideal for design phase'],
    confidence: 'high'
  },
  ...
]
```

### `getSuggestionForNewProject(projectType, projectName, client)`
Simplified function for new project forms:
```typescript
const suggestions = getSuggestionForNewProject(
  'High-Rise',
  'Downtown Tower',
  'Metropolitan'
)
```

### `getSuggestionForProjectPhase(projectId, phase, projectType)`
Phase-specific suggestions:
```typescript
const suggestions = getSuggestionForProjectPhase(
  'project-123',
  'fabrication',
  'Structural Steel'
)
```

### `getSeasonalSuggestion()`
Current seasonal recommendations:
```typescript
const seasonalSuggestions = getSeasonalSuggestion()
```

### `formatSuggestionReason(reasons)`
Formats multiple reasons into user-friendly text:
```typescript
formatSuggestionReason([
  'Matches Structural Steel',
  'Optimized for fabrication',
  'Current season match'
])
// Returns: "Matches Structural Steel • +2 more"
```

## Persistent State

### Dismissed Suggestions
Stored in KV: `gradient-suggestions-dismissed`
```typescript
{
  'project-123': true,
  'project-456': true
}
```

### Applied Gradients
Stored via `useProjectGradient` hook in `gradient-preferences`:
```typescript
{
  projectPresets: {
    'project-123': 'steel-forge',
    'project-456': 'high-rise-elite'
  }
}
```

## User Experience Flow

### New Project Creation
1. User creates new project
2. Enters project type: "High-Rise"
3. Types project name: "Downtown Tower"
4. **Inline suggestions appear automatically**
5. Shows "High-Rise Elite" as best match (95%)
6. Reason: "Matches High-Rise project type"
7. User clicks suggestion
8. Gradient is stored for later application
9. Project is created
10. Gradient automatically applied to project

### Existing Project
1. User opens project dashboard
2. System detects no custom gradient set
3. Analyzes project context
4. **Banner appears at top of dashboard**
5. Shows: "Steel Forge" with 95% match
6. Reason: "Matches Structural Steel • Ideal for fabrication phase"
7. User clicks "Apply Now"
8. Gradient instantly changes
9. Banner shows success animation
10. Banner auto-dismisses after 2 seconds

### Dismissing Suggestions
1. User clicks X button on banner
2. Suggestion is dismissed for this project
3. Stored permanently in KV
4. Will never show again for this project
5. Can still manually select gradients in settings

## Best Practices

### For Developers

**1. Always Provide Context:**
```tsx
<AutoSuggestionBanner 
  context={{
    projectType: project.type,
    projectName: project.name,
    // Include as many fields as available
  }}
  projectId={project.id}
/>
```

**2. Handle Optional Fields:**
```tsx
context={{
  projectType: project.type,
  // Only include if available:
  ...(project.location && { location: project.location }),
  ...(project.phase && { phase: project.phase })
}}
```

**3. Debounce Form Updates:**
```tsx
const debouncedName = useDebounce(watchedName, 300)
<InlineGradientSuggestions projectName={debouncedName} />
```

### For End Users

**1. Provide Descriptive Names:**
- Good: "Memorial Hospital Expansion Tower"
- Better than: "Project 2024-03"

**2. Select Accurate Project Types:**
- Helps suggestions be more relevant
- Can always change later in settings

**3. Don't Dismiss Too Quickly:**
- View all suggestions before dismissing
- Check popover for additional matches

## Extending the System

### Adding New Detection Rules

Edit `/src/lib/gradient-suggestions.ts`:

```typescript
// Add new industry detection
if (nameAndClient.includes('aerospace') || 
    nameAndClient.includes('aviation')) {
  return 'Aerospace'
}

// Add new scoring rule
if (context.contractSize === 'mega' && preset.id === 'high-rise-elite') {
  score += 30
  reasons.push('Mega-project premium aesthetic')
}
```

### Creating Custom Suggestion Sources

```typescript
export const getClientSpecificSuggestion = (
  clientName: string
): GradientSuggestion[] => {
  const clientPreferences = {
    'Acme Corp': 'industrial-power',
    'Tech Industries': 'data-center-tech'
  }
  
  const presetId = clientPreferences[clientName]
  if (presetId) {
    const preset = getPresetById(presetId)
    return [{
      preset,
      score: 60,
      reasons: ['Client brand preference'],
      confidence: 'high'
    }]
  }
  
  return []
}
```

## Performance Considerations

- **Lightweight**: All calculations run client-side
- **Fast**: Scoring algorithm is O(n) where n = number of presets
- **Cached**: Suggestions calculated only when context changes
- **No Network**: All data and logic is local
- **Minimal Re-renders**: Uses React.memo and useMemo internally

## Accessibility

- **Keyboard Navigation**: Full keyboard support in popovers
- **Screen Readers**: Proper ARIA labels on all interactive elements
- **Focus Management**: Logical tab order
- **High Contrast**: All colors meet WCAG AA standards

## Testing

### Unit Tests
```typescript
describe('getSmartSuggestions', () => {
  it('suggests Steel Forge for structural steel projects', () => {
    const suggestions = getSmartSuggestions({
      projectType: 'Structural Steel'
    })
    expect(suggestions[0].preset.id).toBe('steel-forge')
  })
  
  it('prioritizes season when provided', () => {
    const suggestions = getSmartSuggestions({
      season: 'winter'
    })
    expect(suggestions[0].preset.name).toContain('Winter')
  })
})
```

### Integration Tests
```typescript
it('shows banner on project dashboard', async () => {
  render(<ProjectDashboard projectId="test-project" />)
  await waitFor(() => {
    expect(screen.getByText(/Smart Aesthetic Suggestion/)).toBeInTheDocument()
  })
})
```

## Troubleshooting

**Suggestions not appearing:**
- Check that project has no custom gradient set
- Verify project hasn't dismissed suggestions
- Ensure context has enough data (at least project type or name)
- Check browser console for errors

**Wrong suggestions showing:**
- Review project name/type for detection keywords
- Check season is correct (auto-detected)
- Verify context object being passed correctly

**Banner appears on every page load:**
- Check if `dismissed` state is persisting
- Verify KV storage is working
- Clear `gradient-suggestions-dismissed` key if stuck

## Future Enhancements

- **ML-based Suggestions**: Learn from user selections over time
- **Team Preferences**: Share gradient preferences across teams
- **A/B Testing**: Test which suggestions users prefer
- **Usage Analytics**: Track suggestion acceptance rates
- **Time-of-Day**: Different aesthetics for morning vs. evening
- **Weather-Based**: Suggest gradients based on local weather

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Dependencies**: 
- `@/lib/gradient-presets.ts`
- `@/hooks/use-gradient.ts`
- `@github/spark/hooks` (useKV)
