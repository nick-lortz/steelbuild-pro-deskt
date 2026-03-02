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

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'steel-forge',
    name: 'Steel Forge',
    description: 'Metallic blue and silver tones for structural steel projects',
    category: 'project-type',
    projectTypes: ['Structural Steel', 'Steel Fabrication', 'Steel Erection'],
    gradient: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
    accentColor: 'oklch(0.68 0.18 240)',
    previewGradient: 'linear-gradient(to bottom right, #0f172a, #172554, #0f172a)',
  },
  {
    id: 'commercial-rise',
    name: 'Commercial Rise',
    description: 'Professional blues and purples for commercial construction',
    category: 'project-type',
    projectTypes: ['Commercial', 'Office Building', 'Retail'],
    gradient: 'bg-gradient-to-br from-indigo-950 via-blue-900 to-violet-950',
    accentColor: 'oklch(0.65 0.20 260)',
    previewGradient: 'linear-gradient(to bottom right, #1e1b4b, #1e3a8a, #2e1065)',
  },
  {
    id: 'industrial-power',
    name: 'Industrial Power',
    description: 'Bold orange and red accents for heavy industrial work',
    category: 'project-type',
    projectTypes: ['Industrial', 'Manufacturing', 'Plant Construction'],
    gradient: 'bg-gradient-to-br from-zinc-900 via-orange-950 to-zinc-950',
    accentColor: 'oklch(0.68 0.18 45)',
    previewGradient: 'linear-gradient(to bottom right, #18181b, #431407, #18181b)',
  },
  {
    id: 'infrastructure-core',
    name: 'Infrastructure Core',
    description: 'Solid grays and teals for bridge and infrastructure projects',
    category: 'project-type',
    projectTypes: ['Bridge', 'Infrastructure', 'Highway', 'Transportation'],
    gradient: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900',
    accentColor: 'oklch(0.60 0.15 200)',
    previewGradient: 'linear-gradient(to bottom right, #020617, #083344, #0f172a)',
  },
  {
    id: 'residential-modern',
    name: 'Residential Modern',
    description: 'Warm earth tones for residential steel framing',
    category: 'project-type',
    projectTypes: ['Residential', 'Multi-Family', 'Housing'],
    gradient: 'bg-gradient-to-br from-amber-950 via-zinc-900 to-stone-950',
    accentColor: 'oklch(0.68 0.15 60)',
    previewGradient: 'linear-gradient(to bottom right, #451a03, #18181b, #1c1917)',
  },
  {
    id: 'high-rise-elite',
    name: 'High-Rise Elite',
    description: 'Sophisticated black and gold for premium high-rise projects',
    category: 'project-type',
    projectTypes: ['High-Rise', 'Tower', 'Skyscraper'],
    gradient: 'bg-gradient-to-br from-zinc-950 via-amber-950/30 to-zinc-950',
    accentColor: 'oklch(0.75 0.15 80)',
    previewGradient: 'linear-gradient(to bottom right, #09090b, #45140d, #09090b)',
  },
  {
    id: 'energy-grid',
    name: 'Energy Grid',
    description: 'Electric greens and blues for power and utility projects',
    category: 'industry',
    projectTypes: ['Energy', 'Power Plant', 'Utility', 'Solar', 'Wind'],
    gradient: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950',
    accentColor: 'oklch(0.65 0.18 150)',
    previewGradient: 'linear-gradient(to bottom right, #022c22, #042f2e, #020617)',
  },
  {
    id: 'data-center-tech',
    name: 'Data Center Tech',
    description: 'Cool tech-inspired gradients for data center construction',
    category: 'industry',
    projectTypes: ['Data Center', 'Technology', 'Server Facility'],
    gradient: 'bg-gradient-to-br from-violet-950 via-fuchsia-950 to-slate-950',
    accentColor: 'oklch(0.65 0.22 300)',
    previewGradient: 'linear-gradient(to bottom right, #2e1065, #4a044e, #020617)',
  },
  {
    id: 'healthcare-calm',
    name: 'Healthcare Calm',
    description: 'Soothing blues and greens for medical facilities',
    category: 'industry',
    projectTypes: ['Hospital', 'Healthcare', 'Medical Facility'],
    gradient: 'bg-gradient-to-br from-sky-950 via-teal-950 to-slate-900',
    accentColor: 'oklch(0.60 0.15 190)',
    previewGradient: 'linear-gradient(to bottom right, #082f49, #042f2e, #0f172a)',
  },
  {
    id: 'maritime-deep',
    name: 'Maritime Deep',
    description: 'Ocean blues for port and marine construction',
    category: 'industry',
    projectTypes: ['Port', 'Marine', 'Shipyard', 'Dock'],
    gradient: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-indigo-950',
    accentColor: 'oklch(0.58 0.18 220)',
    previewGradient: 'linear-gradient(to bottom right, #172554, #083344, #1e1b4b)',
  },
  {
    id: 'focus-flow',
    name: 'Focus Flow',
    description: 'Minimal and distraction-free for deep work sessions',
    category: 'mood',
    gradient: 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950',
    accentColor: 'oklch(0.65 0.05 250)',
    previewGradient: 'linear-gradient(to bottom right, #09090b, #18181b, #09090b)',
  },
  {
    id: 'energy-boost',
    name: 'Energy Boost',
    description: 'Vibrant oranges and reds for high-energy work',
    category: 'mood',
    gradient: 'bg-gradient-to-br from-rose-950 via-orange-950 to-red-950',
    accentColor: 'oklch(0.68 0.22 35)',
    previewGradient: 'linear-gradient(to bottom right, #4c0519, #431407, #450a0a)',
  },
  {
    id: 'creative-spark',
    name: 'Creative Spark',
    description: 'Inspiring purples and pinks for innovation',
    category: 'mood',
    gradient: 'bg-gradient-to-br from-purple-950 via-pink-950 to-fuchsia-950',
    accentColor: 'oklch(0.65 0.24 320)',
    previewGradient: 'linear-gradient(to bottom right, #3b0764, #500724, #4a044e)',
  },
  {
    id: 'calm-confidence',
    name: 'Calm Confidence',
    description: 'Balanced blues for steady productivity',
    category: 'mood',
    gradient: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950',
    accentColor: 'oklch(0.62 0.16 240)',
    previewGradient: 'linear-gradient(to bottom right, #020617, #172554, #020617)',
  },
  {
    id: 'spring-renewal',
    name: 'Spring Renewal',
    description: 'Fresh greens and soft blues for spring projects',
    category: 'seasonal',
    gradient: 'bg-gradient-to-br from-teal-950 via-emerald-950 to-green-950',
    accentColor: 'oklch(0.65 0.18 140)',
    previewGradient: 'linear-gradient(to bottom right, #042f2e, #022c22, #052e16)',
  },
  {
    id: 'summer-heat',
    name: 'Summer Heat',
    description: 'Warm oranges and yellows for summer builds',
    category: 'seasonal',
    gradient: 'bg-gradient-to-br from-amber-950 via-orange-950 to-yellow-950',
    accentColor: 'oklch(0.70 0.18 60)',
    previewGradient: 'linear-gradient(to bottom right, #451a03, #431407, #422006)',
  },
  {
    id: 'autumn-harvest',
    name: 'Autumn Harvest',
    description: 'Rich browns and golds for fall season',
    category: 'seasonal',
    gradient: 'bg-gradient-to-br from-orange-950 via-amber-950 to-stone-950',
    accentColor: 'oklch(0.68 0.16 50)',
    previewGradient: 'linear-gradient(to bottom right, #431407, #451a03, #1c1917)',
  },
  {
    id: 'winter-steel',
    name: 'Winter Steel',
    description: 'Cool silvers and icy blues for winter projects',
    category: 'seasonal',
    gradient: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950',
    accentColor: 'oklch(0.60 0.14 210)',
    previewGradient: 'linear-gradient(to bottom right, #020617, #083344, #172554)',
  },
  {
    id: 'midnight-carbon',
    name: 'Midnight Carbon',
    description: 'Pure black with subtle carbon fiber texture',
    category: 'custom',
    gradient: 'bg-gradient-to-br from-black via-zinc-950 to-black',
    accentColor: 'oklch(0.70 0.20 240)',
    previewGradient: 'linear-gradient(to bottom right, #000000, #09090b, #000000)',
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    description: 'Cyberpunk-inspired neon accents',
    category: 'custom',
    gradient: 'bg-gradient-to-br from-violet-950 via-fuchsia-950 to-cyan-950',
    accentColor: 'oklch(0.70 0.25 310)',
    previewGradient: 'linear-gradient(to bottom right, #2e1065, #4a044e, #083344)',
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    description: 'Deep greens with natural warmth',
    category: 'custom',
    gradient: 'bg-gradient-to-br from-green-950 via-emerald-950 to-teal-950',
    accentColor: 'oklch(0.65 0.18 145)',
    previewGradient: 'linear-gradient(to bottom right, #052e16, #022c22, #042f2e)',
  },
  {
    id: 'desert-dusk',
    name: 'Desert Dusk',
    description: 'Warm earth tones with sunset hues',
    category: 'custom',
    gradient: 'bg-gradient-to-br from-orange-950 via-rose-950 to-stone-950',
    accentColor: 'oklch(0.68 0.18 40)',
    previewGradient: 'linear-gradient(to bottom right, #431407, #4c0519, #1c1917)',
  },
  {
    id: 'arctic-aurora',
    name: 'Arctic Aurora',
    description: 'Northern lights-inspired gradient',
    category: 'custom',
    gradient: 'bg-gradient-to-br from-teal-950 via-purple-950 to-blue-950',
    accentColor: 'oklch(0.65 0.20 270)',
    previewGradient: 'linear-gradient(to bottom right, #042f2e, #3b0764, #172554)',
  },
]

