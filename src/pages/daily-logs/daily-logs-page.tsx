import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, ClipboardText, Calendar, CloudSun, Users, PencilSimple, Trash, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { DailyLog } from '@/lib/types'

export function DailyLogsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [logs, setLogs] = useKV<DailyLog[]>('daily-logs', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('')

  const projectLogs = logs
    .filter(log => log.projectId === projectId)
    .filter(log => !dateFilter || log.date === dateFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const logData = {
      date: formData.get('date') as string,
      weather: formData.get('weather') as DailyLog['weather'],
      temperature: Number(formData.get('temperature')),
      workPerformed: formData.get('workPerformed') as string,
      crewCount: Number(formData.get('crewCount')),
      equipmentUsed: (formData.get('equipmentUsed') as string).split(',').map(e => e.trim()).filter(Boolean),
      visitors: (formData.get('visitors') as string).split(',').map(v => v.trim()).filter(Boolean),
      delaysOrIssues: formData.get('delaysOrIssues') as string || undefined,
      safetyNotes: formData.get('safetyNotes') as string || undefined,
      materialsDelivered: formData.get('materialsDelivered') as string || undefined,
      photos: [],
    }

    if (editingLog) {
      setLogs(current => current.map(log =>
        log.id === editingLog.id
          ? { ...log, ...logData, updatedAt: new Date().toISOString() }
          : log
      ))
      toast.success('Daily log updated successfully')
    } else {
      const newLog: DailyLog = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...logData,
        submittedBy: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setLogs(current => [...current, newLog])
      toast.success('Daily log created successfully')
    }

    setIsDialogOpen(false)
    setEditingLog(null)
    e.currentTarget.reset()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this daily log?')) {
      setLogs(current => current.filter(log => log.id !== id))
      toast.success('Daily log deleted')
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Weather', 'Temp (°F)', 'Crew Count', 'Work Performed', 'Delays/Issues', 'Safety Notes'],
      ...projectLogs.map(log => [
        log.date,
        log.weather,
        log.temperature,
        log.crewCount,
        log.workPerformed.replace(/,/g, ';'),
        (log.delaysOrIssues || '').replace(/,/g, ';'),
        (log.safetyNotes || '').replace(/,/g, ';'),
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `daily-logs-${projectId}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Daily logs exported')
  }

  const getWeatherIcon = (weather: DailyLog['weather']) => {
    const icons: Record<DailyLog['weather'], string> = {
      'clear': '☀️',
      'cloudy': '☁️',
      'rain': '🌧️',
      'snow': '❄️',
      'wind': '💨',
    }
    return icons[weather] || '☀️'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Logs</h1>
          <p className="text-muted-foreground">Track daily field activities and conditions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={projectLogs.length === 0}>
            <Download className="mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingLog(null)}>
                <Plus className="mr-2" />
                New Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLog ? 'Edit Daily Log' : 'Create Daily Log'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={editingLog?.date || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weather">Weather *</Label>
                    <Select name="weather" defaultValue={editingLog?.weather || 'clear'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear">☀️ Clear</SelectItem>
                        <SelectItem value="cloudy">☁️ Cloudy</SelectItem>
                        <SelectItem value="rain">🌧️ Rain</SelectItem>
                        <SelectItem value="snow">❄️ Snow</SelectItem>
                        <SelectItem value="wind">💨 Windy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°F) *</Label>
                    <Input
                      id="temperature"
                      name="temperature"
                      type="number"
                      defaultValue={editingLog?.temperature || 72}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crewCount">Crew Count *</Label>
                    <Input
                      id="crewCount"
                      name="crewCount"
                      type="number"
                      min="0"
                      defaultValue={editingLog?.crewCount || 0}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equipmentUsed">Equipment Used (comma-separated)</Label>
                    <Input
                      id="equipmentUsed"
                      name="equipmentUsed"
                      defaultValue={editingLog?.equipmentUsed?.join(', ')}
                      placeholder="e.g., Crane 1, Welding Machine"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workPerformed">Work Performed *</Label>
                  <Textarea
                    id="workPerformed"
                    name="workPerformed"
                    defaultValue={editingLog?.workPerformed}
                    placeholder="Describe the work completed today..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materialsDelivered">Materials Delivered</Label>
                  <Textarea
                    id="materialsDelivered"
                    name="materialsDelivered"
                    defaultValue={editingLog?.materialsDelivered}
                    placeholder="List materials delivered to site..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitors">Visitors (comma-separated)</Label>
                  <Input
                    id="visitors"
                    name="visitors"
                    defaultValue={editingLog?.visitors?.join(', ')}
                    placeholder="e.g., John Smith (Owner), Jane Doe (Inspector)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delaysOrIssues">Delays or Issues</Label>
                  <Textarea
                    id="delaysOrIssues"
                    name="delaysOrIssues"
                    defaultValue={editingLog?.delaysOrIssues}
                    placeholder="Describe any delays, issues, or concerns..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safetyNotes">Safety Notes</Label>
                  <Textarea
                    id="safetyNotes"
                    name="safetyNotes"
                    defaultValue={editingLog?.safetyNotes}
                    placeholder="Safety observations, incidents, or near-misses..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingLog ? 'Update' : 'Create'} Log
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projectLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {projectLogs.filter(log => {
                const logDate = new Date(log.date)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return logDate >= weekAgo
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Crew Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {projectLogs.length > 0
                ? Math.round(projectLogs.reduce((sum, log) => sum + log.crewCount, 0) / projectLogs.length)
                : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Issues Reported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {projectLogs.filter(log => log.delaysOrIssues).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Log History</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="date-filter" className="text-sm text-muted-foreground">Filter by date:</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              {dateFilter && (
                <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projectLogs.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardText className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">No daily logs</h3>
              <p className="text-muted-foreground">Start tracking daily field activities</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Weather</TableHead>
                    <TableHead>Crew</TableHead>
                    <TableHead>Work Performed</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-accent/50 group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getWeatherIcon(log.weather)}</span>
                          <span className="text-sm text-muted-foreground">{log.temperature}°F</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users size={16} className="text-muted-foreground" />
                          <span>{log.crewCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.workPerformed}>
                        {log.workPerformed}
                      </TableCell>
                      <TableCell>
                        {log.delaysOrIssues ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800">
                            Has Issues
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.submittedBy}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingLog(log)
                              setIsDialogOpen(true)
                            }}
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log.id)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
