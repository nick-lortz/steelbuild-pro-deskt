import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Question, CheckCircle, Clock, Warning, PencilSimple, Trash } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { rfisDb } from '@/lib/db'
import type { RFI } from '@/lib/types'

export function RFIsPage() {
  const { projectId } = useParams()
  const [rfis, setRfis] = useState<RFI[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRFI, setEditingRFI] = useState<RFI | null>(null)
  const [formData, setFormData] = useState({
    number: '',
    subject: '',
    question: '',
    priority: 'medium' as RFI['priority'],
    dueDate: '',
    status: 'open' as RFI['status'],
  })

  const loadRFIs = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const projectRFIs = await rfisDb.getByProject(projectId)
      setRfis(projectRFIs)
    } catch (error) {
      console.error('Failed to load RFIs:', error)
      toast.error('Failed to load RFIs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRFIs()
  }, [projectId])

  const handleCreate = async () => {
    if (!formData.number || !formData.subject || !formData.question) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      await rfisDb.create({
        projectId: projectId!,
        ...formData,
        submittedBy: 'Current User',
        submittedDate: new Date().toISOString(),
      })
      
      await loadRFIs()
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'rfi', action: 'create' } }))
      setIsCreateOpen(false)
      setFormData({
        number: '',
        subject: '',
        question: '',
        priority: 'medium',
        dueDate: '',
        status: 'open',
      })
      toast.success('RFI created successfully')
    } catch (error: any) {
      console.error('Failed to create RFI:', error)
      toast.error(error.message || 'Failed to create RFI')
    }
  }

  const handleEdit = (rfi: RFI) => {
    setEditingRFI(rfi)
    setFormData({
      number: rfi.number,
      subject: rfi.subject,
      question: rfi.question,
      priority: rfi.priority,
      dueDate: rfi.dueDate || '',
      status: rfi.status,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!formData.number || !formData.subject || !formData.question || !editingRFI) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      await rfisDb.update(editingRFI.id, formData)
      await loadRFIs()
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'rfi', action: 'update' } }))
      setIsEditOpen(false)
      setEditingRFI(null)
      setFormData({
        number: '',
        subject: '',
        question: '',
        priority: 'medium',
        dueDate: '',
        status: 'open',
      })
      toast.success('RFI updated successfully')
    } catch (error: any) {
      console.error('Failed to update RFI:', error)
      toast.error(error.message || 'Failed to update RFI')
    }
  }

  const handleDelete = async (rfiId: string) => {
    try {
      await rfisDb.delete(rfiId)
      await loadRFIs()
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'rfi', action: 'delete' } }))
      toast.success('RFI deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete RFI:', error)
      toast.error(error.message || 'Failed to delete RFI')
    }
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50">
      <div className="space-y-6 p-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">RFIs</h2>
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

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit RFI</DialogTitle>
              <DialogDescription>Update RFI details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-rfi-number">RFI Number *</Label>
                <Input
                  id="edit-rfi-number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="e.g., RFI-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rfi-subject">Subject *</Label>
                <Input
                  id="edit-rfi-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief subject"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rfi-question">Question *</Label>
                <Textarea
                  id="edit-rfi-question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Detailed question or clarification needed"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-rfi-priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: RFI['priority']) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger id="edit-rfi-priority">
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
                  <Label htmlFor="edit-rfi-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: RFI['status']) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="edit-rfi-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rfi-due">Due Date</Label>
                <Input
                  id="edit-rfi-due"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update RFI</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Question size={20} className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRFIs}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <CheckCircle size={20} className="text-accent" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{answeredRFIs}</div>
            <p className="text-xs text-muted-foreground">
              Responses received
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Warning size={20} className="text-destructive" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalatedRFIs}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-muted/10">
          <CardTitle className="text-lg">RFI List</CardTitle>
          <CardDescription>All project RFIs and their status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!rfis || rfis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                <Question size={32} className="text-muted-foreground" weight="duotone" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No RFIs submitted</h3>
              <p className="text-sm text-muted-foreground mb-6">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rfis || []).map((rfi) => {
                  const statusBadge = getStatusBadge(rfi.status)
                  const daysOpen = Math.floor(
                    (new Date().getTime() - new Date(rfi.submittedDate).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const isOverdue = daysOpen > 7
                  const isCritical = daysOpen > 14
                  
                  return (
                    <TableRow key={rfi.id} className={isCritical ? 'bg-destructive/5 hover:bg-destructive/10' : ''}>
                      <TableCell className="font-semibold font-mono text-foreground">
                        {rfi.number}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="font-medium text-foreground truncate">{rfi.subject}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{rfi.question}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(rfi.priority)} variant="default">
                          {rfi.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant} className="gap-1.5 font-medium">
                          {statusBadge.icon}
                          <span className="capitalize">{rfi.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{new Date(rfi.submittedDate).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{rfi.submittedBy}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rfi.dueDate ? new Date(rfi.dueDate).toLocaleDateString() : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={isCritical ? 'destructive' : isOverdue ? 'default' : 'outline'}
                          className="font-semibold tabular-nums"
                        >
                          {daysOpen}d
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(rfi)}
                            className="hover:bg-accent/10"
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete RFI</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete RFI <strong>{rfi.number}</strong> - "{rfi.subject}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(rfi.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
    </div>
  )
}
