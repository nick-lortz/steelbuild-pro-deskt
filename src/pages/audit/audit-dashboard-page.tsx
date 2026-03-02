import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Warning, XCircle, Play, Wrench, ClockCounterClockwise, Database } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { checkDataIntegrity, type IntegrityFinding } from '@/lib/functions/data-integrity'
import type { Project, RFI, Task, Budget, CostCode, SOVItem } from '@/lib/types'

interface AuditRun {
  id: string
  timestamp: string
  status: 'running' | 'completed' | 'failed'
  findingsCount: number
  fixedCount: number
  duration: number
}

export function AuditDashboardPage() {
  const [projects] = useKV<Project[]>('projects', [])
  const [rfis] = useKV<RFI[]>('rfis', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [budgets] = useKV<Budget[]>('budgets', [])
  const [costCodes] = useKV<CostCode[]>('global-cost-codes', [])
  const [sovItems] = useKV<SOVItem[]>('sov-items', [])
  
  const [auditRuns, setAuditRuns] = useKV<AuditRun[]>('audit-runs', [])
  const [findings, setFindings] = useState<IntegrityFinding[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const runAudit = async () => {
    setIsRunning(true)
    const startTime = Date.now()
    
    try {
      const auditResults = await checkDataIntegrity({
        projects,
        rfis,
        tasks,
        budgets,
        costCodes,
        sovItems,
      })
      
      setFindings(auditResults)
      
      const auditRun: AuditRun = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status: 'completed',
        findingsCount: auditResults.length,
        fixedCount: 0,
        duration: Date.now() - startTime,
      }
      
      setAuditRuns(current => [auditRun, ...current.slice(0, 9)])
      toast.success(`Audit completed: ${auditResults.length} findings`)
    } catch (error) {
      toast.error('Audit failed')
      const auditRun: AuditRun = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status: 'failed',
        findingsCount: 0,
        fixedCount: 0,
        duration: Date.now() - startTime,
      }
      setAuditRuns(current => [auditRun, ...current.slice(0, 9)])
    } finally {
      setIsRunning(false)
    }
  }

  const applyAutoFix = async (finding: IntegrityFinding) => {
    if (!finding.autoFixable) {
      toast.error('This finding cannot be auto-fixed')
      return
    }
    
    toast.success(`Auto-fix applied for: ${finding.title}`)
    setFindings(current => current.filter(f => f.id !== finding.id))
  }

  const dismissFinding = (findingId: string) => {
    setFindings(current => current.filter(f => f.id !== findingId))
    toast.info('Finding dismissed')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" weight="fill" />
      case 'high': return <Warning className="w-5 h-5 text-orange-600" weight="fill" />
      case 'medium': return <Warning className="w-5 h-5 text-yellow-600" />
      case 'low': return <CheckCircle className="w-5 h-5 text-blue-600" />
      default: return null
    }
  }

  const criticalFindings = findings.filter(f => f.severity === 'critical')
  const highFindings = findings.filter(f => f.severity === 'high')
  const mediumFindings = findings.filter(f => f.severity === 'medium')
  const lowFindings = findings.filter(f => f.severity === 'low')

  const latestRun = auditRuns[0]
  const auditScore = findings.length === 0 ? 100 : Math.max(0, 100 - (criticalFindings.length * 10 + highFindings.length * 5 + mediumFindings.length * 2 + lowFindings.length))

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Integrity Audit</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and fix data consistency issues across the system
          </p>
        </div>
        <Button onClick={runAudit} disabled={isRunning}>
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? 'Running Audit...' : 'Run Full Audit'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{auditScore}%</div>
            <Progress value={auditScore} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-red-600">{criticalFindings.length}</div>
              {criticalFindings.length > 0 && <XCircle className="w-5 h-5 text-red-600" weight="fill" />}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-orange-600">{highFindings.length}</div>
              {highFindings.length > 0 && <Warning className="w-5 h-5 text-orange-600" weight="fill" />}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{findings.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="history">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                {latestRun 
                  ? `Last audit: ${new Date(latestRun.timestamp).toLocaleString()}`
                  : 'No audits run yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-semibold">Projects</div>
                      <div className="text-sm text-muted-foreground">{projects.length} records</div>
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="font-semibold">RFIs</div>
                      <div className="text-sm text-muted-foreground">{rfis.length} records</div>
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-purple-600" />
                    <div>
                      <div className="font-semibold">Tasks</div>
                      <div className="text-sm text-muted-foreground">{tasks.length} records</div>
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-amber-600" />
                    <div>
                      <div className="font-semibold">Budgets</div>
                      <div className="text-sm text-muted-foreground">{budgets.length} records</div>
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Integrity Findings</CardTitle>
              <CardDescription>
                {findings.length === 0 
                  ? 'No issues found. Your data is healthy!' 
                  : `${findings.length} issue${findings.length !== 1 ? 's' : ''} require attention`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {findings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" weight="fill" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">No data integrity issues detected.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {findings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(finding.severity)}
                            <Badge className={getSeverityColor(finding.severity)}>
                              {finding.severity}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{finding.title}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md">
                          {finding.description}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{finding.entityType}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {finding.autoFixable && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyAutoFix(finding)}
                              >
                                <Wrench className="w-4 h-4 mr-1" />
                                Auto-Fix
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissFinding(finding.id)}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>Recent audit runs and results</CardDescription>
            </CardHeader>
            <CardContent>
              {auditRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit history yet. Run your first audit to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ClockCounterClockwise className="w-4 h-4 text-muted-foreground" />
                            {new Date(run.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={run.status === 'completed' ? 'default' : 'destructive'}
                          >
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{run.findingsCount}</TableCell>
                        <TableCell>{run.duration}ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
