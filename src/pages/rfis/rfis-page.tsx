import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Question, CheckCircle, Clock, Warning } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { RFI } from '@/lib/types'

export function RFIsPage() {
  const { projectId } = useParams()
  const [rfis, setRfis] = useKV<RFI[]>(`rfis-${projectId}`, [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    number: '',
    subject: '',
    question: '',
    priority: 'medium' as RFI['priority'],
    dueDate: '',
  })

  const handleCreate = () => {
    if (!formData.number || !formData.subject || !formData.question) {
      toast.error('Please fill in required fields')
      return
    }

    const newRFI: RFI = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...formData,
      status: 'open',
      submittedBy: 'Current User',
      submittedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    setRfis(current => [...(current || []), newRFI])
    setIsCreateOpen(false)
    setFormData({
      number: '',
      subject: '',
      question: '',
      priority: 'medium',
      dueDate: '',
    })
    toast.success('RFI created successfully')
  }

  const getStatusBadge = (status: RFI['status']) => {
    const variants: Record<RFI['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      open: { variant: 'outline', icon: <Question size={14} /> },
      answered: { variant: 'default', icon: <CheckCircle size={14} /> },
      closed: { variant: 'secondary', icon: <CheckCircle size={14} /> },
      escalated: { variant: 'destructive', icon: <Warning size={14} /> },
    }
    return variants[status]
  }

  const getPriorityColor = (priority: RFI['priority']) => {
    const colors: Record<RFI['priority'], string> = {
      low: 'bg-secondary text-secondary-foreground',
      medium: 'bg-primary text-primary-foreground',
      high: 'bg-accent text-accent-foreground',
      critical: 'bg-destructive text-destructive-foreground',
    }
    return colors[priority]
  }

  const openRFIs = rfis?.filter(r => r.status === 'open').length || 0
  const answeredRFIs = rfis?.filter(r => r.status === 'answered').length || 0
  const escalatedRFIs = rfis?.filter(r => r.status === 'escalated').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">RFIs</h2>
          <p className="text-muted-foreground">Request for Information management</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create RFI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create RFI</DialogTitle>
              <DialogDescription>Submit a new Request for Information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rfi-number">RFI Number *</Label>
                <Input
                  id="rfi-number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="e.g., RFI-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rfi-subject">Subject *</Label>
                <Input
                  id="rfi-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief subject"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rfi-question">Question *</Label>
                <Textarea
                  id="rfi-question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Detailed question or clarification needed"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rfi-priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: RFI['priority']) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger id="rfi-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rfi-due">Due Date</Label>
                  <Input
                    id="rfi-due"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create RFI</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
            <Question size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRFIs}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
            <CheckCircle size={20} className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{answeredRFIs}</div>
            <p className="text-xs text-muted-foreground">
              Responses received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <Warning size={20} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalatedRFIs}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RFI List</CardTitle>
          <CardDescription>All project RFIs and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {!rfis || rfis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Question size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RFIs submitted</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first RFI to request information or clarification
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={16} className="mr-2" />
                Create RFI
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfis.map((rfi) => {
                  const statusBadge = getStatusBadge(rfi.status)
                  const daysOpen = Math.floor(
                    (new Date().getTime() - new Date(rfi.submittedDate).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <TableRow key={rfi.id}>
                      <TableCell className="font-medium font-mono">{rfi.number}</TableCell>
                      <TableCell>
                        <div className="font-medium">{rfi.subject}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{rfi.question}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(rfi.priority)}>
                          {rfi.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant} className="gap-1">
                          {statusBadge.icon}
                          {rfi.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(rfi.submittedDate).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{rfi.submittedBy}</div>
                      </TableCell>
                      <TableCell>
                        {rfi.dueDate ? new Date(rfi.dueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={daysOpen > 7 ? 'destructive' : 'outline'}>
                          {daysOpen}d
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
