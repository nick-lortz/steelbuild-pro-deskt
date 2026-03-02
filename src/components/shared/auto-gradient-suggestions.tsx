import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, Check, X, Info } from '@phosphor-icons/react'
import { useProjectGradient } from '@/hooks/use-gradient'
import { 
  getSmartSuggestions, 
  getSuggestionForNewProject,
  formatSuggestionReason,
  type SuggestionContext,
  type GradientSuggestion 
} from '@/lib/gradient-suggestions'
import { useKV } from '@github/spark/hooks'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

type AutoSuggestionBannerProps = {
  context?: SuggestionContext
  projectId?: string
  onDismiss?: () => void
  className?: string
}

export function AutoSuggestionBanner({ 
  context, 
  projectId,
  onDismiss,
  className 
}: AutoSuggestionBannerProps) {
  const [suggestions, setSuggestions] = useState<GradientSuggestion[]>([])
  const [dismissed, setDismissed] = useKV<Record<string, boolean>>(
    'gradient-suggestions-dismissed',
    {}
  )
  const [applied, setApplied] = useState(false)
  
  const { setProjectGradient, hasCustomGradient } = useProjectGradient(projectId || '')

  useEffect(() => {
    if (!context || !projectId) return
    
    if (dismissed[projectId] || hasCustomGradient) {
      return
    }
    
    const smartSuggestions = getSmartSuggestions(context, 3)
    
    if (smartSuggestions.length > 0 && smartSuggestions[0].confidence !== 'low') {
      setSuggestions(smartSuggestions)
    }
  }, [context, projectId, dismissed, hasCustomGradient])

  const handleApply = (presetId: string) => {
    if (!projectId) return
    
    setProjectGradient(presetId)
    setApplied(true)
    
    setTimeout(() => {
      handleDismiss()
    }, 2000)
  }

  const handleDismiss = () => {
    if (projectId) {
      setDismissed(prev => ({
        ...prev,
        [projectId]: true
      }))
    }
    onDismiss?.()
  }

  if (suggestions.length === 0 || applied) {
    return null
  }

  const topSuggestion = suggestions[0]

  return (
    <Card className={cn(
      "border-primary/30 bg-primary/5 backdrop-blur-sm",
      "animate-in fade-in slide-in-from-top-2 duration-500",
      className
    )}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" weight="fill" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-sm">Smart Aesthetic Suggestion</h4>
                <p className="text-muted-foreground text-xs mt-1">
                  We've detected a perfect gradient match for this project
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 -mt-1 -mr-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-16 rounded border border-border shadow-sm"
                    style={{ background: topSuggestion.preset.previewGradient }}
                  />
                  <div>
                    <p className="font-medium text-sm">{topSuggestion.preset.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatSuggestionReason(topSuggestion.reasons)}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      topSuggestion.confidence === 'high' ? 'default' : 
                      topSuggestion.confidence === 'medium' ? 'secondary' : 
                      'outline'
                    }
                    className="ml-auto"
                  >
                    {topSuggestion.confidence === 'high' ? '95%' : 
                     topSuggestion.confidence === 'medium' ? '75%' : '50%'} match
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                {suggestions.length > 1 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Info className="h-4 w-4 mr-1.5" />
                        +{suggestions.length - 1} more
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">All Suggestions</h4>
                        <Separator />
                        <div className="space-y-3">
                          {suggestions.map((suggestion, idx) => (
                            <div 
                              key={suggestion.preset.id}
                              className="flex items-center gap-2"
                            >
                              <div 
                                className="h-12 w-12 rounded border border-border shadow-sm flex-shrink-0"
                                style={{ background: suggestion.preset.previewGradient }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{suggestion.preset.name}</p>
                                  {idx === 0 && (
                                    <Badge variant="default" className="text-xs">
                                      Top pick
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-xs truncate">
                                  {formatSuggestionReason(suggestion.reasons)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-shrink-0"
                                onClick={() => handleApply(suggestion.preset.id)}
                              >
                                Apply
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                <Button 
                  size="sm"
                  onClick={() => handleApply(topSuggestion.preset.id)}
                  className="gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Apply Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

type InlineGradientSuggestionsProps = {
  projectType?: string
  projectName?: string
  client?: string
  onSelect?: (presetId: string) => void
  className?: string
}

export function InlineGradientSuggestions({
  projectType,
  projectName,
  client,
  onSelect,
  className
}: InlineGradientSuggestionsProps) {
  const suggestions = getSuggestionForNewProject(projectType, projectName, client)

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" weight="fill" />
        <p className="text-sm font-medium">Suggested Themes</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.slice(0, 3).map((suggestion) => (
          <button
            key={suggestion.preset.id}
            onClick={() => onSelect?.(suggestion.preset.id)}
            className={cn(
              "relative flex items-start gap-3 rounded-lg border p-3",
              "bg-card text-left transition-all hover:bg-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div 
              className="h-12 w-12 rounded border border-border shadow-sm flex-shrink-0"
              style={{ background: suggestion.preset.previewGradient }}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{suggestion.preset.name}</p>
                {suggestion.confidence === 'high' && (
                  <Badge variant="default" className="text-xs">
                    Best match
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatSuggestionReason(suggestion.reasons)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
