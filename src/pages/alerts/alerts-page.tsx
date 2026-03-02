import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Warning, Info, CheckCircle, Bell, BellSlash, TrendUp, Calendar, Package, Shield } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Alert } from '@/lib/types'

export function AlertsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useKV<Alert[]>('alerts', [])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [showDismissed, setShowDismissed] = useState(false)

  const projectAlerts = alerts.filter(a => 
    projectId ? a.projectId === projectId : !a.projectId
  )

  const filteredAlerts = projectAlerts.filter(alert => {
    if (!showDismissed && alert.dismissed) return false
    const matchesType = typeFilter === 'all' || alert.type === typeFilter
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    return matchesType && matchesSeverity
  })

  const handleDismiss = (id: string) => {
    setAlerts(current => current.map(a =>
      a.id === id
        ? { ...a, dismissed: true, dismissedAt: new Date().toISOString() }
        : a
    ))
    toast.success('Alert dismissed')
  }

  const handleDismissAll = () => {
    setAlerts(current => current.map(a =>
      (projectId ? a.projectId === projectId : !a.projectId) && !a.dismissed
        ? { ...a, dismissed: true, dismissedAt: new Date().toISOString() }
        : a
    ))
    toast.success('All alerts dismissed')
  }

  const handleAction = (alert: Alert) => {
    if (alert.actionUrl) {
      navigate(alert.actionUrl)
    }
  }

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="text-red-600" weight="fill" />
      case 'warning':
        return <Warning className="text-orange-600" weight="fill" />
      default:
        return <Info className="text-blue-600" weight="fill" />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'budget':
        return <TrendUp size={20} />
      case 'schedule':
        return <Calendar size={20} />
      case 'delivery':
        return <Package size={20} />
      case 'safety':
        return <Shield size={20} />
      default:
        return <Bell size={20} />
    }
  }

  const stats = {
    total: projectAlerts.filter(a => !a.dismissed).length,
    critical: projectAlerts.filter(a => !a.dismissed && a.severity === 'critical').length,
    warning: projectAlerts.filter(a => !a.dismissed && a.severity === 'warning').length,
    info: projectAlerts.filter(a => !a.dismissed && a.severity === 'info').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Stay informed about important project events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDismissed(!showDismissed)}
          >
            {showDismissed ? <Bell /> : <BellSlash />}
            {showDismissed ? 'Hide' : 'Show'} Dismissed
          </Button>
          {stats.total > 0 && (
            <Button variant="outline" onClick={handleDismissAll}>
              Dismiss All
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Warning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.warning}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.info}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="rfi">RFI</SelectItem>
                <SelectItem value="submittal">Submittal</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">All clear!</h3>
              <p className="text-muted-foreground mb-4">
                {showDismissed
                  ? 'No dismissed alerts found'
                  : 'No active alerts at this time'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts
                .sort((a, b) => {
                  const severityOrder = { critical: 0, warning: 1, info: 2 }
                  return severityOrder[a.severity] - severityOrder[b.severity]
                })
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 border-2 rounded-lg ${
                      alert.dismissed ? 'opacity-50' : ''
                    } ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-white/50">
                          {getTypeIcon(alert.type)}
                          <span className="ml-1">{alert.type}</span>
                        </Badge>
                        <Badge variant="outline" className="bg-white/50">
                          {alert.severity}
                        </Badge>
                        {alert.dismissed && (
                          <Badge variant="outline" className="bg-white/50">
                            Dismissed
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{alert.title}</h3>
                      <p className="text-sm text-foreground/90">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-foreground/70">
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.expiresAt && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(alert.expiresAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {alert.actionRequired && alert.actionUrl && !alert.dismissed && (
                        <Button size="sm" onClick={() => handleAction(alert)}>
                          Take Action
                        </Button>
                      )}
                      {!alert.dismissed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismiss(alert.id)}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
