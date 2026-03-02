import { useEffect, useState } from 'react'
import { Buildings, CurrencyDollar, Wrench, ListChecks } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface DashboardStatsProps {
  projectId?: string
}

export function DashboardStats({ projectId }: DashboardStatsProps) {
  const [counts, setCounts] = useState({
    rfi_count: 0,
    equipment_count: 0,
    cost_code_count: 0,
    total_budget: 0,
    total_actual: 0,
  })
  const [loading, setLoading] = useState(true)
  const isDesktop = typeof window !== 'undefined' && window.SBP?.db

  useEffect(() => {
    const loadCounts = async () => {
      if (!projectId || !isDesktop) {
        setLoading(false)
        return
      }

      try {
        const result = await window.SBP!.db.getDashboardCounts(projectId)
        if (result.success && result.data) {
          setCounts(result.data)
        }
      } catch (error) {
        console.error('Failed to load dashboard counts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCounts()
  }, [projectId, isDesktop])

  const budgetUsagePercent = counts.total_budget > 0 
    ? (counts.total_actual / counts.total_budget) * 100 
    : 0

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
          <ListChecks size={20} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.rfi_count}</div>
          <p className="text-xs text-muted-foreground">
            Active requests
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipment</CardTitle>
          <Wrench size={20} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.equipment_count}</div>
          <p className="text-xs text-muted-foreground">
            Total items
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost Codes</CardTitle>
          <Buildings size={20} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.cost_code_count}</div>
          <p className="text-xs text-muted-foreground">
            Active codes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
          <CurrencyDollar size={20} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{budgetUsagePercent.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            ${counts.total_actual.toLocaleString()} / ${counts.total_budget.toLocaleString()}
          </p>
          <Progress value={budgetUsagePercent} className="mt-2 h-1" />
        </CardContent>
      </Card>
    </div>
  )
}
