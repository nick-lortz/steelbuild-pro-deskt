import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CurrencyDollar, CheckCircle, ArrowsClockwise, TrendUp, Package } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import {
  approveWorkPackageForBilling,
  syncAllErectedPackages,
  calculateBillingProgress,
  type ExtendedWorkPackage
} from '@/lib/services/field-to-finance'
import { cn } from '@/lib/utils'

interface BillingSyncWidgetProps {
  workPackages: ExtendedWorkPackage[]
  onSync?: () => void
}

export function BillingSyncWidget({ workPackages, onSync }: BillingSyncWidgetProps) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [autoSyncEnabled, setAutoSyncEnabled] = useKV<boolean>(
    `auto-billing-sync-${projectId}`,
    false
  )

  const billingProgress = useMemo(
    () => calculateBillingProgress(workPackages),
    [workPackages]
  )

  const erectedPackages = useMemo(
    () =>
      workPackages.filter(
        wp =>
          (wp.status === 'erected' || wp.status === 'completed') &&
          !wp.approvedForBilling
      ),
    [workPackages]
  )

  useEffect(() => {
    if (autoSyncEnabled && erectedPackages.length > 0 && projectId) {
      handleAutoSync()
    }
  }, [erectedPackages.length, autoSyncEnabled])

  const handleAutoSync = async () => {
    if (!projectId || syncing) return

    setSyncing(true)
    try {
      const result = await syncAllErectedPackages(projectId)
      if (result.success) {
        toast.success(`Auto-synced ${result.synced} work package(s) to billing`)
        onSync?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Auto-sync error:', error)
      toast.error('Auto-sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleManualSync = async () => {
    if (!projectId) {
      toast.error('Project ID not found')
      return
    }

    setSyncing(true)
    try {
      const result = await syncAllErectedPackages(projectId)
      if (result.success) {
        toast.success(result.message)
        onSync?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Manual sync error:', error)
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleApprovePackage = async (packageId: string) => {
    if (!projectId) {
      toast.error('Project ID not found')
      return
    }

    try {
      const result = await approveWorkPackageForBilling(
        projectId,
        packageId,
        'Current User'
      )

      if (result.success) {
        toast.success('Work package approved for billing')
        onSync?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Approval error:', error)
      toast.error('Failed to approve package')
    }
  }

  const handleViewSOV = () => {
    navigate(`/projects/${projectId}/sov-tracking`)
  }

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CurrencyDollar size={20} weight="fill" className="text-green-600" />
            Field-to-Finance Sync
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={syncing || erectedPackages.length === 0}
          >
            <ArrowsClockwise
              size={16}
              className={cn('mr-1', syncing && 'animate-spin')}
            />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </CardTitle>
        <CardDescription>
          Automatically populate SOV from completed field work
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              id="auto-sync"
              checked={autoSyncEnabled}
              onCheckedChange={setAutoSyncEnabled}
            />
            <Label htmlFor="auto-sync" className="cursor-pointer">
              Auto-sync erected packages to billing
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Billing Progress</span>
            <span className="font-semibold">
              {billingProgress.percentBilled.toFixed(1)}%
            </span>
          </div>
          <Progress value={billingProgress.percentBilled} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${(billingProgress.billedValue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-muted-foreground mt-1">Billed</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${(billingProgress.unbilledValue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-muted-foreground mt-1">Unbilled</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${(billingProgress.totalValue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total</div>
          </div>
        </div>

        {erectedPackages.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <Package size={18} className="text-amber-600" />
            <AlertTitle className="text-amber-900">
              {erectedPackages.length} Package{erectedPackages.length !== 1 ? 's' : ''}{' '}
              Ready for Billing
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              <ul className="mt-2 space-y-2">
                {erectedPackages.slice(0, 3).map(pkg => (
                  <li
                    key={pkg.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">
                        {pkg.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ${(pkg.scheduledValue / 1000).toFixed(0)}k
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApprovePackage(pkg.id)}
                      className="h-7 text-xs"
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Approve
                    </Button>
                  </li>
                ))}
              </ul>

              {erectedPackages.length > 3 && (
                <p className="text-xs mt-2">
                  + {erectedPackages.length - 3} more package
                  {erectedPackages.length - 3 !== 1 ? 's' : ''}
                </p>
              )}

              <Button
                size="sm"
                variant="default"
                className="w-full mt-3"
                onClick={handleManualSync}
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : `Approve All ${erectedPackages.length}`}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {erectedPackages.length === 0 && billingProgress.pendingApproval === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle size={18} className="text-green-600" />
            <AlertTitle className="text-green-900">All Synced</AlertTitle>
            <AlertDescription className="text-green-700">
              All erected work packages have been synced to billing
            </AlertDescription>
          </Alert>
        )}

        <Button variant="outline" className="w-full gap-2" onClick={handleViewSOV}>
          <TrendUp size={16} />
          View Schedule of Values
        </Button>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="flex items-center justify-between">
            <span>Total Work Packages:</span>
            <span className="font-medium">{workPackages.length}</span>
          </p>
          <p className="flex items-center justify-between">
            <span>Approved for Billing:</span>
            <span className="font-medium">
              {workPackages.filter(wp => wp.approvedForBilling).length}
            </span>
          </p>
          <p className="flex items-center justify-between">
            <span>Pending Approval:</span>
            <span className="font-medium text-amber-600">
              {billingProgress.pendingApproval}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
