import { GRADIENT_PRESETS, type GradientPreset } from './gradient-presets'

export type SuggestionContext = {
  projectType?: string
  projectName?: string
  client?: string
  location?: string
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  budget?: 'low' | 'medium' | 'high'
  phase?: 'planning' | 'design' | 'fabrication' | 'erection' | 'closeout'
  industry?: string
}

export type GradientSuggestion = {
  preset: GradientPreset
  score: number
  reasons: string[]
  confidence: 'low' | 'medium' | 'high'
}

const getCurrentSeason = (): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

const detectIndustryFromContext = (context: SuggestionContext): string | undefined => {
  const nameAndClient = `${context.projectName || ''} ${context.client || ''}`.toLowerCase()
  
  if (nameAndClient.includes('hospital') || nameAndClient.includes('medical') || 
      nameAndClient.includes('health')) return 'Healthcare'
  if (nameAndClient.includes('data center') || nameAndClient.includes('server') || 
      nameAndClient.includes('tech')) return 'Data Center'
  if (nameAndClient.includes('power') || nameAndClient.includes('energy') || 
      nameAndClient.includes('solar') || nameAndClient.includes('wind')) return 'Energy'
  if (nameAndClient.includes('port') || nameAndClient.includes('marine') || 
      nameAndClient.includes('dock') || nameAndClient.includes('ship')) return 'Maritime'
  if (nameAndClient.includes('bridge') || nameAndClient.includes('highway') || 
      nameAndClient.includes('infrastructure')) return 'Infrastructure'
  
  return undefined
}

const detectProjectTypeFromContext = (context: SuggestionContext): string | undefined => {
  const nameAndClient = `${context.projectName || ''} ${context.client || ''}`.toLowerCase()
  
  if (nameAndClient.includes('tower') || nameAndClient.includes('high-rise') || 
      nameAndClient.includes('skyscraper')) return 'High-Rise'
  if (nameAndClient.includes('residential') || nameAndClient.includes('apartment') || 
      nameAndClient.includes('housing')) return 'Residential'
  if (nameAndClient.includes('commercial') || nameAndClient.includes('office') || 
      nameAndClient.includes('retail')) return 'Commercial'
  if (nameAndClient.includes('industrial') || nameAndClient.includes('factory') || 
      nameAndClient.includes('plant') || nameAndClient.includes('warehouse')) return 'Industrial'
  
  return context.projectType
}

const scorePresetMatch = (
  preset: GradientPreset,
  context: SuggestionContext
): { score: number; reasons: string[] } => {
  let score = 0
  const reasons: string[] = []
  
  const season = context.season || getCurrentSeason()
  const detectedIndustry = context.industry || detectIndustryFromContext(context)
  const detectedProjectType = detectProjectTypeFromContext(context)
  
  if (detectedProjectType && preset.projectTypes?.some(pt => 
    pt.toLowerCase().includes(detectedProjectType.toLowerCase()) ||
    detectedProjectType.toLowerCase().includes(pt.toLowerCase())
  )) {
    score += 50
    reasons.push(`Matches ${detectedProjectType} project type`)
  }
  
  if (detectedIndustry && preset.projectTypes?.some(pt => 
    pt.toLowerCase().includes(detectedIndustry.toLowerCase())
  )) {
    score += 40
    reasons.push(`Optimized for ${detectedIndustry} industry`)
  }
  
  if (preset.category === 'seasonal') {
    const presetName = preset.name.toLowerCase()
    if (presetName.includes(season)) {
      score += 30
      reasons.push(`Matches current ${season} season`)
    }
  }
  
  if (context.budget === 'high' && preset.id === 'high-rise-elite') {
    score += 20
    reasons.push('Premium aesthetic for high-budget project')
  }
  
  if (context.phase === 'fabrication' && preset.id === 'steel-forge') {
    score += 25
    reasons.push('Ideal for fabrication phase')
  }
  
  if (context.phase === 'erection' && 
      (preset.id === 'industrial-power' || preset.id === 'energy-grid')) {
    score += 20
    reasons.push('Energy-focused for erection phase')
  }
  
  if (preset.category === 'mood') {
    const presetName = preset.name.toLowerCase()
    if (context.phase === 'planning' && presetName.includes('focus')) {
      score += 15
      reasons.push('Focus-oriented for planning phase')
    }
    if (context.phase === 'design' && presetName.includes('creative')) {
      score += 15
      reasons.push('Creative aesthetic for design phase')
    }
  }
  
  if (context.location) {
    const location = context.location.toLowerCase()
    if (location.includes('arctic') || location.includes('alaska') || 
        location.includes('canada')) {
      if (preset.id === 'arctic-aurora' || preset.id === 'winter-steel') {
        score += 20
        reasons.push('Cold-climate inspired aesthetic')
      }
    }
    if (location.includes('desert') || location.includes('arizona') || 
        location.includes('nevada')) {
      if (preset.id === 'desert-dusk') {
        score += 20
        reasons.push('Desert-region inspired aesthetic')
      }
    }
  }
  
  return { score, reasons }
}

export const getSmartSuggestions = (
  context: SuggestionContext,
  limit: number = 5
): GradientSuggestion[] => {
  const scoredPresets = GRADIENT_PRESETS.map(preset => {
    const { score, reasons } = scorePresetMatch(preset, context)
    
    let confidence: 'low' | 'medium' | 'high' = 'low'
    if (score >= 40) confidence = 'high'
    else if (score >= 20) confidence = 'medium'
    
    return {
      preset,
      score,
      reasons,
      confidence
    }
  })
  
  const sorted = scoredPresets
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
  
  if (sorted.length === 0) {
    const defaultPreset = GRADIENT_PRESETS.find(p => p.id === 'steel-forge')
    if (defaultPreset) {
      return [{
        preset: defaultPreset,
        score: 10,
        reasons: ['Default steel construction aesthetic'],
        confidence: 'medium'
      }]
    }
  }
  
  return sorted.slice(0, limit)
}

export const getSuggestionForNewProject = (
  projectType?: string,
  projectName?: string,
  client?: string
): GradientSuggestion[] => {
  return getSmartSuggestions({
    projectType,
    projectName,
    client,
    season: getCurrentSeason()
  })
}

export const getSuggestionForProjectPhase = (
  projectId: string,
  phase: SuggestionContext['phase'],
  projectType?: string
): GradientSuggestion[] => {
  return getSmartSuggestions({
    projectType,
    phase,
    season: getCurrentSeason()
  })
}

export const getSeasonalSuggestion = (): GradientSuggestion[] => {
  const season = getCurrentSeason()
  
  const seasonalPresets = GRADIENT_PRESETS.filter(p => 
    p.category === 'seasonal' && p.name.toLowerCase().includes(season)
  )
  
  return seasonalPresets.map(preset => ({
    preset,
    score: 30,
    reasons: [`Perfect for ${season} season`],
    confidence: 'high' as const
  }))
}

export const formatSuggestionReason = (reasons: string[]): string => {
  if (reasons.length === 0) return 'Recommended for your project'
  if (reasons.length === 1) return reasons[0]
  if (reasons.length === 2) return `${reasons[0]} • ${reasons[1]}`
  return `${reasons[0]} • +${reasons.length - 1} more`
}