export function getPresetsByCategory(category: GradientPreset['category']) {
  return GRADIENT_PRESETS.filter(preset => preset.category === category)
}

export function getPresetsByProjectType(projectType: string) {
  return GRADIENT_PRESETS.filter(preset => 
    preset.projectTypes?.some(type => 
      type.toLowerCase().includes(projectType.toLowerCase()) ||
      projectType.toLowerCase().includes(type.toLowerCase())
    )
  )
}

export function getPresetById(id: string) {
  return GRADIENT_PRESETS.find(preset => preset.id === id)
}

export function getSuggestedPresets(projectType?: string, season?: string) {
  const suggestions: GradientPreset[] = []
  
  if (projectType) {
    suggestions.push(...getPresetsByProjectType(projectType).slice(0, 3))
  }
  
  if (season && suggestions.length < 5) {
    const seasonalPresets = GRADIENT_PRESETS.filter(p => 
      p.category === 'seasonal' && 
      p.name.toLowerCase().includes(season.toLowerCase())
    )
    suggestions.push(...seasonalPresets)
  }
  
  while (suggestions.length < 5) {
    const random = GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)]
    if (!suggestions.includes(random)) {
      suggestions.push(random)
    }
  }
  
  return suggestions.slice(0, 5)
}

export type UserGradientPreferences = {
  defaultPreset: string
  projectPresets: Record<string, string>
  autoSuggest: boolean
  animateTransitions: boolean
  customGradients: Array<{
    id: string
    name: string
    gradient: string
    accentColor?: string
  }>
}

export const DEFAULT_GRADIENT_PREFERENCES: UserGradientPreferences = {
  defaultPreset: 'steel-forge',
  projectPresets: {},
  autoSuggest: true,
  animateTransitions: true,
  customGradients: [],
}
