import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bell, Warning, X, ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { 
  scanForCriticalAlerts, 
  sortAlertsBySeverity, 
  getAlertIcon,
  type CriticalAlert 
} from '@/lib/services/critical-alerts'
import { cn } from '@/lib/utils'

interface CriticalAlertIndicatorProps {
  variant?: 'icon' | 'card' | 'widget'
  autoScan?: boolean
  scanInterval?: number
}

export function CriticalAlertIndicator({ 
  variant = 'widget', 
  autoScan = true,
  scanInterval = 300000 
}: CriticalAlertIndicatorProps) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useKV<CriticalAlert[]>(`critical-alerts-${projectId}`, [])
  const [scanning, setScanning] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<CriticalAlert | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    if (autoScan && projectId) {
      runScan()
      
      const interval = setInterval(() => {
        runScan()
      }, scanInterval)

      return () => clearInterval(interval)
    }
  }, [autoScan, projectId, scanInterval])

  const runScan = async () => {
    if (!projectId) return
    
    setScanning(true)
    try {
      const newAlerts = await scanForCriticalAlerts(projectId)
      
      setAlerts((currentAlerts) => {
        const existingIds = new Set(
          currentAlerts
            .filter(a => a.status === 'active')
            .map(a => `${a.type}-${a.entityRefs[0]?.entityId}`)
        )
        
        const uniqueNew = newAlerts.filter(alert => 
          !existingIds.has(`${alert.type}-${alert.entityRefs[0]?.entityId}`)
        )
        
        if (uniqueNew.length > 0) {
          return [...currentAlerts, ...uniqueNew]
        }
        return currentAlerts
      })
    } catch (error) {
      console.error('Error scanning for critical alerts:', error)
    } finally {
      setScanning(false)
    }
  }

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const sortedAlerts = sortAlertsBySeverity(activeAlerts)
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'red').length

  const handleAcknowledge = (alertId: string) => {
    setAlerts((currentAlerts) =>
      currentAlerts.map(alert =>
        alert.id === alertId
          ? { 
              ...alert, 
              status: 'acknowledged', 
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: 'Current User'
            }
          : alert
      )
    )
    toast.success('Alert acknowledged')
    setShowDialog(false)
    setSelectedAlert(null)
  }

  const handleResolve = (alertId: string) => {
    setAlerts((currentAlerts) =>
      currentAlerts.map(alert =>
        alert.id === alertId
          ? { 
              ...alert, 
              status: 'resolved', 
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'Current User'
            }
          : alert
      )
    )
    toast.success('Alert resolved')
    setShowDialog(false)
    setSelectedAlert(null)
  }

  const handleNavigate = (link: string) => {
    navigate(link)
    setShowDialog(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'red':
        return 'bg-red-500 animate-pulse'
      case 'amber':
        return 'bg-amber-500'
      default:
        return 'bg-yellow-500'
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'red':
        return 'text-red-600 border-red-200 bg-red-50'
      case 'amber':
        return 'text-amber-600 border-amber-200 bg-amber-50'
      default:
        return 'text-yellow-600 border-yellow-200 bg-yellow-50'
    }
  }

  if (variant === 'icon') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDialog(true)}
          className={cn(
            'relative',
            criticalCount > 0 && 'animate-pulse'
          )}
        >
          <Bell size={20} weight={criticalCount > 0 ? 'fill' : 'regular'} />
          {activeAlerts.length > 0 && (
            <span className={cn(
              'absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center text-white',
              getSeverityColor(sortedAlerts[0]?.severity || 'amber')
            )}>
              {activeAlerts.length}
            </span>
          )}
        </Button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Critical Alerts ({activeAlerts.length})</DialogTitle>
              <DialogDescription>
                Issues requiring immediate attention
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {sortedAlerts.map(alert => (
                <Alert key={alert.id} className={getSeverityTextColor(alert.severity)}>
                  <Warning size={18} />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.title}</span>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mt-2">{alert.description}</p>
                    <p className="mt-2 font-semibold">Action Required:</p>
                    <p className="text-sm">{alert.actionRequired}</p>
                    
                    <div className="flex gap-2 mt-4">
                      {alert.entityRefs.map((ref, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          onClick={() => handleNavigate(ref.link)}
                        >
                          {ref.label}
                          <ArrowRight size={14} className="ml-1" />
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}

              {activeAlerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle size={48} className="mx-auto mb-2 text-green-500" />
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (variant === 'widget') {
    return (
      <Card className={cn(
        'border-2',
        criticalCount > 0 ? 'border-red-500' : activeAlerts.length > 0 ? 'border-amber-500' : ''
      )}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell size={20} weight={activeAlerts.length > 0 ? 'fill' : 'regular'} />
              Critical Blockers
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={runScan}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Refresh'}
            </Button>
          </CardTitle>
          <CardDescription>
            {activeAlerts.length > 0
              ? `${activeAlerts.length} issue${activeAlerts.length !== 1 ? 's' : ''} requiring attention`
              : 'No active alerts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {sortedAlerts.slice(0, 3).map(alert => (
                <Alert key={alert.id} className={getSeverityTextColor(alert.severity)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getAlertIcon(alert.severity)}</span>
                        <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                      </div>
                      <AlertDescription className="text-xs">
                        {alert.description}
                      </AlertDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedAlert(alert)
                        setShowDialog(true)
                      }}
                    >
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </Alert>
              ))}

              {activeAlerts.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDialog(true)}
                >
                  View all {activeAlerts.length} alerts
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle size={40} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm">All clear</p>
            </div>
          )}

          <Dialog open={showDialog && selectedAlert !== null} onOpenChange={(open) => {
            setShowDialog(open)
            if (!open) setSelectedAlert(null)
          }}>
            <DialogContent>
              {selectedAlert && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <span>{getAlertIcon(selectedAlert.severity)}</span>
                      {selectedAlert.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-1">Action Required:</p>
                      <p className="text-sm text-muted-foreground">{selectedAlert.actionRequired}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedAlert.entityRefs.map((ref, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          onClick={() => handleNavigate(ref.link)}
                        >
                          {ref.label}
                          <ArrowRight size={14} className="ml-1" />
                        </Button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAcknowledge(selectedAlert.id)}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleResolve(selectedAlert.id)}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  return null
}
