import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, MagnifyingGlass, Funnel, Download, Clock, CheckCircle, Warning, Pencil, FileText, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@github/spark/hooks'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface DetailingItem {
  id: string
  projectId: string
  packageNumber: string
  packageName: string
  description: string
  status: 'not-started' | 'in-progress' | 'in-review' | 'approved' | 'on-hold'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo: string
  startDate: string | null
  dueDate: string
  completedDate: string | null
  revisionNumber: number
  drawingCount: number
  pieceMarkCount: number
  percentComplete: number
  notes: string
  blockers: string[]
  createdAt: string
  updatedAt: string
}

const statusConfig = {
  'not-started': { label: 'Not Started', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'in-review': { label: 'In Review', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'approved': { label: 'Approved', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  'on-hold': { label: 'On Hold', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-500/10 text-gray-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-400' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-400' },
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-400' },
}

export function DetailingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [detailingItems, setDetailingItems] = useKV<DetailingItem[]>(`detailing-items-${projectId}`, [])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')

  const [formData, setFormData] = useState({
    packageNumber: '',
    packageName: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium' as const,
    notes: '',
  })

  const handleCreate = () => {
    if (!formData.packageNumber || !formData.packageName || !formData.dueDate) {
      toast.error('Please fill in all required fields')
      return
    }

    const newItem: DetailingItem = {
      id: `det-${Date.now()}`,
      projectId: projectId || '',
      packageNumber: formData.packageNumber,
      packageName: formData.packageName,
      description: formData.description,
      status: 'not-started',
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      startDate: null,
      dueDate: formData.dueDate,
      completedDate: null,
      revisionNumber: 0,
      drawingCount: 0,
      pieceMarkCount: 0,
      percentComplete: 0,
      notes: formData.notes,
      blockers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setDetailingItems((current) => [...current, newItem])
    setIsCreateDialogOpen(false)
    setFormData({
      packageNumber: '',
      packageName: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium',
      notes: '',
    })
    toast.success('Detailing package created successfully')
  }

  const handleStatusChange = (itemId: string, newStatus: DetailingItem['status']) => {
    setDetailingItems((current) =>
      current.map((item) => {
        if (item.id === itemId) {
          const updates: Partial<DetailingItem> = {
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }
          if (newStatus === 'in-progress' && !item.startDate) {
            updates.startDate = new Date().toISOString()
          }
          if (newStatus === 'approved' && !item.completedDate) {
            updates.completedDate = new Date().toISOString()
            updates.percentComplete = 100
          }
          return { ...item, ...updates }
        }
        return item
      })
    )
    toast.success('Status updated successfully')
  }

  const filteredItems = detailingItems.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.packageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && ['in-progress', 'in-review'].includes(item.status)) ||
      (activeTab === 'pending' && item.status === 'not-started') ||
      (activeTab === 'completed' && item.status === 'approved') ||
      (activeTab === 'blocked' && item.status === 'on-hold')

    return matchesSearch && matchesStatus && matchesPriority && matchesTab
  })

  const stats = {
    total: detailingItems.length,
    active: detailingItems.filter((i) => ['in-progress', 'in-review'].includes(i.status)).length,
    pending: detailingItems.filter((i) => i.status === 'not-started').length,
    completed: detailingItems.filter((i) => i.status === 'approved').length,
    blocked: detailingItems.filter((i) => i.status === 'on-hold').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detailing</h1>
          <p className="text-muted-foreground mt-1">
            Manage shop drawings, piece marks, and fabrication details
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} weight="bold" />
              New Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Detailing Package</DialogTitle>
              <DialogDescription>
                Add a new detailing package to track shop drawing production
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageNumber">
                    Package Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="packageNumber"
                    placeholder="e.g., DET-001"
                    value={formData.packageNumber}
                    onChange={(e) => setFormData({ ...formData, packageNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageName">
                  Package Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="packageName"
                  placeholder="e.g., Column Details - Grid A-D"
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the scope of this detailing package..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    placeholder="Detailer name"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="priority">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Package</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Packages</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <FileText size={32} weight="duotone" className="text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-1 text-blue-400">{stats.active}</p>
            </div>
            <Pencil size={32} weight="duotone" className="text-blue-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Start</p>
              <p className="text-2xl font-bold mt-1 text-gray-400">{stats.pending}</p>
            </div>
            <Clock size={32} weight="duotone" className="text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold mt-1 text-green-400">{stats.completed}</p>
            </div>
            <CheckCircle size={32} weight="duotone" className="text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Blocked</p>
              <p className="text-2xl font-bold mt-1 text-red-400">{stats.blocked}</p>
            </div>
            <Warning size={32} weight="duotone" className="text-red-400" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="blocked">Blocked</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Funnel size={16} className="mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <Funnel size={16} className="mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={64} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No detailing packages found</h3>
                <p className="text-muted-foreground mb-6">
                  {detailingItems.length === 0
                    ? 'Get started by creating your first detailing package'
                    : 'Try adjusting your filters to see more results'}
                </p>
                {detailingItems.length === 0 && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus size={18} weight="bold" />
                    Create First Package
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{item.packageNumber}</h3>
                              <Badge className={statusConfig[item.status].color} variant="outline">
                                {statusConfig[item.status].label}
                              </Badge>
                              <Badge className={priorityConfig[item.priority].color} variant="outline">
                                {priorityConfig[item.priority].label}
                              </Badge>
                            </div>
                            <p className="text-foreground/90 font-medium mb-1">{item.packageName}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(item.dueDate), 'MMM d, yyyy')}
                            </p>
                            {item.assignedTo && (
                              <p className="text-sm text-muted-foreground">Assigned: {item.assignedTo}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <ArrowsClockwise size={16} className="text-muted-foreground" />
                            <span className="text-muted-foreground">Rev {item.revisionNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-muted-foreground" />
                            <span className="text-muted-foreground">{item.drawingCount} drawings</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{item.pieceMarkCount} piece marks</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{item.percentComplete}% complete</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={item.status}
                            onValueChange={(value: any) => handleStatusChange(item.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not-started">Not Started</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="in-review">In Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="on-hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download size={16} />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
