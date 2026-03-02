import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChartLine, TrendUp, TrendDown, Warning, CheckCircle, Clock } from '@phosphor-icons/react'
import { calculateProjectScheduleHealth, forecastProjectCost, computeMarginAtRisk, getCostRiskSignal } from '@/lib/functions/dashboard'
import { projectsDb } from '@/lib/db'
import type { Project } from '@/lib/types'
import { toast } from 'sonner'

export function ProjectDashboardPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [scheduleHealth, setScheduleHealth] = useState<number | null>(null)
  const [costForecast, setCostForecast] = useState<any>(null)
  const [marginRisk, setMarginRisk] = useState<any>(null)
  const [costRiskSignal, setCostRiskSignal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const proj = await projectsDb.getById(projectId)
        setProject(proj || null)

        const [health, forecast, margin, signal] = await Promise.all([
          calculateProjectScheduleHealth(projectId),
          forecastProjectCost(projectId),
          computeMarginAtRisk(projectId),
          getCostRiskSignal(projectId),
        ])

        setScheduleHealth(health)
        setCostForecast(forecast)
        setMarginRisk(margin)
        setCostRiskSignal(signal)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        toast.error('Failed to load project dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [projectId])

  if (!project) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading project...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getHealthColor = (health: number) => {
    if (health >= 75) return 'text-green-600'
    if (health >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSignalColor = (signal: 'green' | 'yellow' | 'red') => {
    if (signal === 'green') return 'bg-green-500'
    if (signal === 'yellow') return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
        <p className="text-muted-foreground">
          {project.number} • {project.client}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule Health</CardTitle>
            <ChartLine size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || scheduleHealth === null ? (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${getHealthColor(scheduleHealth)}`}>
                  {scheduleHealth.toFixed(0)}%
                </div>
                <Progress value={scheduleHealth} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Risk</CardTitle>
            <div className={`h-3 w-3 rounded-full ${costRiskSignal ? getSignalColor(costRiskSignal.signal) : 'bg-gray-300'}`} />
          </CardHeader>
          <CardContent>
            {loading || !costRiskSignal ? (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{costRiskSignal.score}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {costRiskSignal.signal.toUpperCase()} signal
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
            <TrendUp size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(project.contractValue / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Total contract
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin at Risk</CardTitle>
            <Warning size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !marginRisk ? (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  ${(marginRisk.marginAtRisk / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-muted-foreground">
                  Exposure identified
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {costForecast && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Forecast</CardTitle>
            <CardDescription>90-day cost projection and variance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Projected Cost</div>
                <div className="text-2xl font-bold">
                  ${(costForecast.projectedCost / 1000000).toFixed(2)}M
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Variance</div>
                <div className={`text-2xl font-bold ${costForecast.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {costForecast.variance > 0 ? '+' : ''}${(costForecast.variance / 1000).toFixed(0)}K
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                <div className="text-2xl font-bold">{costForecast.confidence}%</div>
              </div>
            </div>

            {costForecast.breakdown && costForecast.breakdown.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-3">Cost Breakdown</div>
                <div className="space-y-2">
                  {costForecast.breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{item.category}</span>
                      <span className="text-sm font-medium">
                        ${(item.amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {marginRisk && marginRisk.riskFactors && marginRisk.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Factors</CardTitle>
            <CardDescription>Key factors contributing to margin risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marginRisk.riskFactors.map((factor: any, idx: number) => (
                <div key={idx} className="border-l-4 border-yellow-500 pl-4">
                  <div className="font-semibold">{factor.factor}</div>
                  <div className="text-sm text-muted-foreground mt-1">{factor.description}</div>
                  <div className="text-sm font-medium mt-2">
                    Impact: ${(factor.impact / 1000).toFixed(0)}K
                  </div>
                </div>
              ))}
            </div>

            {marginRisk.recommendation && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle size={18} className="text-primary" />
                  Recommendation
                </div>
                <p className="text-sm">{marginRisk.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {costRiskSignal && costRiskSignal.alerts && costRiskSignal.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {costRiskSignal.alerts.map((alert: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Warning size={18} className="text-yellow-600 mt-0.5" />
                  <span className="text-sm">{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
