import { useKV } from '@github/spark/hooks'
import { 
  getPresetById, 
  getSuggestedPresets,
  type UserGradientPreferences,
  DEFAULT_GRADIENT_PREFERENCES 
} from '@/lib/gradient-presets'

export function useGradient(projectId?: string, projectType?: string) {
  const [preferences] = useKV<UserGradientPreferences>(
    'gradient-preferences',
    DEFAULT_GRADIENT_PREFERENCES
  )

  let activePresetId = preferences.defaultPreset

  if (projectId && preferences.projectPresets[projectId]) {
    activePresetId = preferences.projectPresets[projectId]
  }

  const activePreset = getPresetById(activePresetId)
  
  if (!activePreset) {
    const customGradient = preferences.customGradients.find(g => g.id === activePresetId)
    if (customGradient) {
      return {
        gradientClass: customGradient.gradient,
        accentColor: customGradient.accentColor,
        presetName: customGradient.name,
        isCustom: true,
        animateTransitions: preferences.animateTransitions,
        suggestions: projectType ? getSuggestedPresets(projectType) : []
      }
    }
  }

  return {
    gradientClass: activePreset?.gradient || 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950',
    accentColor: activePreset?.accentColor,
    presetName: activePreset?.name || 'Default',
    isCustom: false,
    animateTransitions: preferences.animateTransitions,
    suggestions: projectType && preferences.autoSuggest ? getSuggestedPresets(projectType) : []
  }
}

export function useProjectGradient(projectId: string) {
  const [preferences, setPreferences] = useKV<UserGradientPreferences>(
    'gradient-preferences',
    DEFAULT_GRADIENT_PREFERENCES
  )

  const setProjectGradient = (presetId: string) => {
    setPreferences(prev => ({
      ...prev,
      projectPresets: {
        ...prev.projectPresets,
        [projectId]: presetId
      }
    }))
  }

  const clearProjectGradient = () => {
    setPreferences(prev => {
      const { [projectId]: _, ...rest } = prev.projectPresets
      return {
        ...prev,
        projectPresets: rest
      }
    })
  }

  const projectPresetId = preferences.projectPresets[projectId] || preferences.defaultPreset
  const preset = getPresetById(projectPresetId) || 
    preferences.customGradients.find(g => g.id === projectPresetId)

  return {
    gradientClass: preset?.gradient || 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950',
    accentColor: preset?.accentColor,
    presetName: preset?.name || 'Default',
    setProjectGradient,
    clearProjectGradient,
    hasCustomGradient: !!preferences.projectPresets[projectId]
  }
}
