# Gradient Preset System

## Overview

The SteelBuild Pro gradient preset system allows users to customize background gradients for specific project types, industries, moods, seasons, and custom preferences. This creates a more personalized and contextually relevant user experience.

## Features

### 1. **Pre-Built Gradient Library**
- **25+ curated gradient presets** organized by category:
  - **Project Types**: Structural Steel, Commercial, Industrial, Infrastructure, Residential, High-Rise, etc.
  - **Industries**: Energy, Data Center, Healthcare, Maritime, etc.
  - **Moods**: Focus Flow, Energy Boost, Creative Spark, Calm Confidence
  - **Seasonal**: Spring Renewal, Summer Heat, Autumn Harvest, Winter Steel
  - **Custom**: Midnight Carbon, Neon Night, Forest Canopy, Desert Dusk, Arctic Aurora

### 2. **User Preferences**
- Set a **default gradient** for all projects
- Assign **custom gradients per project**
- Enable/disable **auto-suggestions** based on project type
- Toggle **animated transitions** between gradients

### 3. **Custom Gradients**
- Create your own gradients using Tailwind CSS classes
- Define custom accent colors (OKLCH format)
- Save and reuse custom gradients across projects

### 4. **Smart Suggestions**
- Automatically suggest relevant gradients when creating projects
- Recommendations based on project type/industry
- Seasonal suggestions for time-appropriate aesthetics

## Architecture

### Core Files

#### `/src/lib/gradient-presets.ts`
Contains all gradient definitions and utility functions:
```typescript
export type GradientPreset = {
  id: string
  name: string
  description: string
  category: 'project-type' | 'industry' | 'mood' | 'seasonal' | 'custom'
  projectTypes?: string[]
  gradient: string
  accentColor?: string
  previewGradient: string
}
```

**Key Functions:**
- `getPresetsByCategory(category)` - Filter presets by category
- `getPresetsByProjectType(projectType)` - Find matching presets for a project type
- `getPresetById(id)` - Retrieve a specific preset
- `getSuggestedPresets(projectType, season)` - Get smart recommendations

#### `/src/hooks/use-gradient.ts`
React hook for accessing gradient preferences:
```typescript
const { 
  gradientClass, 
  accentColor, 
  presetName, 
  animateTransitions,
  suggestions 
} = useGradient(projectId, projectType)
```

#### `/src/hooks/use-gradient.ts` (Project-specific)
Hook for managing per-project gradients:
```typescript
const { 
  gradientClass, 
  setProjectGradient, 
  clearProjectGradient,
  hasCustomGradient 
} = useProjectGradient(projectId)
```

#### `/src/components/settings/gradient-settings-card.tsx`
Full-featured settings UI for managing gradient preferences

#### `/src/components/projects/gradient-selector.tsx`
Dialog component for selecting gradients within project context

## Usage Examples

### 1. Apply Gradient to a Page

```tsx
import { useGradient } from '@/hooks/use-gradient'

function ProjectDashboard({ projectId, projectType }) {
  const { gradientClass, animateTransitions } = useGradient(projectId, projectType)
  
  return (
    <div className={`min-h-screen ${gradientClass} ${animateTransitions ? 'transition-all duration-700' : ''}`}>
      {/* Page content */}
    </div>
  )
}
```

### 2. Add Gradient Selector to Project Settings

```tsx
import { GradientSelector } from '@/components/projects/gradient-selector'

function ProjectSettings({ project }) {
  return (
    <div>
      <h3>Appearance</h3>
      <GradientSelector 
        projectId={project.id} 
        projectType={project.type}
        onSelect={(presetId) => {
          console.log('Selected gradient:', presetId)
        }}
      />
    </div>
  )
}
```

### 3. Get Smart Suggestions

```tsx
import { getSuggestedPresets } from '@/lib/gradient-presets'

function CreateProjectForm() {
  const [projectType, setProjectType] = useState('Structural Steel')
  const suggestions = getSuggestedPresets(projectType)
  
  return (
    <div>
      <h4>Suggested Themes</h4>
      {suggestions.map(preset => (
        <PresetCard key={preset.id} preset={preset} />
      ))}
    </div>
  )
}
```

### 4. Create Custom Gradient

```tsx
import { useKV } from '@github/spark/hooks'
import { DEFAULT_GRADIENT_PREFERENCES } from '@/lib/gradient-presets'

function AddCustomGradient() {
  const [preferences, setPreferences] = useKV('gradient-preferences', DEFAULT_GRADIENT_PREFERENCES)
  
  const handleAdd = () => {
    setPreferences(prev => ({
      ...prev,
      customGradients: [
        ...prev.customGradients,
        {
          id: `custom-${Date.now()}`,
          name: 'My Gradient',
          gradient: 'bg-gradient-to-br from-blue-950 to-purple-950',
          accentColor: 'oklch(0.65 0.20 260)'
        }
      ]
    }))
  }
  
  return <button onClick={handleAdd}>Add Custom Gradient</button>
}
```

## Gradient Categories

