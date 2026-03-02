import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  ChartBar,
  Calendar,
  Funnel,
  Download,
  Play,
  Trash,
  Copy,
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { ReportDefinition, Project } from '@/lib/types'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function CustomReportBuilderPage() {
  const { projectId } = useParams()
  const [reports, setReports] = useKV<ReportDefinition[]>('custom-reports', [])
  const [projects] = useKV<Project[]>('projects', [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'cost' as ReportDefinition['type'],
    description: '',
    chartType: 'bar' as ReportDefinition['chartType'],
    metrics: [] as string[],
    filterProject: '',
    filterDateFrom: '',
    filterDateTo: '',
    filterStatus: '',
  })

  const availableMetrics = {
    cost: ['Total Budget', 'Total Spent', 'Variance', 'Cost Performance Index', 'Estimate at Completion'],
    schedule: ['Total Tasks', 'Completed Tasks', 'Delayed Tasks', 'Schedule Performance Index', 'Days Remaining'],
    productivity: ['Labor Hours', 'Cost per Hour', 'Efficiency Rate', 'Work Packages Completed'],
    safety: ['Incidents', 'Near Misses', 'Safety Training Hours', 'Compliance Rate'],
    quality: ['Open RFIs', 'Overdue RFIs', 'Change Orders', 'Defects', 'Rework Percentage'],
    executive: ['Project Health Score', 'Budget Status', 'Schedule Status', 'Risk Level', 'Client Satisfaction'],
  }

  const handleMetricToggle = (metric: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric],
    }))
  }

  const handleCreateReport = () => {
    if (!formData.name || !formData.type || formData.metrics.length === 0) {
      toast.error('Please fill in required fields and select at least one metric')
      return
    }

    const filters: Record<string, unknown> = {}
    if (formData.filterProject) filters.projectId = formData.filterProject
    if (formData.filterDateFrom) filters.dateFrom = formData.filterDateFrom
    if (formData.filterDateTo) filters.dateTo = formData.filterDateTo
    if (formData.filterStatus) filters.status = formData.filterStatus

    const newReport: ReportDefinition = {
      id: crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      description: formData.description,
      filters,
      metrics: formData.metrics,
      chartType: formData.chartType,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    }

    setReports(current => [...(current || []), newReport])
    setIsCreateOpen(false)
    resetForm()
    toast.success('Custom report created successfully')
  }

  const handleRunReport = async (report: ReportDefinition) => {
    try {
      const mockData = generateMockReportData(report)
      setSelectedReport(report)
      setPreviewData(mockData)
      toast.success('Report generated successfully')
    } catch (error) {
      console.error('Error running report:', error)
      toast.error('Failed to generate report')
    }
  }

  const handleDeleteReport = (reportId: string) => {
    setReports(current => (current || []).filter(r => r.id !== reportId))
    if (selectedReport?.id === reportId) {
      setSelectedReport(null)
      setPreviewData(null)
    }
    toast.success('Report deleted')
  }

  const handleDuplicateReport = (report: ReportDefinition) => {
    const duplicated: ReportDefinition = {
      ...report,
      id: crypto.randomUUID(),
      name: `${report.name} (Copy)`,
      createdAt: new Date().toISOString(),
    }
    setReports(current => [...(current || []), duplicated])
    toast.success('Report duplicated')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cost',
      description: '',
      chartType: 'bar',
      metrics: [],
      filterProject: '',
      filterDateFrom: '',
      filterDateTo: '',
      filterStatus: '',
    })
  }

  const generateMockReportData = (report: ReportDefinition) => {
    const data = []
    for (let i = 0; i < 6; i++) {
      const entry: Record<string, any> = { name: `Category ${i + 1}` }
      report.metrics.forEach(metric => {
        entry[metric] = Math.floor(Math.random() * 100000) + 10000
      })
      data.push(entry)
    }
    return data
  }

  const renderChart = () => {
    if (!previewData || !selectedReport) return null

    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))']

    switch (selectedReport.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={previewData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              {selectedReport.metrics.map((metric, idx) => (
                <Bar key={metric} dataKey={metric} fill={colors[idx % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={previewData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              {selectedReport.metrics.map((metric, idx) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={previewData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey={selectedReport.metrics[0]}
              >
                {previewData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center text-muted-foreground">Chart type not supported</div>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Custom Report Builder</h2>
          <p className="text-muted-foreground">Create and run custom reports with your data</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
              <DialogDescription>Configure a new report with custom metrics and filters</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="report-name">Report Name *</Label>
                  <Input
                    id="report-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Cost Analysis"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="report-type">Report Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: ReportDefinition['type']) => {
                        setFormData({ ...formData, type: value, metrics: [] })
                      }}
                    >
                      <SelectTrigger id="report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cost">Cost</SelectItem>
                        <SelectItem value="schedule">Schedule</SelectItem>
                        <SelectItem value="productivity">Productivity</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="report-chart">Chart Type</Label>
                    <Select
                      value={formData.chartType}
                      onValueChange={(value: any) => setFormData({ ...formData, chartType: value })}
                    >
                      <SelectTrigger id="report-chart">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this report shows"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Metrics to Include *</Label>
                <div className="grid gap-2">
                  {availableMetrics[formData.type].map(metric => (
                    <div key={metric} className="flex items-center space-x-2">
                      <Checkbox
                        id={`metric-${metric}`}
                        checked={formData.metrics.includes(metric)}
                        onCheckedChange={() => handleMetricToggle(metric)}
                      />
                      <label
                        htmlFor={`metric-${metric}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {metric}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Filters</Label>
                <div className="grid gap-4">
                  {!projectId && (
                    <div className="grid gap-2">
                      <Label htmlFor="filter-project">Project</Label>
                      <Select
                        value={formData.filterProject}
                        onValueChange={(value) => setFormData({ ...formData, filterProject: value })}
                      >
                        <SelectTrigger id="filter-project">
                          <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Projects</SelectItem>
                          {projects?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="filter-from">Date From</Label>
                      <Input
                        id="filter-from"
                        type="date"
                        value={formData.filterDateFrom}
                        onChange={(e) => setFormData({ ...formData, filterDateFrom: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="filter-to">Date To</Label>
                      <Input
                        id="filter-to"
                        type="date"
                        value={formData.filterDateTo}
                        onChange={(e) => setFormData({ ...formData, filterDateTo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport}>Create Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
            <CardDescription>Your custom report library</CardDescription>
          </CardHeader>
          <CardContent>
            {!reports || reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ChartBar size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-sm font-semibold mb-2">No reports</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Create your first custom report
                </p>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus size={14} className="mr-2" />
                  Create Report
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map(report => (
                  <div
                    key={report.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? 'bg-accent border-accent'
                        : 'hover:bg-muted border-border'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm">{report.name}</div>
                      <Badge variant="outline" className="text-xs">{report.type}</Badge>
                    </div>
                    {report.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRunReport(report)
                        }}
                      >
                        <Play size={12} className="mr-1" />
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateReport(report)
                        }}
                      >
                        <Copy size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteReport(report.id)
                        }}
                      >
                        <Trash size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedReport ? selectedReport.name : 'Report Preview'}
                </CardTitle>
                <CardDescription>
                  {selectedReport
                    ? `${selectedReport.metrics.length} metrics • ${selectedReport.chartType} chart`
                    : 'Select a report to preview'}
                </CardDescription>
              </div>
              {selectedReport && previewData && (
                <Button variant="outline" size="sm">
                  <Download size={14} className="mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedReport ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ChartBar size={64} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No report selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a report from the list or create a new one
                </p>
              </div>
            ) : !previewData ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Play size={64} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to run</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Run" to generate this report
                </p>
                <Button onClick={() => handleRunReport(selectedReport)}>
                  <Play size={16} className="mr-2" />
                  Run Report
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Report Type</div>
                    <Badge variant="secondary">{selectedReport.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Chart Type</div>
                    <Badge variant="secondary">{selectedReport.chartType}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Metrics</div>
                    <Badge variant="secondary">{selectedReport.metrics.length}</Badge>
                  </div>
                </div>

                <div>{renderChart()}</div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Included Metrics</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.metrics.map(metric => (
                      <Badge key={metric} variant="outline">{metric}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
