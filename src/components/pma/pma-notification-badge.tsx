import { useState, useEffect } from 'react'
import { Robot, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { usePMAInsights } from '@/hooks/use-database'
import type { PMAInsight } from '@/types/electron'

interface PMANotificationBadgeProps {
  projectId?: string
  onOpen?: () => void
}

export function PMANotificationBadge({ projectId, onOpen }: PMANotificationBadgeProps) {
  const { insights, loading } = usePMAInsights(projectId)
  const [highSeverityCount, setHighSeverityCount] = useState(0)
  const [recentInsights, setRecentInsights] = useState<PMAInsight[]>([])

  useEffect(() => {
    if (!insights) return

    const highSeverity = insights.filter(
      i => i.severity === 'high' && i.status === 'open'
    )
    setHighSeverityCount(highSeverity.length)

    const recent = highSeverity.slice(0, 3)
    setRecentInsights(recent)
  }, [insights])

  const hasHighRiskRFIs = recentInsights.some(i => i.type === 'rfi-aging')

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Robot className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${hasHighRiskRFIs ? 'animate-pulse' : ''}`}
          onClick={onOpen}
        >
          <Robot
            className={`w-5 h-5 ${hasHighRiskRFIs ? 'text-warning' : 'text-foreground'}`}
            weight={hasHighRiskRFIs ? 'fill' : 'regular'}
          />
          {highSeverityCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {highSeverityCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Robot className="w-4 h-4" weight="duotone" />
              PMA Quick Look
            </h4>
            {highSeverityCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {highSeverityCount} High
              </Badge>
            )}
          </div>

          {recentInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No high-severity insights at this time.
            </p>
          ) : (
            <div className="space-y-2">
              {recentInsights.map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-warning">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Warning className="w-4 h-4 text-warning" weight="fill" />
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs mb-2">
                      {insight.details}
                    </CardDescription>
                    {insight.entity_refs && insight.entity_refs.rfi_id && (
                      <Link
                        to={`/projects/${projectId}/rfis?highlight=${insight.entity_refs.rfi_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View RFI →
                      </Link>
                    )}
                    {insight.entity_refs && insight.entity_refs.task_id && (
                      <Link
                        to={`/projects/${projectId}/schedule?highlight=${insight.entity_refs.task_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View Task →
                      </Link>
                    )}
                    {insight.entity_refs && insight.entity_refs.cost_code_id && (
                      <Link
                        to={`/projects/${projectId}/cost-codes?highlight=${insight.entity_refs.cost_code_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View Cost Code →
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {projectId && (
            <Link to={`/projects/${projectId}/pma/daily-brief`}>
              <Button variant="outline" size="sm" className="w-full">
                View Full Daily Brief
              </Button>
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
