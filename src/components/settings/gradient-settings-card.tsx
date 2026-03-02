import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  GRADIENT_PRESETS, 
  getPresetsByCategory, 
  getPresetById,
  getSuggestedPresets,
  type UserGradientPreferences,
  DEFAULT_GRADIENT_PREFERENCES
} from '@/lib/gradient-presets'
import { toast } from 'sonner'
import { 
  Palette, 
  Sparkle, 
  CheckCircle, 
  Plus,
  Trash,
  ArrowClockwise
} from '@phosphor-icons/react'

export function GradientSettingsCard() {
  const [preferences, setPreferences] = useKV<UserGradientPreferences>(
    'gradient-preferences',
    DEFAULT_GRADIENT_PREFERENCES
  )
  const [activeCategory, setActiveCategory] = useState<string>('project-type')
  const [customName, setCustomName] = useState('')
  const [customGradient, setCustomGradient] = useState('')
  const [customAccent, setCustomAccent] = useState('')

  const currentPreset = getPresetById(preferences.defaultPreset)

  const handleSelectPreset = (presetId: string) => {
    setPreferences(prev => ({
      ...prev,
      defaultPreset: presetId
    }))
    toast.success('Gradient preset updated', {
      description: `Applied ${getPresetById(presetId)?.name}`
    })
  }

  const handleToggleAutoSuggest = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      autoSuggest: enabled
    }))
  }

  const handleToggleAnimations = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      animateTransitions: enabled
    }))
  }

  const handleAddCustomGradient = () => {
    if (!customName || !customGradient) {
      toast.error('Please provide both name and gradient CSS')
      return
    }

    const newGradient = {
      id: `custom-${Date.now()}`,
      name: customName,
      gradient: customGradient,
      accentColor: customAccent || undefined
    }

    setPreferences(prev => ({
      ...prev,
      customGradients: [...prev.customGradients, newGradient]
    }))

    setCustomName('')
    setCustomGradient('')
    setCustomAccent('')
    
    toast.success('Custom gradient added')
  }

  const handleDeleteCustomGradient = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      customGradients: prev.customGradients.filter(g => g.id !== id)
    }))
    toast.success('Custom gradient removed')
  }

  const handleReset = () => {
    setPreferences(DEFAULT_GRADIENT_PREFERENCES)
    toast.success('Gradient preferences reset to defaults')
  }

  const categories = [
    { id: 'project-type', label: 'Project Types', icon: Palette },
    { id: 'industry', label: 'Industries', icon: Palette },
    { id: 'mood', label: 'Moods', icon: Sparkle },
    { id: 'seasonal', label: 'Seasonal', icon: Sparkle },
    { id: 'custom', label: 'Custom', icon: Plus },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette className="w-5 h-5 text-primary" weight="duotone" />
            </div>
            <div>
              <CardTitle>Gradient Themes</CardTitle>
              <CardDescription>
                Customize background gradients for different project types and preferences
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <ArrowClockwise className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Current Theme</Label>
              <p className="text-sm text-muted-foreground">
                {currentPreset?.name || 'Default'}
              </p>
            </div>
            <div 
              className="w-32 h-16 rounded-lg border-2 border-border shadow-md"
              style={{ background: currentPreset?.previewGradient }}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-suggest">Auto-Suggest by Project Type</Label>
              <Switch
                id="auto-suggest"
                checked={preferences.autoSuggest}
                onCheckedChange={handleToggleAutoSuggest}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically suggest gradients based on project type when creating new projects
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="animate">Animate Transitions</Label>
              <Switch
                id="animate"
                checked={preferences.animateTransitions}
                onCheckedChange={handleToggleAnimations}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Smooth animated transitions when switching between gradient themes
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-primary" weight="fill" />
            <h4 className="font-semibold">Gradient Library</h4>
          </div>

          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-5">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.slice(0, 4).map(cat => (
              <TabsContent key={cat.id} value={cat.id} className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid gap-3">
                    {getPresetsByCategory(cat.id as any).map(preset => {
                      const isActive = preferences.defaultPreset === preset.id
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`
                            relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                            ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          `}
                        >
                          {isActive && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="w-5 h-5 text-primary" weight="fill" />
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-16 h-16 rounded-md border border-border shadow-sm flex-shrink-0"
                              style={{ background: preset.previewGradient }}
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm mb-1">{preset.name}</h5>
                              <p className="text-xs text-muted-foreground mb-2">
                                {preset.description}
                              </p>
                              {preset.projectTypes && preset.projectTypes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {preset.projectTypes.slice(0, 2).map(type => (
                                    <Badge key={type} variant="secondary" className="text-xs">
                                      {type}
                                    </Badge>
                                  ))}
                                  {preset.projectTypes.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{preset.projectTypes.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}

            <TabsContent value="custom" className="mt-4">
              <div className="space-y-4">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base">Create Custom Gradient</CardTitle>
                    <CardDescription className="text-xs">
                      Add your own gradient using Tailwind classes or CSS
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="custom-name">Name</Label>
                      <Input
                        id="custom-name"
                        placeholder="My Custom Gradient"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-gradient">Gradient CSS Class</Label>
                      <Input
                        id="custom-gradient"
                        placeholder="bg-gradient-to-br from-blue-950 to-purple-950"
                        value={customGradient}
                        onChange={(e) => setCustomGradient(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use Tailwind gradient classes or custom CSS
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-accent">Accent Color (Optional)</Label>
                      <Input
                        id="custom-accent"
                        placeholder="oklch(0.65 0.20 240)"
                        value={customAccent}
                        onChange={(e) => setCustomAccent(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleAddCustomGradient}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Gradient
                    </Button>
                  </CardContent>
                </Card>

                <Separator />

                <div className="space-y-3">
                  <h5 className="font-semibold text-sm">Your Custom Gradients</h5>
                  {preferences.customGradients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No custom gradients yet
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="grid gap-3">
                        {preferences.customGradients.map(gradient => {
                          const isActive = preferences.defaultPreset === gradient.id
                          return (
                            <div
                              key={gradient.id}
                              className={`
                                relative p-4 rounded-lg border-2 transition-all
                                ${isActive ? 'border-primary bg-primary/5' : 'border-border'}
                              `}
                            >
                              {isActive && (
                                <div className="absolute top-2 right-10">
                                  <CheckCircle className="w-5 h-5 text-primary" weight="fill" />
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteCustomGradient(gradient.id)}
                                className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded transition-colors"
                              >
                                <Trash className="w-4 h-4 text-destructive" />
                              </button>
                              <button
                                onClick={() => handleSelectPreset(gradient.id)}
                                className="flex items-start gap-3 w-full text-left"
                              >
                                <div 
                                  className={`w-16 h-16 rounded-md border border-border shadow-sm flex-shrink-0 ${gradient.gradient}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-sm mb-1">{gradient.name}</h5>
                                  <p className="text-xs text-muted-foreground font-mono break-all">
                                    {gradient.gradient}
                                  </p>
                                </div>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h5 className="font-semibold text-sm">Browse More Presets</h5>
                  <ScrollArea className="h-[200px]">
                    <div className="grid gap-3">
                      {GRADIENT_PRESETS.filter(p => p.category === 'custom').map(preset => {
                        const isActive = preferences.defaultPreset === preset.id
                        return (
                          <button
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset.id)}
                            className={`
                              relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                              ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                            `}
                          >
                            {isActive && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="w-5 h-5 text-primary" weight="fill" />
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-16 h-16 rounded-md border border-border shadow-sm flex-shrink-0"
                                style={{ background: preset.previewGradient }}
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-sm mb-1">{preset.name}</h5>
                                <p className="text-xs text-muted-foreground">
                                  {preset.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
