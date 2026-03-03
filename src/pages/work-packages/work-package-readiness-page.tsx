import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import {
  Package,
  CheckCircle,
  Warning,
  X,
  Clock,
  ArrowRight,
  Hammer,
  Truck,
  FileText,
  ShoppingCart,
  GitBranch,
  ListChecks,
  Target,
  TrendUp,
  ArrowsClockwise,
  Funnel,
  DownloadSimple,
  Plus,
  PencilSimple,
  Check,
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import type { FabWorkPackage, FabItem, FabBlocker } from '@/lib/types-fab'
import type { WorkPackage, Delivery } from '@/lib/types'

interface DependencyNode {
  id: string
  packageNumber: string
  title: string
  status: string
  readinessPercent: number
  dependencies: string[]
  level: number
  x: number
  y: number
}

export function WorkPackageReadinessPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [fabPackages, setFabPackages] = useKV<FabWorkPackage[]>(`fab-packages-${projectId}`, [])
  const [workPackages] = useKV<WorkPackage[]>(`work-packages-${projectId}`, [])
  const [fabItems] = useKV<FabItem[]>(`fab-items-${projectId}`, [])
  const [deliveries] = useKV<Delivery[]>(`deliveries-${projectId}`, [])

  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'dependencies' | 'timeline'>('grid')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingReadinessType, setEditingReadinessType] = useState<'detailing' | 'material' | 'production' | 'delivery'>('detailing')

  const selectedPackage = useMemo(() => {
    return fabPackages.find(p => p.id === selectedPackageId)
  }, [fabPackages, selectedPackageId])

  const packageMetrics = useMemo(() => {
    const notReady = fabPackages.filter(p => p.overallStatus === 'not-ready').length
    const partiallyReady = fabPackages.filter(p => p.overallStatus === 'partially-ready').length
    const ready = fabPackages.filter(p => p.overallStatus === 'ready').length
    const inProgress = fabPackages.filter(p => p.overallStatus === 'in-progress').length
    const completed = fabPackages.filter(p => p.overallStatus === 'completed').length

    const activeBlockers = fabPackages.reduce((sum, pkg) => {
      return sum + [
        ...pkg.detailingReadiness.blockers,
        ...pkg.materialReadiness.blockers,
        ...pkg.productionReadiness.blockers,
        ...pkg.deliveryReadiness.blockers,
      ].filter(b => b.status === 'active').length
    }, 0)

    const criticalBlockers = fabPackages.reduce((sum, pkg) => {
      return sum + [
        ...pkg.detailingReadiness.blockers,
        ...pkg.materialReadiness.blockers,
        ...pkg.productionReadiness.blockers,
        ...pkg.deliveryReadiness.blockers,
      ].filter(b => b.status === 'active' && b.severity === 'critical').length
    }, 0)

    const avgReadiness =
      fabPackages.length > 0
        ? fabPackages.reduce((sum, p) => sum + p.overallProgress, 0) / fabPackages.length
        : 0

    return {
      total: fabPackages.length,
      notReady,
      partiallyReady,
      ready,
      inProgress,
      completed,
      activeBlockers,
      criticalBlockers,
      avgReadiness: Math.round(avgReadiness),
    }
  }, [fabPackages])

  const filteredPackages = useMemo(() => {
    return fabPackages.filter(pkg => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'blocked') {
        const hasActiveBlockers = [
          ...pkg.detailingReadiness.blockers,
          ...pkg.materialReadiness.blockers,
          ...pkg.productionReadiness.blockers,
          ...pkg.deliveryReadiness.blockers,
        ].some(b => b.status === 'active')
        return hasActiveBlockers
      }
      return pkg.overallStatus === filterStatus
    })
  }, [fabPackages, filterStatus])

  const dependencyGraph = useMemo(() => {
    const nodes: DependencyNode[] = []
    const visited = new Set<string>()
    const levels: { [key: string]: number } = {}

    const buildGraph = (pkgId: string, level: number) => {
      if (visited.has(pkgId)) return
      visited.add(pkgId)
      levels[pkgId] = level

      const pkg = fabPackages.find(p => p.id === pkgId)
      if (!pkg) return

      const pkgItems = fabItems.filter(item => pkg.fabItems.includes(item.id))
      const dependencies: string[] = []

      pkgItems.forEach(item => {
        item.detailingDependencies
          .filter(dep => dep.status !== 'resolved')
          .forEach(dep => {
            if (dep.referenceType === 'fab-item' && dep.referenceId) {
              const depItem = fabItems.find(fi => fi.id === dep.referenceId)
              if (depItem && depItem.workPackageId && depItem.workPackageId !== pkgId) {
                if (!dependencies.includes(depItem.workPackageId)) {
                  dependencies.push(depItem.workPackageId)
                  buildGraph(depItem.workPackageId, level + 1)
                }
              }
            }
          })
      })

      nodes.push({
        id: pkg.id,
        packageNumber: pkg.packageNumber,
        title: pkg.title,
        status: pkg.overallStatus,
        readinessPercent: pkg.overallProgress,
        dependencies,
        level,
        x: 0,
        y: 0,
      })
    }

    fabPackages.forEach(pkg => {
      if (!visited.has(pkg.id)) {
        buildGraph(pkg.id, 0)
      }
    })

    const maxLevel = Math.max(...Object.values(levels), 0)
    const levelCounts: { [key: number]: number } = {}
    nodes.forEach(node => {
      levelCounts[node.level] = (levelCounts[node.level] || 0) + 1
    })

    const levelIndices: { [key: number]: number } = {}
    nodes.forEach(node => {
      const level = node.level
      const index = levelIndices[level] || 0
      levelIndices[level] = index + 1

      const totalAtLevel = levelCounts[level] || 1
      const spacing = 200
      const levelWidth = (totalAtLevel - 1) * spacing

      node.x = 150 + level * 300
      node.y = 100 + index * spacing - levelWidth / 2
    })

    return nodes
  }, [fabPackages, fabItems])

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'not-ready': 'text-destructive',
      'partially-ready': 'text-warning',
      ready: 'text-accent',
      'in-progress': 'text-primary',
      completed: 'text-success',
    }
    return colors[status] || 'text-muted-foreground'
  }

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'not-ready': 'destructive',
      'partially-ready': 'outline',
      ready: 'default',
      'in-progress': 'default',
      completed: 'secondary',
    }
    return variants[status] || 'outline'
  }

  const getReadinessIcon = (readinessPercent: number) => {
    if (readinessPercent >= 100) return <CheckCircle size={20} weight="fill" className="text-accent" />
    if (readinessPercent >= 75) return <TrendUp size={20} weight="duotone" className="text-primary" />
    if (readinessPercent >= 50) return <Clock size={20} weight="duotone" className="text-warning" />
    if (readinessPercent > 0) return <ArrowsClockwise size={20} weight="duotone" className="text-muted-foreground" />
    return <X size={20} weight="bold" className="text-destructive" />
  }

  const getBlockersSummary = (pkg: FabWorkPackage): { active: number; critical: number } => {
    const allBlockers = [
      ...pkg.detailingReadiness.blockers,
      ...pkg.materialReadiness.blockers,
      ...pkg.productionReadiness.blockers,
      ...pkg.deliveryReadiness.blockers,
    ]
    return {
      active: allBlockers.filter(b => b.status === 'active').length,
      critical: allBlockers.filter(b => b.status === 'active' && b.severity === 'critical').length,
    }
  }

  const exportReadinessReport = () => {
    toast.success('Readiness report exported')
  }

  const handleToggleReadinessItem = (itemId: string) => {
    if (!selectedPackage) return

    const readinessKey = `${editingReadinessType}Readiness` as keyof FabWorkPackage
    const readiness = selectedPackage[readinessKey] as any

    const updatedItems = readiness.requiredItems.map((item: any) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed: !item.completed,
          completedDate: !item.completed ? new Date().toISOString() : null,
        }
      }
      return item
    })

    const completedCount = updatedItems.filter((i: any) => i.completed).length
    const totalCount = updatedItems.length
    const readinessPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const updatedReadiness = {
      ...readiness,
      requiredItems: updatedItems,
      readinessPercent,
      isReady: readinessPercent >= 100,
    }

    const updatedPackage = {
      ...selectedPackage,
      [readinessKey]: updatedReadiness,
    }

    const allReadiness = [
      updatedPackage.detailingReadiness.readinessPercent,
      updatedPackage.materialReadiness.readinessPercent,
      updatedPackage.productionReadiness.readinessPercent,
      updatedPackage.deliveryReadiness.readinessPercent,
    ]
    const overallProgress = Math.round(allReadiness.reduce((sum, val) => sum + val, 0) / 4)

    let overallStatus = 'not-ready'
    if (overallProgress >= 100) overallStatus = 'completed'
    else if (overallProgress >= 75) overallStatus = 'ready'
    else if (overallProgress >= 50) overallStatus = 'partially-ready'
    else if (overallProgress > 0) overallStatus = 'in-progress'

    updatedPackage.overallProgress = overallProgress
    updatedPackage.overallStatus = overallStatus

    setFabPackages((current) =>
      current.map((pkg) => (pkg.id === selectedPackage.id ? updatedPackage : pkg))
    )

    toast.success('Readiness item updated')
  }

  const handleResolveBlocker = (blockerId: string) => {
    if (!selectedPackage) return

    const readinessKey = `${editingReadinessType}Readiness` as keyof FabWorkPackage
    const readiness = selectedPackage[readinessKey] as any

    const updatedBlockers = readiness.blockers.map((blocker: FabBlocker) => {
      if (blocker.id === blockerId) {
        return {
          ...blocker,
          status: 'resolved',
          resolvedDate: new Date().toISOString(),
        }
      }
      return blocker
    })

    const updatedReadiness = {
      ...readiness,
      blockers: updatedBlockers,
    }

    const updatedPackage = {
      ...selectedPackage,
      [readinessKey]: updatedReadiness,
    }

    setFabPackages((current) =>
      current.map((pkg) => (pkg.id === selectedPackage.id ? updatedPackage : pkg))
    )

    toast.success('Blocker resolved')
  }

  const handleUpdatePackageStatus = (newStatus: string) => {
    if (!selectedPackage) return

    const updatedPackage = {
      ...selectedPackage,
      overallStatus: newStatus,
    }

    setFabPackages((current) =>
      current.map((pkg) => (pkg.id === selectedPackage.id ? updatedPackage : pkg))
    )

    toast.success(`Package status updated to ${newStatus}`)
  }

  if (fabPackages.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Work Package Readiness
            </h2>
            <p className="text-muted-foreground">Track execution readiness and dependencies</p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={64} className="text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-xl font-semibold mb-2">No Work Packages Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create fab work packages to track detailing, material, production, and delivery readiness.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/fab-tracking`)}>
              <Plus size={16} className="mr-2" />
              Go to Fab Tracking
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Work Package Readiness
          </h2>
          <p className="text-muted-foreground">Execution readiness dashboard with dependency visualization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportReadinessReport}>
            <DownloadSimple size={16} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package size={18} className="text-muted-foreground" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packageMetrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {packageMetrics.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Ready</CardTitle>
            <X size={18} className="text-destructive" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{packageMetrics.notReady}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <CheckCircle size={18} className="text-accent" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{packageMetrics.ready}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to start</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ArrowsClockwise size={18} className="text-primary" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{packageMetrics.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Active work</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Blockers</CardTitle>
            <Warning size={18} className="text-warning" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{packageMetrics.activeBlockers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {packageMetrics.criticalBlockers} critical
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Readiness</CardTitle>
            <Target size={18} className="text-muted-foreground" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packageMetrics.avgReadiness}%</div>
            <Progress value={packageMetrics.avgReadiness} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Funnel size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            <SelectItem value="not-ready">Not Ready</SelectItem>
            <SelectItem value="partially-ready">Partially Ready</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <ListChecks size={16} className="mr-1" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'dependencies' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('dependencies')}
          >
            <GitBranch size={16} className="mr-1" />
            Dependencies
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Clock size={16} className="mr-1" />
            Timeline
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-6">
        <TabsContent value="grid" className="space-y-4 mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map(pkg => {
              const blockers = getBlockersSummary(pkg)
              const pkgItems = fabItems.filter(item => pkg.fabItems.includes(item.id))
              const linkedDelivery = deliveries.find(d => d.id === pkg.deliveryId)

              return (
                <Card
                  key={pkg.id}
                  className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
                    blockers.critical > 0
                      ? 'border-l-destructive'
                      : blockers.active > 0
                      ? 'border-l-warning'
                      : pkg.overallStatus === 'ready'
                      ? 'border-l-accent'
                      : 'border-l-border'
                  }`}
                  onClick={() => setSelectedPackageId(pkg.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-semibold text-muted-foreground">
                            {pkg.packageNumber}
                          </span>
                          <Badge variant={getStatusBadgeVariant(pkg.overallStatus)} className="text-xs">
                            {pkg.overallStatus}
                          </Badge>
                        </div>
                        <CardTitle className="text-base line-clamp-2">{pkg.title}</CardTitle>
                      </div>
                      {getReadinessIcon(pkg.overallProgress)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Overall Readiness</span>
                        <span className="font-semibold">{pkg.overallProgress}%</span>
                      </div>
                      <Progress value={pkg.overallProgress} className="h-2" />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Detailing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pkg.detailingReadiness.isReady ? (
                            <CheckCircle size={14} className="text-accent" weight="fill" />
                          ) : (
                            <Clock size={14} className="text-warning" />
                          )}
                          <span className="font-medium">{pkg.detailingReadiness.readinessPercent}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pkg.materialReadiness.isReady ? (
                            <CheckCircle size={14} className="text-accent" weight="fill" />
                          ) : (
                            <Clock size={14} className="text-warning" />
                          )}
                          <span className="font-medium">{pkg.materialReadiness.readinessPercent}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Hammer size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Production</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pkg.productionReadiness.isReady ? (
                            <CheckCircle size={14} className="text-accent" weight="fill" />
                          ) : (
                            <Clock size={14} className="text-warning" />
                          )}
                          <span className="font-medium">{pkg.productionReadiness.readinessPercent}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Truck size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pkg.deliveryReadiness.isReady ? (
                            <CheckCircle size={14} className="text-accent" weight="fill" />
                          ) : (
                            <Clock size={14} className="text-warning" />
                          )}
                          <span className="font-medium">{pkg.deliveryReadiness.readinessPercent}%</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pkgItems.length} pieces · {pkg.totalWeight.toLocaleString()} tons</span>
                      {blockers.active > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <Warning size={12} className="mr-1" weight="fill" />
                          {blockers.active} blocker{blockers.active !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {linkedDelivery && (
                      <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-md p-2">
                        <Truck size={14} className="text-primary" />
                        <span className="flex-1 truncate">
                          Delivery: {linkedDelivery.deliveryNumber}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch size={20} weight="duotone" />
                Dependency Visualization
              </CardTitle>
              <CardDescription>
                Work package dependencies and execution sequencing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-x-auto">
                <svg
                  width={Math.max(800, dependencyGraph.reduce((max, n) => Math.max(max, n.x), 0) + 300)}
                  height={Math.max(600, Math.abs(dependencyGraph.reduce((max, n) => Math.max(max, Math.abs(n.y)), 0)) * 2 + 200)}
                  className="border rounded-lg bg-muted/20"
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="currentColor"
                        className="text-muted-foreground"
                      />
                    </marker>
                  </defs>

                  {dependencyGraph.map(node => {
                    return node.dependencies.map(depId => {
                      const depNode = dependencyGraph.find(n => n.id === depId)
                      if (!depNode) return null

                      return (
                        <line
                          key={`${node.id}-${depId}`}
                          x1={depNode.x + 120}
                          y1={depNode.y + 50}
                          x2={node.x}
                          y2={node.y + 50}
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-border"
                          markerEnd="url(#arrowhead)"
                        />
                      )
                    })
                  })}

                  {dependencyGraph.map(node => {
                    const fillColor =
                      node.readinessPercent >= 100
                        ? 'hsl(var(--accent))'
                        : node.readinessPercent >= 75
                        ? 'hsl(var(--primary))'
                        : node.readinessPercent >= 50
                        ? 'hsl(var(--warning))'
                        : 'hsl(var(--destructive))'

                    return (
                      <g key={node.id} onClick={() => setSelectedPackageId(node.id)} className="cursor-pointer">
                        <rect
                          x={node.x}
                          y={node.y}
                          width="120"
                          height="100"
                          rx="8"
                          fill="hsl(var(--card))"
                          stroke={fillColor}
                          strokeWidth="2"
                          className="hover:opacity-80 transition-opacity"
                        />
                        <foreignObject x={node.x} y={node.y} width="120" height="100">
                          <div className="p-2 h-full flex flex-col">
                            <div className="text-[10px] font-mono font-semibold text-muted-foreground mb-1 truncate">
                              {node.packageNumber}
                            </div>
                            <div className="text-xs font-medium line-clamp-2 flex-1">{node.title}</div>
                            <div className="mt-1">
                              <div className="text-[10px] text-muted-foreground mb-0.5">
                                {node.readinessPercent}%
                              </div>
                              <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full transition-all"
                                  style={{
                                    width: `${node.readinessPercent}%`,
                                    backgroundColor: fillColor,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </foreignObject>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {dependencyGraph.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GitBranch size={48} className="text-muted-foreground mb-4" weight="duotone" />
                  <p className="text-sm text-muted-foreground">
                    No dependencies defined between packages
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} weight="duotone" />
                Timeline View
              </CardTitle>
              <CardDescription>Scheduled start and completion dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPackages
                  .filter(pkg => pkg.scheduledStartDate)
                  .sort((a, b) => {
                    const dateA = a.scheduledStartDate ? new Date(a.scheduledStartDate).getTime() : 0
                    const dateB = b.scheduledStartDate ? new Date(b.scheduledStartDate).getTime() : 0
                    return dateA - dateB
                  })
                  .map(pkg => {
                    const blockers = getBlockersSummary(pkg)
                    return (
                      <div
                        key={pkg.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedPackageId(pkg.id)}
                      >
                        <div className="flex-shrink-0">
                          {getReadinessIcon(pkg.overallProgress)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono font-semibold">{pkg.packageNumber}</span>
                            <Badge variant={getStatusBadgeVariant(pkg.overallStatus)} className="text-xs">
                              {pkg.overallStatus}
                            </Badge>
                            {blockers.active > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {blockers.active} blocker{blockers.active !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{pkg.title}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">Start</div>
                          <div className="text-sm font-medium">
                            {pkg.scheduledStartDate
                              ? new Date(pkg.scheduledStartDate).toLocaleDateString()
                              : 'TBD'}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">End</div>
                          <div className="text-sm font-medium">
                            {pkg.scheduledEndDate
                              ? new Date(pkg.scheduledEndDate).toLocaleDateString()
                              : 'TBD'}
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-24">
                          <Progress value={pkg.overallProgress} className="h-2" />
                          <div className="text-xs text-center text-muted-foreground mt-1">
                            {pkg.overallProgress}%
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {filteredPackages.filter(pkg => pkg.scheduledStartDate).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock size={48} className="text-muted-foreground mb-4" weight="duotone" />
                    <p className="text-sm text-muted-foreground">No packages with scheduled dates</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPackage && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono font-semibold text-muted-foreground">
                    {selectedPackage.packageNumber}
                  </span>
                  <Badge variant={getStatusBadgeVariant(selectedPackage.overallStatus)}>
                    {selectedPackage.overallStatus}
                  </Badge>
                </div>
                <CardTitle>{selectedPackage.title}</CardTitle>
                {selectedPackage.description && (
                  <CardDescription className="mt-2">{selectedPackage.description}</CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedPackage.overallStatus}
                  onValueChange={handleUpdatePackageStatus}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-ready">Not Ready</SelectItem>
                    <SelectItem value="partially-ready">Partially Ready</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPackageId('')}>
                  <X size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText size={16} />
                  <span className="font-medium">Detailing Readiness</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {selectedPackage.detailingReadiness.readinessPercent}%
                    </span>
                    {selectedPackage.detailingReadiness.isReady ? (
                      <CheckCircle size={24} className="text-accent" weight="fill" />
                    ) : (
                      <Clock size={24} className="text-warning" weight="duotone" />
                    )}
                  </div>
                  <Progress value={selectedPackage.detailingReadiness.readinessPercent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {selectedPackage.detailingReadiness.requiredItems.filter(i => i.completed).length} /{' '}
                    {selectedPackage.detailingReadiness.requiredItems.length} items complete
                  </div>
                  {selectedPackage.detailingReadiness.blockers.filter(b => b.status === 'active').length >
                    0 && (
                    <Badge variant="destructive" className="text-xs">
                      {selectedPackage.detailingReadiness.blockers.filter(b => b.status === 'active').length}{' '}
                      blocker(s)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart size={16} />
                  <span className="font-medium">Material Readiness</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {selectedPackage.materialReadiness.readinessPercent}%
                    </span>
                    {selectedPackage.materialReadiness.isReady ? (
                      <CheckCircle size={24} className="text-accent" weight="fill" />
                    ) : (
                      <Clock size={24} className="text-warning" weight="duotone" />
                    )}
                  </div>
                  <Progress value={selectedPackage.materialReadiness.readinessPercent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {selectedPackage.materialReadiness.requiredItems.filter(i => i.completed).length} /{' '}
                    {selectedPackage.materialReadiness.requiredItems.length} items complete
                  </div>
                  {selectedPackage.materialReadiness.blockers.filter(b => b.status === 'active').length >
                    0 && (
                    <Badge variant="destructive" className="text-xs">
                      {selectedPackage.materialReadiness.blockers.filter(b => b.status === 'active').length}{' '}
                      blocker(s)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hammer size={16} />
                  <span className="font-medium">Production Readiness</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {selectedPackage.productionReadiness.readinessPercent}%
                    </span>
                    {selectedPackage.productionReadiness.isReady ? (
                      <CheckCircle size={24} className="text-accent" weight="fill" />
                    ) : (
                      <Clock size={24} className="text-warning" weight="duotone" />
                    )}
                  </div>
                  <Progress value={selectedPackage.productionReadiness.readinessPercent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {selectedPackage.productionReadiness.requiredItems.filter(i => i.completed).length} /{' '}
                    {selectedPackage.productionReadiness.requiredItems.length} items complete
                  </div>
                  {selectedPackage.productionReadiness.blockers.filter(b => b.status === 'active').length >
                    0 && (
                    <Badge variant="destructive" className="text-xs">
                      {selectedPackage.productionReadiness.blockers.filter(b => b.status === 'active').length}{' '}
                      blocker(s)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck size={16} />
                  <span className="font-medium">Delivery Readiness</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {selectedPackage.deliveryReadiness.readinessPercent}%
                    </span>
                    {selectedPackage.deliveryReadiness.isReady ? (
                      <CheckCircle size={24} className="text-accent" weight="fill" />
                    ) : (
                      <Clock size={24} className="text-warning" weight="duotone" />
                    )}
                  </div>
                  <Progress value={selectedPackage.deliveryReadiness.readinessPercent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {selectedPackage.deliveryReadiness.requiredItems.filter(i => i.completed).length} /{' '}
                    {selectedPackage.deliveryReadiness.requiredItems.length} items complete
                  </div>
                  {selectedPackage.deliveryReadiness.blockers.filter(b => b.status === 'active').length >
                    0 && (
                    <Badge variant="destructive" className="text-xs">
                      {selectedPackage.deliveryReadiness.blockers.filter(b => b.status === 'active').length}{' '}
                      blocker(s)
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="detailing" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="detailing">Detailing</TabsTrigger>
                <TabsTrigger value="material">Material</TabsTrigger>
                <TabsTrigger value="production">Production</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
              </TabsList>

              {['detailing', 'material', 'production', 'delivery'].map(category => {
                const readinessKey = `${category}Readiness` as keyof FabWorkPackage
                const readiness = selectedPackage[readinessKey] as any

                return (
                  <TabsContent key={category} value={category} className="space-y-4">
                    {readiness.requiredItems.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold">Required Items</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingReadinessType(category as any)
                              setEditDialogOpen(true)
                            }}
                          >
                            <PencilSimple size={14} className="mr-1" />
                            Edit
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {readiness.requiredItems.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setEditingReadinessType(category as any)
                                handleToggleReadinessItem(item.id)
                              }}
                            >
                              <div className="flex items-center pt-0.5">
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => {
                                    setEditingReadinessType(category as any)
                                    handleToggleReadinessItem(item.id)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.description}
                                  </span>
                                  {item.required && (
                                    <Badge variant="outline" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                {item.completedDate && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Completed {new Date(item.completedDate).toLocaleDateString()}
                                    {item.completedBy && ` by ${item.completedBy}`}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {readiness.blockers.filter((b: FabBlocker) => b.status === 'active').length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Warning size={16} className="text-destructive" weight="fill" />
                          Active Blockers
                        </h4>
                        <div className="space-y-2">
                          {readiness.blockers
                            .filter((b: FabBlocker) => b.status === 'active')
                            .map((blocker: FabBlocker) => (
                              <div
                                key={blocker.id}
                                className={`p-3 border-l-4 rounded-lg ${
                                  blocker.severity === 'critical'
                                    ? 'border-l-destructive bg-destructive/5'
                                    : blocker.severity === 'high'
                                    ? 'border-l-warning bg-warning/5'
                                    : 'border-l-muted bg-muted/30'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{blocker.description}</span>
                                      <Badge
                                        variant={
                                          blocker.severity === 'critical' ? 'destructive' : 'outline'
                                        }
                                        className="text-xs"
                                      >
                                        {blocker.severity}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Type: {blocker.blockerType.replace('-', ' ')}
                                    </p>
                                    {blocker.impactDescription && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Impact: {blocker.impactDescription}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Identified:{' '}
                                      {new Date(blocker.identifiedDate).toLocaleDateString()}
                                    </p>
                                    {blocker.assignedTo && (
                                      <p className="text-xs text-muted-foreground">
                                        Assigned to: {blocker.assignedTo}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingReadinessType(category as any)
                                      handleResolveBlocker(blocker.id)
                                    }}
                                  >
                                    <Check size={14} className="mr-1" />
                                    Resolve
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {readiness.requiredItems.length === 0 &&
                      readiness.blockers.filter((b: FabBlocker) => b.status === 'active').length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <CheckCircle size={48} className="text-accent mb-3" weight="duotone" />
                          <p className="text-sm text-muted-foreground">
                            All {category} requirements are met
                          </p>
                        </div>
                      )}
                  </TabsContent>
                )
              })}
            </Tabs>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold mb-2">Package Details</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Pieces:</dt>
                    <dd className="font-medium">{selectedPackage.totalPieces}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Weight:</dt>
                    <dd className="font-medium">{selectedPackage.totalWeight.toLocaleString()} tons</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Cost:</dt>
                    <dd className="font-medium">${selectedPackage.totalCost.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Assigned Crew:</dt>
                    <dd className="font-medium">{selectedPackage.assignedCrew || 'Unassigned'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Station:</dt>
                    <dd className="font-medium">{selectedPackage.assignedStation || 'TBD'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Schedule</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Scheduled Start:</dt>
                    <dd className="font-medium">
                      {selectedPackage.scheduledStartDate
                        ? new Date(selectedPackage.scheduledStartDate).toLocaleDateString()
                        : 'Not scheduled'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Scheduled End:</dt>
                    <dd className="font-medium">
                      {selectedPackage.scheduledEndDate
                        ? new Date(selectedPackage.scheduledEndDate).toLocaleDateString()
                        : 'Not scheduled'}
                    </dd>
                  </div>
                  {selectedPackage.actualStartDate && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Actual Start:</dt>
                      <dd className="font-medium">
                        {new Date(selectedPackage.actualStartDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {selectedPackage.actualEndDate && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Actual End:</dt>
                      <dd className="font-medium">
                        {new Date(selectedPackage.actualEndDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {selectedPackage.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedPackage.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
