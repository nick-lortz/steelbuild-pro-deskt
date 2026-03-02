import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Stack, 
  Factory, 
  Truck, 
  HardHat, 
  CheckCircle, 
  Warning, 
  ArrowRight,
  Clock
} from '@phosphor-icons/react'
import { db } from '@/lib/db'

interface WorkflowStage {
  id: string
  name: string
  icon: any
  count: number
  items: any[]
  status: 'complete' | 'in-progress' | 'blocked' | 'pending'
}

export function WorkflowDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflowData()
  }, [projectId])

  const loadWorkflowData = async () => {
    if (!projectId) return

    const detailings = await db.detailings
      .where('projectId')
      .equals(projectId)
      .toArray()

    const fabrications = await db.fabricationPackages
      .where('projectId')
      .equals(projectId)
      .toArray()

    const deliveries = await db.deliveries
      .where('projectId')
      .equals(projectId)
      .toArray()

    const erectionTasks = await db.erectionSequences
      .where('projectId')
      .equals(projectId)
      .toArray()

    const stagesData: WorkflowStage[] = [
      {
        id: 'detailing',
        name: 'Detailing',
        icon: Stack,
        count: detailings.length,
        items: detailings.map(d => ({
          id: d.id,
          name: d.name,
          status: d.status,
          progress: d.percentComplete || 0,
          dueDate: d.targetDate
        })),
        status: getStageStatus(detailings.map(d => d.status))
      },
      {
        id: 'fabrication',
        name: 'Fabrication',
        icon: Factory,
        count: fabrications.length,
        items: fabrications.map(f => ({
          id: f.id,
          name: f.name,
          status: f.status,
          progress: f.percentComplete || 0,
          dueDate: f.dueDate
        })),
        status: getStageStatus(fabrications.map(f => f.status))
      },
      {
        id: 'deliveries',
        name: 'Deliveries',
        icon: Truck,
        count: deliveries.length,
        items: deliveries.map(d => ({
          id: d.id,
          name: `Delivery ${d.deliveryNumber}`,
          status: d.status,
          scheduledDate: d.scheduledDate,
          actualDate: d.actualDate
        })),
        status: getStageStatus(deliveries.map(d => d.status))
      },
      {
        id: 'install',
        name: 'Install/Erection',
        icon: HardHat,
        count: erectionTasks.length,
        items: erectionTasks.map(e => ({
          id: e.id,
          name: e.name,
          status: e.status,
          progress: e.percentComplete || 0,
          startDate: e.erectionStartDate
        })),
        status: getStageStatus(erectionTasks.map(e => e.status))
      }
    ]

    setStages(stagesData)
    setLoading(false)
  }

  const getStageStatus = (statuses: string[]): WorkflowStage['status'] => {
    if (statuses.length === 0) return 'pending'
    
    const hasBlocked = statuses.some(s => 
      s === 'blocked' || s === 'on-hold' || s === 'delayed'
    )
    if (hasBlocked) return 'blocked'
    
    const allComplete = statuses.every(s => 
      s === 'complete' || s === 'delivered' || s === 'erected'
    )
    if (allComplete) return 'complete'
    
    const hasInProgress = statuses.some(s => 
      s === 'in-progress' || s === 'in-fabrication' || s === 'in-transit'
    )
    if (hasInProgress) return 'in-progress'
    
    return 'pending'
  }

  const getStatusColor = (status: WorkflowStage['status']) => {
    switch (status) {
      case 'complete':
        return 'text-green-500'
      case 'in-progress':
        return 'text-blue-500'
      case 'blocked':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: WorkflowStage['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle weight="fill" className="text-green-500" />
      case 'blocked':
        return <Warning weight="fill" className="text-red-500" />
      default:
        return <Clock className="text-blue-500" />
    }
  }

  if (loading) {
    return <div className="p-8">Loading workflow...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track complete flow from detailing to installation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {stages.map((stage, index) => (
          <div key={stage.id} className="relative">
            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-accent/10`}>
                    <stage.icon size={24} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{stage.name}</h3>
                    <p className="text-2xl font-bold mt-1">{stage.count}</p>
                  </div>
                </div>
                {getStatusIcon(stage.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={stage.status === 'blocked' ? 'destructive' : 'secondary'}>
                    {stage.status}
                  </Badge>
                </div>

                {stage.items.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium">Recent Items</div>
                    {stage.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-md bg-secondary/50 text-sm"
                      >
                        <div className="font-medium truncate">{item.name}</div>
                        {item.progress !== undefined && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {item.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    const routes = {
                      detailing: 'detailing',
                      fabrication: 'fab-tracking',
                      deliveries: 'deliveries',
                      install: 'lookahead'
                    }
                    window.location.href = `/projects/${projectId}/${routes[stage.id as keyof typeof routes]}`
                  }}
                >
                  View All
                </Button>
              </div>
            </Card>

            {index < stages.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                <ArrowRight size={24} className="text-muted-foreground" weight="bold" />
              </div>
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Workflow Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="text-sm text-muted-foreground mb-1">Average Cycle Time</div>
            <div className="text-2xl font-bold">23 days</div>
            <div className="text-xs text-muted-foreground mt-1">
              From detailing to erection
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="text-sm text-muted-foreground mb-1">Bottleneck Stage</div>
            <div className="text-2xl font-bold">Fabrication</div>
            <div className="text-xs text-muted-foreground mt-1">
              12 packages in queue
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="text-sm text-muted-foreground mb-1">On-Time Completion</div>
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Meeting target dates
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Critical Path Items</h2>
        <div className="space-y-3">
          {stages.flatMap(stage => 
            stage.items.filter(item => item.status === 'blocked' || item.status === 'delayed')
          ).map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <div className="flex items-center gap-3">
                <Warning size={20} className="text-destructive" weight="fill" />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: {item.status}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Resolve
              </Button>
            </div>
          ))}
          
          {stages.every(stage => 
            stage.items.every(item => item.status !== 'blocked' && item.status !== 'delayed')
          ) && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle size={48} className="mx-auto mb-2 text-green-500" weight="fill" />
              <p>No critical issues detected</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
