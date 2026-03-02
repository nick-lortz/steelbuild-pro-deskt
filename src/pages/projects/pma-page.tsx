import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Sparkle,
  Warning,
  CheckCircle,
  X,
  CaretRight,
  Gear,
  ArrowRight,
  Calendar,
  TrendUp,
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { PMInsight, PMInsightConfig, PMDailyBrief } from '@/lib/types-pma'
import {
  generateInsightsFromSignals,
  generateDailyBrief,
  resolveInsight,
  dismissInsight,
  getInsightConfig,
  updateInsightConfig,
} from '@/lib/functions/pma-heuristics'

export function PMAPage() {
  const { projectId } = useParams()
  const [insights, setInsights] = useKV<PMInsight[]>(`pm-insights-${projectId}`, [])
  const [dailyBrief, setDailyBrief] = useState<PMDailyBrief | null>(null)
  const [config, setConfig] = useState<Record<string, PMInsightConfig> | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isDismissOpen, setIsDismissOpen] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<PMInsight | null>(null)
  const [dismissReason, setDismissReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [enhanceLLM, setEnhanceLLM] = useState(false)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [brief, cfg] = await Promise.all([
        generateDailyBrief(projectId, enhanceLLM),
        getInsightConfig(projectId),
      ])
      setDailyBrief(brief)
      setConfig(cfg)
    } catch (error) {
      console.error('Failed to load PMA data:', error)
      toast.error('Failed to load PMA data')
    } finally {
      setLoading(false)
    }
  }

  const handleRunScan = async () => {
    if (!projectId) return
    setScanning(true)
    try {
      const newInsights = await generateInsightsFromSignals(projectId)
      if (newInsights.length > 0) {
        setInsights(current => [...(current || []), ...newInsights])
        toast.success(`Generated ${newInsights.length} new insight${newInsights.length !== 1 ? 's' : ''}`)
      } else {
        toast.info('No new insights detected')
      }
      await loadData()
    } catch (error) {
      console.error('Failed to run scan:', error)
      toast.error('Failed to run scan')
    } finally {
      setScanning(false)
    }
  }

  const handleResolve = async (insightId: string) => {
    if (!projectId) return
    try {
      await resolveInsight(projectId, insightId, 'Current User')
      setInsights(current =>
        (current || []).map(i => (i.id === insightId ? { ...i, status: 'resolved' as const } : i))
      )
      toast.success('Insight marked as resolved')
      await loadData()
    } catch (error) {
      console.error('Failed to resolve insight:', error)
      toast.error('Failed to resolve insight')
    }
  }

  const handleDismiss = async () => {
    if (!projectId || !selectedInsight) return
    if (!dismissReason.trim()) {
      toast.error('Please provide a reason for dismissing')
      return
    }
    try {
      await dismissInsight(projectId, selectedInsight.id, 'Current User', dismissReason)
      setInsights(current =>
        (current || []).map(i => (i.id === selectedInsight.id ? { ...i, status: 'dismissed' as const } : i))
      )
      toast.success('Insight dismissed')
      setIsDismissOpen(false)
      setSelectedInsight(null)
      setDismissReason('')
      await loadData()
    } catch (error) {
      console.error('Failed to dismiss insight:', error)
      toast.error('Failed to dismiss insight')
    }
  }

  const handleSaveConfig = async () => {
    if (!projectId || !config) return
    try {
      await updateInsightConfig(projectId, config)
      toast.success('Configuration saved')
      setIsConfigOpen(false)
    } catch (error) {
      console.error('Failed to save config:', error)
      toast.error('Failed to save configuration')
    }
  }

  const getSeverityColor = (severity: PMInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const activeInsights = (insights || []).filter(i => i.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkle size={32} weight="duotone" className="text-accent" />
            Project Management Assistant
          </h1>
          <p className="text-muted-foreground mt-1">
            Deterministic heuristics and AI-powered insights for proactive project management
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Gear size={18} />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>PMA Configuration</DialogTitle>
                <DialogDescription>Configure thresholds and settings for insight detection</DialogDescription>
              </DialogHeader>
              {config && (
                <div className="space-y-4">
                  {Object.entries(config).map(([key, cfg]) => (
                    <Card key={key}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{cfg.type.replace(/-/g, ' ').toUpperCase()}</CardTitle>
                          <Switch
                            checked={cfg.enabled}
                            onCheckedChange={enabled =>
                              setConfig(prev => ({
                                ...prev!,
                                [key]: { ...cfg, enabled },
                              }))
                            }
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(cfg.thresholds).map(([thresholdKey, value]) => (
                          <div key={thresholdKey} className="flex items-center gap-4">
                            <Label className="w-48 text-sm">{thresholdKey.replace(/([A-Z])/g, ' $1')}</Label>
                            <Input
                              type="number"
                              value={value}
                              onChange={e =>
                                setConfig(prev => ({
                                  ...prev!,
                                  [key]: {
                                    ...cfg,
                                    thresholds: {
                                      ...cfg.thresholds,
                                      [thresholdKey]: parseFloat(e.target.value) || 0,
                                    },
                                  },
                                }))
                              }
                              className="w-32"
                            />
                          </div>
                        ))}
                        <div className="flex items-center gap-4 pt-2 border-t">
                          <Label className="w-48 text-sm">Reminder Days</Label>
                          <Input
                            type="number"
                            value={cfg.reminderDays}
                            onChange={e =>
                              setConfig(prev => ({
                                ...prev!,
                                [key]: {
                                  ...cfg,
                                  reminderDays: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="w-32"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveConfig}>Save Configuration</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button onClick={handleRunScan} disabled={scanning} className="gap-2">
            {scanning ? 'Scanning...' : 'Run Scan'}
            <TrendUp size={18} />
          </Button>
        </div>
      </div>

      {dailyBrief && (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={24} className="text-primary" />
                <CardTitle>Daily Briefing</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="enhance-llm" className="text-sm">
                  Enhance with AI
                </Label>
                <Switch id="enhance-llm" checked={enhanceLLM} onCheckedChange={setEnhanceLLM} />
              </div>
            </div>
            <CardDescription>
              {new Date(dailyBrief.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">{dailyBrief.summary}</p>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{dailyBrief.metrics.scheduleHealth.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Schedule Health</p>
                  <Progress value={dailyBrief.metrics.scheduleHealth} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{dailyBrief.metrics.budgetHealth.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Budget Health</p>
                  <Progress value={dailyBrief.metrics.budgetHealth} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{dailyBrief.metrics.rfiResponseTime.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">Avg RFI Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{dailyBrief.metrics.deliveryOnTime.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">On-Time Delivery</p>
                  <Progress value={dailyBrief.metrics.deliveryOnTime} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {dailyBrief.topRisks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Warning size={20} className="text-orange-600" />
                  Top Risks
                </h4>
                <div className="space-y-2">
                  {dailyBrief.topRisks.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                      <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                        {risk.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{risk.title}</p>
                        <p className="text-sm text-muted-foreground">{risk.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dailyBrief.recommendedActions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CaretRight size={20} className="text-primary" />
                  Recommended Actions
                </h4>
                <div className="space-y-2">
                  {dailyBrief.recommendedActions.slice(0, 5).map((action, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={action.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {action.priority}
                        </Badge>
                        <span className="text-sm">{action.action}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={action.link}>
                          <ArrowRight size={16} />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active Insights ({activeInsights.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({(insights || []).filter(i => i.status === 'resolved').length})
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed ({(insights || []).filter(i => i.status === 'dismissed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeInsights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
                <p className="text-lg font-semibold">No Active Insights</p>
                <p className="text-sm text-muted-foreground">All systems operating normally</p>
              </CardContent>
            </Card>
          ) : (
            activeInsights.map(insight => (
              <Card key={insight.id} className="border-l-4" style={{ borderLeftColor: insight.severity === 'critical' ? '#ef4444' : insight.severity === 'high' ? '#f97316' : insight.severity === 'medium' ? '#eab308' : '#3b82f6' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                        <Badge variant="secondary">{insight.type.replace(/-/g, ' ')}</Badge>
                      </div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <CardDescription>{insight.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleResolve(insight.id)}>
                        <CheckCircle size={16} className="mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedInsight(insight)
                          setIsDismissOpen(true)
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insight.dataReferences.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Data References:</p>
                      <div className="flex flex-wrap gap-2">
                        {insight.dataReferences.map((ref, idx) => (
                          <Button key={idx} variant="outline" size="sm" asChild>
                            <a href={ref.link} className="gap-2">
                              {ref.label}
                              <ArrowRight size={14} />
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.recommendedActions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                      <div className="space-y-2">
                        {insight.recommendedActions.map((action, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted">
                            <div className="flex items-center gap-2">
                              <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                {action.priority}
                              </Badge>
                              <span className="text-sm">{action.action}</span>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={action.link}>
                                <ArrowRight size={14} />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Detected: {new Date(insight.detectedAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {(insights || [])
            .filter(i => i.status === 'resolved')
            .map(insight => (
              <Card key={insight.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <CardDescription>
                    Resolved by {insight.resolvedBy} on {new Date(insight.resolvedAt!).toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {(insights || [])
            .filter(i => i.status === 'dismissed')
            .map(insight => (
              <Card key={insight.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <X size={20} className="text-muted-foreground" />
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <CardDescription>
                    Dismissed by {insight.dismissedBy} on {new Date(insight.dismissedAt!).toLocaleString()}
                  </CardDescription>
                  {insight.dismissReason && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">Reason:</span> {insight.dismissReason}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isDismissOpen} onOpenChange={setIsDismissOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Insight</DialogTitle>
            <DialogDescription>Please provide a reason for dismissing this insight</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dismiss-reason">Reason</Label>
              <Textarea
                id="dismiss-reason"
                value={dismissReason}
                onChange={e => setDismissReason(e.target.value)}
                placeholder="e.g., False positive, already addressed through different action, etc."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDismissOpen(false)
                  setSelectedInsight(null)
                  setDismissReason('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleDismiss}>Dismiss Insight</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
