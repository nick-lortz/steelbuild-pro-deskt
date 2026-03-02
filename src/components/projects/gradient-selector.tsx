import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sparkle, CheckCircle } from '@phosphor-icons/react'
import { GRADIENT_PRESETS, type GradientPreset } from '@/lib/gradient-presets'
import { useProjectGradient } from '@/hooks/use-gradient'

interface GradientSelectorProps {
  projectId: string
  projectType?: string
  onSelect?: (presetId: string) => void
}

export function GradientSelector({ projectId, projectType, onSelect }: GradientSelectorProps) {
  const [open, setOpen] = useState(false)
  const { gradientClass, presetName, setProjectGradient, hasCustomGradient } = useProjectGradient(projectId)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const relevantPresets = projectType
    ? GRADIENT_PRESETS.filter(p => 
        p.projectTypes?.some(type => 
          type.toLowerCase().includes(projectType.toLowerCase()) ||
          projectType.toLowerCase().includes(type.toLowerCase())
        )
      )
    : []

  const allPresets = [
    ...relevantPresets,
    ...GRADIENT_PRESETS.filter(p => !relevantPresets.includes(p))
  ]

  const handleSelect = (presetId: string) => {
    setSelectedPreset(presetId)
  }

  const handleApply = () => {
    if (selectedPreset) {
      setProjectGradient(selectedPreset)
      onSelect?.(selectedPreset)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Sparkle className="w-4 h-4" weight="fill" />
        <span>Theme: {presetName}</span>
        {hasCustomGradient && (
          <Badge variant="secondary" className="ml-1">Custom</Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Project Theme</DialogTitle>
            <DialogDescription>
              Choose a gradient background theme for this project
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {relevantPresets.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkle className="w-4 h-4 text-primary" weight="fill" />
                  <h4 className="font-semibold text-sm">Recommended for {projectType}</h4>
                </div>
                <div className="grid gap-3">
                  {relevantPresets.map(preset => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPreset === preset.id}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-sm mb-3">All Themes</h4>
              <div className="grid gap-3">
                {allPresets.map(preset => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedPreset === preset.id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={!selectedPreset}>
              Apply Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PresetCard({ 
  preset, 
  isSelected, 
  onSelect 
}: { 
  preset: GradientPreset
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(preset.id)}
      className={`
        relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
        ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
      `}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-primary" weight="fill" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div 
          className="w-20 h-20 rounded-md border border-border shadow-sm flex-shrink-0"
          style={{ background: preset.previewGradient }}
        />
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-sm mb-1">{preset.name}</h5>
          <p className="text-xs text-muted-foreground mb-2">
            {preset.description}
          </p>
          {preset.projectTypes && preset.projectTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {preset.projectTypes.slice(0, 3).map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
              {preset.projectTypes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{preset.projectTypes.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
