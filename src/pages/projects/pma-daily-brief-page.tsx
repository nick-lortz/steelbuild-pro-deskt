import { useState } from 'react'
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
import { usePMAInsights } from '@/hooks/use-database'
import type { PMAInsight } from '@/types/electron'

export function PMADailyBriefPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { insights, loading, generateInsights, resolveInsight, dismissInsight } = usePMAInsights(projectId)
  
  const [scanning, setScanning] = useState(false)
  const [isDismissOpen, setIsDismissOpen] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<PMAInsight | null>(null)
  const [dismissReason, setDismissReason] = useState('')

  const handleRunScan = async () => {
    if (!projectId) return
    
    setScanning(true)
    try {
      const result = await generateInsights()
      if (result.success && result.data) {
        if (result.data.length > 0) {
          toast.success(`Generated ${result.data.length} new insight${result.data.length !== 1 ? 's' : ''}`)
        } else {
          toast.info('No new insights detected')
        }
      } else {
        toast.error('Failed to generate insights')
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
      const result = await resolveInsight(insightId, 'Current User')
      if (result.success) {
        toast.success('Insight marked as resolved')
      } else {
        toast.error('Failed to resolve insight')
      }
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
      const result = await dismissInsight(selectedInsight.id, 'Current User', dismissReason)
      if (result.success) {
        toast.success('Insight dismissed')
        setIsDismissOpen(false)
        setSelectedInsight(null)
        setDismissReason('')
      } else {
        toast.error('Failed to dismiss insight')
      }
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

  const activeInsights = insights.filter(i => i.status === 'open')
  const resolvedInsights = insights.filter(i => i.status === 'resolved')
  const dismissedInsights = insights.filter(i => i.status === 'dismissed')
  
  const criticalCount = activeInsights.filter(i => i.severity === 'critical').length
  const highCount = activeInsights.filter(i => i.severity === 'high').length
  const mediumCount = activeInsights.filter(i => i.severity === 'medium').length
  const lowCount = activeInsights.filter(i => i.severity === 'low').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkle size={32} weight="duotone" className="text-accent" />
            PMA Daily Brief
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time project insights from local database
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunScan} disabled={scanning} className="gap-2">
            {scanning ? 'Scanning...' : 'Run Scan'}
            <TrendUp size={18} />
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={24} className="text-primary" />
              <CardTitle>Summary</CardTitle>
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className={criticalCount > 0 ? 'border-red-300 bg-red-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{criticalCount}</div>
                <p className="text-sm text-muted-foreground">Critical</p>
              </CardContent>
            </Card>
            <Card className={highCount > 0 ? 'border-orange-300 bg-orange-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{highCount}</div>
                <p className="text-sm text-muted-foreground">High</p>
              </CardContent>
            </Card>
            <Card className={mediumCount > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{mediumCount}</div>
                <p className="text-sm text-muted-foreground">Medium</p>
              </CardContent>
            </Card>
            <Card className={lowCount > 0 ? 'border-blue-300 bg-blue-50' : ''}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{lowCount}</div>
                <p className="text-sm text-muted-foreground">Low</p>
              </CardContent>
            </Card>
          </div>

          {activeInsights.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
              <p className="text-lg font-semibold">All Clear</p>
              <p className="text-sm text-muted-foreground">No active insights</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-semibold">Active Insights ({activeInsights.length})</h4>
              <p className="text-sm text-muted-foreground">
                Review and resolve insights below to keep your project on track
              </p>
            </div>
          )}
        </CardContent>
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
              <Card 
                key={insight.id} 
                className="border-l-4" 
                style={{ borderLeftColor: getSeverityBorderColor(insight.severity) }}
              >
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
                      <CardDescription>{insight.details}</CardDescription>
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
                {insight.entity_refs && insight.entity_refs.length > 0 && (
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium">Related Entities:</p>
                    <div className="flex flex-wrap gap-2">
                      {insight.entity_refs.map((ref, idx) => (
                        <Button key={idx} variant="outline" size="sm" onClick={() => navigate(ref.link)}>
                          {ref.label}
                          <ArrowRight size={14} className="ml-1" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedInsights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold">No Resolved Insights</p>
              </CardContent>
            </Card>
          ) : (
            resolvedInsights.map(insight => (
              <Card key={insight.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <CardDescription>
                    Resolved by {insight.resolved_by} on{' '}
                    {new Date(insight.resolved_at!).toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {dismissedInsights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold">No Dismissed Insights</p>
              </CardContent>
            </Card>
          ) : (
            dismissedInsights.map(insight => (
              <Card key={insight.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <X size={20} className="text-muted-foreground" />
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <CardDescription>
                    Dismissed by {insight.dismissed_by} on{' '}
                    {new Date(insight.dismissed_at!).toLocaleString()}
                  </CardDescription>
                  {insight.dismiss_reason && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">Reason:</span> {insight.dismiss_reason}
                    </p>
                  )}
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
