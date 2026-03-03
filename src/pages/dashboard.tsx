import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Buildings, CurrencyDollar, Wrench, ListChecks, Plus, Warning, FileText, Calendar, TrendUp, CheckCircle, ArrowsClockwise } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { projectsDb, equipmentDb, checklistsDb, rfisDb } from '@/lib/db'
import { useKV } from '@github/spark/hooks'
import { useDatabase } from '@/hooks/use-database'
import type { Project, Equipment, Checklist, RFI, Task, Alert as AlertType, Submittal } from '@/lib/types'

export function DashboardPage() {
  const { isDesktop, db } = useDatabase()
  const [projects, setProjects] = useState<Project[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [rfis, setRfis] = useState<RFI[]>([])
  const [allTasks] = useKV<Task[]>('tasks', [])
  const [alerts] = useKV<AlertType[]>('alerts', [])
  const [submittals] = useKV<Submittal[]>('submittals', [])
  const [refreshKey, setRefreshKey] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [financialSummary, setFinancialSummary] = useState<{
    totalContractValue: number
    totalBudget: number
    totalActual: number
    margin: number
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setSyncing(true)
      try {
        const [p, e, c, r] = await Promise.all([
          projectsDb.getAll(),
          equipmentDb.getAll(),
          checklistsDb.getAll(),
          rfisDb.getAll(),
        ])
        setProjects(p)
        setEquipment(e)
        setChecklists(c)
        setRfis(r)

        if (isDesktop && p.length > 0) {
          const totalResult = await db.recalculateProjectTotals(p[0].id)
          if (totalResult.success && totalResult.data) {
            setFinancialSummary(totalResult.data)
          }
        }
      } finally {
        setTimeout(() => setSyncing(false), 500)
      }
    }
    loadData()
  }, [refreshKey, isDesktop, db])

  useEffect(() => {
    const handleDataChange = () => {
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('dataUpdated', handleDataChange)
    return () => window.removeEventListener('dataUpdated', handleDataChange)
  }, [])

  const activeProjects = projects.filter((p) => p.status === 'active')
  const totalContractValue = financialSummary?.totalContractValue ?? projects.reduce((sum, p) => sum + p.contractValue, 0)
  const pendingChecklists = checklists.filter((c) => c.status !== 'completed')
  
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.dismissed).length
  const openRFIs = rfis.filter(r => r.status === 'open').length
  const overdueTasks = allTasks.filter(t => {
    if (t.status === 'completed') return false
    if (!t.endDate) return false
    return new Date(t.endDate) < new Date()
  }).length
  const pendingSubmittals = submittals.filter(s => 
    s.status === 'submitted' || s.status === 'IFA' || s.status === 'BFA'
  ).length

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-text uppercase">Control Tower</h2>
          <p className="text-text-dim mt-1 text-sm tracking-wide">
            Real-time operations overview
          </p>
        </div>
        {syncing && (
          <div className="px-4 py-2 rounded-full bg-panel-bg-2 border border-panel-border text-text-dim text-xs uppercase tracking-wider flex items-center gap-2 animate-pulse">
            <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
            Syncing...
          </div>
        )}
      </div>

      {criticalAlerts > 0 && (
        <div className="phoenix-panel p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255, 77, 77, 0.08), rgba(255, 77, 77, 0.03))' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger/20 rounded-full blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="p-3 rounded-xl phoenix-glow" style={{ background: 'rgba(255, 90, 31, 0.15)' }}>
              <Warning className="w-6 h-6 text-accent" weight="fill" />
            </div>
            <div className="flex-1">
              <h3 className="text-text font-bold text-sm uppercase tracking-wider mb-1">Critical Alerts</h3>
              <p className="text-text-dim text-sm">
                You have <span className="font-bold text-accent">{criticalAlerts}</span> critical alert{criticalAlerts !== 1 ? 's' : ''} requiring immediate attention.
              </p>
              <Link to="/alerts">
                <button className="mt-4 px-4 py-2 rounded-xl bg-accent text-white font-medium text-xs uppercase tracking-wider phoenix-glow hover:bg-accent-2 transition-all">
                  View Alerts
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Active Projects</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 90, 31, 0.12)' }}>
              <Buildings size={20} className="text-accent" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-text mb-1">{activeProjects.length}</div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            of {projects.length} total
          </p>
          <div className="mt-4 h-1.5 bg-panel-bg-2 rounded-full overflow-hidden">
            <div 
              className="h-full phoenix-gradient rounded-full transition-all duration-500" 
              style={{ width: `${(activeProjects.length / Math.max(projects.length, 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Contract Value</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(77, 214, 164, 0.12)' }}>
              <CurrencyDollar size={20} className="text-success" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-text mb-1">
            ${(totalContractValue / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            Portfolio Total
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-success uppercase tracking-wider">
            <TrendUp className="w-4 h-4" weight="bold" />
            <span>Healthy</span>
          </div>
        </div>

        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Open RFIs</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 177, 90, 0.12)' }}>
              <FileText size={20} className="text-warning" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-text mb-1">{openRFIs}</div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            Awaiting Response
          </p>
          {openRFIs > 5 && (
            <div className="mt-4 px-3 py-1 rounded-full bg-danger/15 text-danger text-xs font-bold uppercase tracking-wider inline-block">
              Action Needed
            </div>
          )}
        </div>

        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Overdue Tasks</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 77, 77, 0.12)' }}>
              <Calendar size={20} className="text-danger" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-danger mb-1">{overdueTasks}</div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            Behind Schedule
          </p>
          {overdueTasks === 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-success uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" weight="fill" />
              <span>On Track</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Equipment Fleet</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 90, 31, 0.12)' }}>
              <Wrench size={20} className="text-accent" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-text mb-1">{equipment.length}</div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            Units in Fleet
          </p>
        </div>

        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Pending Checklists</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 90, 31, 0.12)' }}>
              <ListChecks size={20} className="text-accent" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-text mb-1">{pendingChecklists.length}</div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            Require Attention
          </p>
        </div>

        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Pending Submittals</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 177, 90, 0.12)' }}>
              <FileText size={20} className="text-warning" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-text mb-1">{pendingSubmittals}</div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            In Review
          </p>
        </div>

        <div className="phoenix-panel p-5 hover:shadow-2xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-mute text-xs font-bold uppercase tracking-widest">Critical Alerts</h3>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255, 77, 77, 0.12)' }}>
              <Warning size={20} className="text-danger" weight="duotone" />
            </div>
          </div>
          <div className="font-mono text-4xl font-bold tracking-tight text-danger mb-1">{criticalAlerts}</div>
          <p className="text-xs text-text-dim uppercase tracking-wider">
            Immediate Action
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="phoenix-panel p-6 phoenix-dot-pattern">
          <h3 className="font-display text-lg font-bold text-text uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/projects">
              <button className="w-full px-4 py-3 rounded-xl bg-accent text-white font-medium text-sm uppercase tracking-wider phoenix-glow hover:bg-accent-2 transition-all flex items-center justify-center gap-2">
                <Plus size={18} weight="bold" />
                New Project
              </button>
            </Link>
            <Link to="/cost-codes">
              <button className="w-full px-4 py-3 rounded-xl bg-panel-bg-2 text-text-dim font-medium text-sm uppercase tracking-wider hover:text-text hover:bg-panel-bg-2/80 transition-all flex items-center justify-center gap-2 border border-panel-border">
                <CurrencyDollar size={18} weight="duotone" />
                Cost Codes
              </button>
            </Link>
            <Link to="/equipment">
              <button className="w-full px-4 py-3 rounded-xl bg-panel-bg-2 text-text-dim font-medium text-sm uppercase tracking-wider hover:text-text hover:bg-panel-bg-2/80 transition-all flex items-center justify-center gap-2 border border-panel-border">
                <Wrench size={18} weight="duotone" />
                Equipment
              </button>
            </Link>
            <Link to="/audit">
              <button className="w-full px-4 py-3 rounded-xl bg-panel-bg-2 text-text-dim font-medium text-sm uppercase tracking-wider hover:text-text hover:bg-panel-bg-2/80 transition-all flex items-center justify-center gap-2 border border-panel-border">
                <CheckCircle size={18} weight="duotone" />
                Data Audit
              </button>
            </Link>
          </div>
        </div>

        <div className="phoenix-panel p-6">
          <h3 className="font-display text-lg font-bold text-text uppercase tracking-wider mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-panel-bg-2">
              <span className="text-sm font-medium text-text-dim uppercase tracking-wider">Projects</span>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${activeProjects.length > 0 ? 'bg-success/15 text-success' : 'bg-panel-bg text-text-mute'}`}>
                {activeProjects.length > 0 ? 'Active' : 'None'}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-panel-bg-2">
              <span className="text-sm font-medium text-text-dim uppercase tracking-wider">RFIs</span>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${openRFIs === 0 ? 'bg-success/15 text-success' : openRFIs < 5 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'}`}>
                {openRFIs === 0 ? 'All clear' : `${openRFIs} open`}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-panel-bg-2">
              <span className="text-sm font-medium text-text-dim uppercase tracking-wider">Schedule</span>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${overdueTasks === 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                {overdueTasks === 0 ? 'On track' : `${overdueTasks} overdue`}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-panel-bg-2">
              <span className="text-sm font-medium text-text-dim uppercase tracking-wider">Alerts</span>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${criticalAlerts === 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                {criticalAlerts === 0 ? 'None' : `${criticalAlerts} critical`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="phoenix-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-text uppercase tracking-wider">Recent Projects</h3>
          <Link to="/projects">
            <button className="text-xs font-bold uppercase tracking-wider text-accent hover:text-accent-2 transition-colors">
              View All →
            </button>
          </Link>
        </div>
        {activeProjects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-panel-bg-2 mb-4">
              <Buildings size={40} className="text-text-mute" weight="duotone" />
            </div>
            <p className="text-text-dim text-sm uppercase tracking-wider mb-6">No active projects yet</p>
            <Link to="/projects">
              <button className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-xs uppercase tracking-wider phoenix-glow hover:bg-accent-2 transition-all">
                Create First Project
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProjects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block rounded-xl border border-panel-border p-5 transition-all hover:border-accent/30 hover:bg-panel-bg-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-base mb-1 text-text group-hover:text-accent transition-colors">{project.name}</h3>
                    <p className="text-sm text-text-dim font-mono uppercase tracking-wider">
                      {project.number} • {project.client}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-mono font-bold text-lg text-text">
                      ${(project.contractValue / 1000).toFixed(0)}K
                    </p>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 inline-block ${project.status === 'active' ? 'bg-success/15 text-success' : 'bg-panel-bg-2 text-text-mute'}`}>
                      {project.status}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