### Project Types
Optimized for specific construction project types:
- **Steel Forge**: Structural steel projects (metallic blues, silvers)
- **Commercial Rise**: Commercial buildings (professional blues, purples)
- **Industrial Power**: Heavy industrial work (bold oranges, reds)
- **Infrastructure Core**: Bridges and infrastructure (solid grays, teals)
- **Residential Modern**: Residential steel framing (warm earth tones)
- **High-Rise Elite**: Premium high-rise projects (black and gold)

### Industries
Specialized for different industry sectors:
- **Energy Grid**: Power and utility projects (electric greens, blues)
- **Data Center Tech**: Technology facilities (cool tech gradients)
- **Healthcare Calm**: Medical facilities (soothing blues, greens)
- **Maritime Deep**: Port and marine construction (ocean blues)

### Moods
Designed to match work style and focus:
- **Focus Flow**: Minimal, distraction-free
- **Energy Boost**: Vibrant for high-energy work
- **Creative Spark**: Inspiring purples and pinks
- **Calm Confidence**: Balanced blues

### Seasonal
Time-appropriate aesthetics:
- **Spring Renewal**: Fresh greens and soft blues
- **Summer Heat**: Warm oranges and yellows
- **Autumn Harvest**: Rich browns and golds
- **Winter Steel**: Cool silvers and icy blues

### Custom
Unique artistic choices:
- **Midnight Carbon**: Pure black with carbon fiber texture
- **Neon Night**: Cyberpunk-inspired neon accents
- **Forest Canopy**: Deep greens with natural warmth
- **Desert Dusk**: Warm earth tones with sunset hues
- **Arctic Aurora**: Northern lights-inspired

## Data Storage

All gradient preferences are stored using the `useKV` hook in the key `gradient-preferences`:

```typescript
{
  defaultPreset: string          // Default gradient ID
  projectPresets: {              // Project-specific overrides
    [projectId]: string          // Gradient ID per project
  }
  autoSuggest: boolean           // Enable auto-suggestions
  animateTransitions: boolean    // Enable animated transitions
  customGradients: Array<{       // User-created gradients
    id: string
    name: string
    gradient: string
    accentColor?: string
  }>
}
```

## Color Format

All accent colors use the **OKLCH** color space for perceptual uniformity:
```
oklch(lightness chroma hue)
```

Examples:
- `oklch(0.68 0.18 240)` - Blue accent
- `oklch(0.65 0.20 45)` - Orange accent
- `oklch(0.60 0.15 200)` - Cyan accent

## Best Practices

1. **Use semantic gradient choices**: Match gradient to project type when possible
2. **Enable animations judiciously**: Transitions are beautiful but can be distracting
3. **Test contrast**: Ensure text remains readable on all gradient backgrounds
4. **Provide fallbacks**: Always have a default gradient for edge cases
5. **Document custom gradients**: Add clear names and descriptions for team clarity

## Extending the System

### Adding New Presets

Add to the `GRADIENT_PRESETS` array in `/src/lib/gradient-presets.ts`:

```typescript
{
  id: 'aerospace-tech',
  name: 'Aerospace Tech',
  description: 'Precision engineering aesthetic for aerospace projects',
  category: 'industry',
  projectTypes: ['Aerospace', 'Aviation', 'Defense'],
  gradient: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900',
  accentColor: 'oklch(0.62 0.18 260)',
  previewGradient: 'linear-gradient(to bottom right, #020617, #1e1b4b, #0f172a)',
}
```

### Creating New Categories

Extend the `category` type:

```typescript
category: 'project-type' | 'industry' | 'mood' | 'seasonal' | 'custom' | 'geographic' | 'client-brand'
```

## Integration with Existing Features

The gradient system integrates with:
- **Global Settings**: Appearance tab in settings
- **Project Settings**: Per-project gradient selector
- **Dashboard**: Dynamic backgrounds based on active project
- **Reports**: Themed export documents
- **Branding**: Client-specific color schemes

## Performance Considerations

- Gradients are CSS-only (no images), resulting in minimal performance impact
- Transitions use GPU-accelerated properties (`opacity`, `transform`)
- Preferences stored in localStorage via `useKV` for instant access
- No network requests required for gradient application

## Future Enhancements

- **Gradient animations**: Subtle animated gradients for hero sections
- **Time-based auto-switching**: Automatic seasonal gradient rotation
- **Team sharing**: Export/import gradient themes
- **Color palette extraction**: Generate complementary UI colors from gradient
- **A11y modes**: High-contrast variants for accessibility
- **AI suggestions**: ML-powered gradient recommendations based on usage patterns

## Troubleshooting

**Gradient not applying:**
- Check that `useGradient` hook is called correctly
- Verify the gradient class is added to the root element
- Ensure Tailwind CSS is processing the gradient classes

**Custom gradient not saving:**
- Verify the gradient string is valid Tailwind syntax
- Check browser console for KV storage errors
- Ensure the custom gradient has a unique ID

**Animations choppy:**
- Disable animations for low-performance devices
- Check that `transition-all duration-700` is applied
- Reduce complexity of nested animations

## Support

For questions or issues with the gradient system:
1. Check this documentation
2. Review example implementations in `/src/components/projects/`
3. Test in Global Settings > Appearance tab
4. Verify data in browser DevTools > Application > Local Storage

---

**Version**: 1.0  
**Last Updated**: 2025  
**Maintainer**: SteelBuild Pro Development Team
