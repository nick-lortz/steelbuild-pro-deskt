import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkle,
  Warning,
  CheckCircle,
  X,
  ArrowRight,
  Calendar,
  TrendUp,
  Clock,
  ChartLine,
  CurrencyDollar,
  FileDashed,
  Alarm,
  ArrowsClockwise,
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
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { generateProjectInsights, generateDailyBrief, type PMAInsight } from '@/lib/services/pma-heuristics'
import { useKV } from '@github/spark/hooks'
import { CriticalAlertIndicator } from '@/components/pma/critical-alert-indicator'

export function PMADailyBriefPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [insights, setInsights] = useKV<PMAInsight[]>(`pma-insights-${projectId}`, [])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [isDismissOpen, setIsDismissOpen] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<PMAInsight | null>(null)
  const [dismissReason, setDismissReason] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rfi-aging' | 'schedule-slip' | 'budget-overrun'>('all')

  useEffect(() => {
    if (projectId && insights.length === 0) {
      handleRunScan()
    }
  }, [projectId])

  const handleRunScan = async () => {
    if (!projectId) return
    
    setScanning(true)
    try {
      const newInsights = await generateProjectInsights(projectId)
      
      const existingIds = new Set(insights.filter(i => i.status === 'open').map(i => `${i.entityType}-${i.entityId}`))
      const uniqueNew = newInsights.filter(i => !existingIds.has(`${i.entityType}-${i.entityId}`))
      
      if (uniqueNew.length > 0) {
        setInsights((current) => [...current, ...uniqueNew])
        toast.success(`Generated ${uniqueNew.length} new insight${uniqueNew.length !== 1 ? 's' : ''}`)
      } else {
        toast.info('No new insights detected')
      }
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
      setInsights((current) =>
        current.map(i =>
          i.id === insightId
            ? { ...i, status: 'resolved' as const, resolvedAt: new Date().toISOString(), resolvedBy: 'Current User' }
            : i
        )
      )
      toast.success('Insight marked as resolved')
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
      setInsights((current) =>
        current.map(i =>
          i.id === selectedInsight.id
            ? { 
                ...i, 
                status: 'dismissed' as const, 
                dismissedAt: new Date().toISOString(), 
                dismissedBy: 'Current User',
                dismissReason 
              }
            : i
        )
      )
      toast.success('Insight dismissed')
      setIsDismissOpen(false)
      setSelectedInsight(null)
      setDismissReason('')
    } catch (error) {
      console.error('Failed to dismiss insight:', error)
      toast.error('Failed to dismiss insight')
    }
  }

  const getSeverityColor = (severity: PMAInsight['severity']) => {
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

  const getSeverityBorderColor = (severity: PMAInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return '#ef4444'
      case 'high':
        return '#f97316'
      case 'medium':
        return '#eab308'
      case 'low':
        return '#3b82f6'
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.includes('rfi')) return <FileDashed size={20} weight="duotone" />
    if (type.includes('schedule')) return <Clock size={20} weight="duotone" />
    if (type.includes('budget') || type.includes('cost')) return <CurrencyDollar size={20} weight="duotone" />
    return <Warning size={20} weight="duotone" />
  }

  const getTypeColor = (type: string) => {
    if (type.includes('rfi')) return 'text-purple-600'
    if (type.includes('schedule')) return 'text-blue-600'
    if (type.includes('budget') || type.includes('cost')) return 'text-red-600'
    return 'text-gray-600'
  }

  const activeInsights = insights.filter(i => i.status === 'open')
  const resolvedInsights = insights.filter(i => i.status === 'resolved')
  const dismissedInsights = insights.filter(i => i.status === 'dismissed')
  
  const insightsByCategory = useMemo(() => {
    const rfiAging = activeInsights.filter(i => i.type.includes('rfi'))
    const scheduleSlip = activeInsights.filter(i => i.type.includes('schedule'))
    const budgetOverrun = activeInsights.filter(i => i.type.includes('budget') || i.type.includes('cost'))
    
    return { rfiAging, scheduleSlip, budgetOverrun }
  }, [activeInsights])

  const filteredInsights = useMemo(() => {
    if (selectedCategory === 'all') return activeInsights
    if (selectedCategory === 'rfi-aging') return insightsByCategory.rfiAging
    if (selectedCategory === 'schedule-slip') return insightsByCategory.scheduleSlip
    if (selectedCategory === 'budget-overrun') return insightsByCategory.budgetOverrun
    return activeInsights
  }, [selectedCategory, activeInsights, insightsByCategory])
  
  const brief = useMemo(() => generateDailyBrief(activeInsights), [activeInsights])

  const getAgingDays = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkle size={32} weight="duotone" className="text-primary" />
            PMA Daily Brief
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights on aging RFIs, schedule slippage, and budget overages
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunScan} disabled={scanning} className="gap-2">
            {scanning ? (
              <>
                <ArrowsClockwise size={18} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <TrendUp size={18} />
                Run Scan
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-accent/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
              <Calendar size={24} weight="duotone" className="text-primary" />
              <CardTitle>Daily Summary</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className={criticalCount > 0 ? 'border-red-400 bg-red-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
                <p className="text-sm text-muted-foreground">Critical</p>
              </CardContent>
            </Card>
            <Card className={highCount > 0 ? 'border-orange-400 bg-orange-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600">{highCount}</div>
                <p className="text-sm text-muted-foreground">High</p>
              </CardContent>
            </Card>
            <Card className={mediumCount > 0 ? 'border-yellow-400 bg-yellow-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-yellow-600">{mediumCount}</div>
                <p className="text-sm text-muted-foreground">Medium</p>
              </CardContent>
            </Card>
            <Card className={lowCount > 0 ? 'border-blue-400 bg-blue-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{lowCount}</div>
                <p className="text-sm text-muted-foreground">Low</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileDashed size={24} weight="duotone" className="text-purple-600" />
                  <div className="text-2xl font-bold text-purple-700">{insightsByCategory.rfiAging.length}</div>
                </div>
                <p className="text-sm font-medium text-purple-900">Aging RFIs</p>
                <p className="text-xs text-muted-foreground mt-1">Open for 72+ hours</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={24} weight="duotone" className="text-blue-600" />
                  <div className="text-2xl font-bold text-blue-700">{insightsByCategory.scheduleSlip.length}</div>
                </div>
                <p className="text-sm font-medium text-blue-900">Schedule Slippage</p>
                <p className="text-xs text-muted-foreground mt-1">Behind baseline dates</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <CurrencyDollar size={24} weight="duotone" className="text-red-600" />
                  <div className="text-2xl font-bold text-red-700">{insightsByCategory.budgetOverrun.length}</div>
                </div>
                <p className="text-sm font-medium text-red-900">Budget Overages</p>
                <p className="text-xs text-muted-foreground mt-1">Actual exceeds budget</p>
              </CardContent>
            </Card>
          </div>

          {activeInsights.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto text-green-600 mb-3" weight="duotone" />
              <p className="text-lg font-semibold">All Clear</p>
              <p className="text-sm text-muted-foreground">No active insights detected. Project is on track!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Active Insights ({activeInsights.length})</h4>
                  <p className="text-sm text-muted-foreground">
                    Review and resolve insights below to keep your project on track
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
        
        <div className="space-y-6">
          <CriticalAlertIndicator variant="widget" autoScan={true} scanInterval={300000} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter by Category</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                All ({activeInsights.length})
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'rfi-aging' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('rfi-aging')}
                className="gap-1"
              >
                <FileDashed size={16} />
                RFIs ({insightsByCategory.rfiAging.length})
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'schedule-slip' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('schedule-slip')}
                className="gap-1"
              >
                <Clock size={16} />
                Schedule ({insightsByCategory.scheduleSlip.length})
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'budget-overrun' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('budget-overrun')}
                className="gap-1"
              >
                <CurrencyDollar size={16} />
                Budget ({insightsByCategory.budgetOverrun.length})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeInsights.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedInsights.length})
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed ({dismissedInsights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filteredInsights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-3" weight="duotone" />
                <p className="text-lg font-semibold">No Active Insights</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCategory === 'all' 
                    ? 'All systems operating normally' 
                    : `No ${selectedCategory.replace(/-/g, ' ')} issues detected`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredInsights.map(insight => {
              const agingDays = getAgingDays(insight.created_at)
              return (
                <Card 
                  key={insight.id} 
                  className="border-l-4 hover:shadow-md transition-shadow" 
                  style={{ borderLeftColor: getSeverityBorderColor(insight.severity) }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`flex items-center gap-1 ${getTypeColor(insight.type)}`}>
                            {getTypeIcon(insight.type)}
                          </div>
                          <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                            {insight.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">{insight.type.replace(/-/g, ' ')}</Badge>
                          {agingDays > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Alarm size={12} />
                              {agingDays} {agingDays === 1 ? 'day' : 'days'} old
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription>{insight.details}</CardDescription>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleResolve(insight.id)} className="gap-1">
                          <CheckCircle size={16} />
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
                  {insight.entity_refs && insight.entity_refs.length > 0 && (
                    <CardContent className="space-y-2">
                      <p className="text-sm font-medium">Related Entities:</p>
                      <div className="flex flex-wrap gap-2">
                        {insight.entity_refs.map((ref, idx) => (
                          <Button key={idx} variant="outline" size="sm" onClick={() => navigate(ref.link)} className="gap-1">
                            {ref.label}
                            <ArrowRight size={14} />
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedInsights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock size={48} className="mx-auto text-muted-foreground mb-3" weight="duotone" />
                <p className="text-lg font-semibold">No Resolved Insights</p>
              </CardContent>
            </Card>
          ) : (
            resolvedInsights.map(insight => (
              <Card key={insight.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 mt-1" weight="fill" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                      </div>
                      <CardDescription>
                        Resolved by {insight.resolved_by} on{' '}
                        {new Date(insight.resolved_at!).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {dismissedInsights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock size={48} className="mx-auto text-muted-foreground mb-3" weight="duotone" />
                <p className="text-lg font-semibold">No Dismissed Insights</p>
              </CardContent>
            </Card>
          ) : (
            dismissedInsights.map(insight => (
              <Card key={insight.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <X size={20} className="text-muted-foreground mt-1" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                      </div>
                      <CardDescription>
                        Dismissed by {insight.dismissed_by} on{' '}
                        {new Date(insight.dismissed_at!).toLocaleString()}
                      </CardDescription>
                      {insight.dismiss_reason && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          <span className="font-medium">Reason:</span> {insight.dismiss_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
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
