import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Stack,
  FileText,
  Bell,
  Upload,
  Check,
  X,
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrawingSets, useNotifications } from '@/hooks/use-drawings'
import { toast } from 'sonner'
import type { DrawingSet, DrawingSheet } from '@/types/electron'

const STATUS_SEQUENCE: Array<DrawingSet['status']> = ['IFA', 'BFA', 'OFS', 'BFS', 'FFF'];

const STATUS_LABELS = {
  'IFA': 'Issued for Approval',
  'BFA': 'Back from Approval',
  'OFS': 'Out for Signature',
  'BFS': 'Back from Signature',
  'FFF': 'Fully Approved for Fabrication',
};

const STATUS_COLORS: Record<DrawingSet['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'IFA': 'outline',
  'BFA': 'secondary',
  'OFS': 'default',
  'BFS': 'secondary',
  'FFF': 'default',
};

export function DrawingsDBPage() {
  const { projectId } = useParams()
  const { drawingSets, loading, createDrawingSet, updateDrawingSetStatus, deleteDrawingSet } = useDrawingSets(projectId)
  const { notifications, markAsRead } = useNotifications(projectId)
  
  const [isCreateSetOpen, setIsCreateSetOpen] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [selectedSet, setSelectedSet] = useState<DrawingSet | null>(null)

  const [setFormData, setSetFormData] = useState({
    name: '',
    status: 'IFA' as DrawingSet['status'],
    discipline: '',
    set_number: '',
  })

  const [sheetFormData, setSheetFormData] = useState({
    sheet_no: '',
    title: '',
    status: 'IFA' as DrawingSheet['status'],
  })

  const handleCreateSet = async () => {
    if (!setFormData.name) {
      toast.error('Please enter a set name')
      return
    }

    const result = await createDrawingSet(setFormData)
    if (result.success) {
      setIsCreateSetOpen(false)
      setSetFormData({
        name: '',
        status: 'IFA',
        discipline: '',
        set_number: '',
      })
      toast.success('Drawing set created successfully')
    } else {
      toast.error(result.error || 'Failed to create drawing set')
    }
  }

  const handleAddSheet = async () => {
    if (!selectedSet || !sheetFormData.sheet_no || !sheetFormData.title) {
      toast.error('Please fill in required fields')
      return
    }

    if (!window.SBP?.db) {
      toast.error('Database not available')
      return
    }

    const result = await window.SBP.db.createDrawingSheet({
      set_id: selectedSet.id,
      ...sheetFormData,
    })

    if (result.success) {
      setIsAddSheetOpen(false)
      setSelectedSet(null)
      setSheetFormData({
        sheet_no: '',
        title: '',
        status: 'IFA',
      })
      toast.success('Sheet added successfully')
    } else {
      toast.error(result.error || 'Failed to add sheet')
    }
  }

  const handleStatusChange = async (setId: string, currentStatus: DrawingSet['status']) => {
    const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)
    if (currentIndex === -1 || currentIndex === STATUS_SEQUENCE.length - 1) {
      toast.error('Cannot transition status')
      return
    }

    const nextStatus = STATUS_SEQUENCE[currentIndex + 1]
    const result = await updateDrawingSetStatus(setId, nextStatus)
    
    if (result.success) {
      toast.success(`Status updated to ${STATUS_LABELS[nextStatus]}`)
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  const handleDeleteSet = async (setId: string) => {
    if (!confirm('Are you sure you want to delete this drawing set?')) {
      return
    }

    const result = await deleteDrawingSet(setId)
    if (result.success) {
      toast.success('Drawing set deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete drawing set')
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read_at)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading drawings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drawings</h2>
          <p className="text-muted-foreground">Drawing sets with gated status workflow (IFA → BFA → OFS → BFS → FFF)</p>
        </div>
        <Dialog open={isCreateSetOpen} onOpenChange={setIsCreateSetOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Drawing Set
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Drawing Set</DialogTitle>
              <DialogDescription>Add a new drawing set to the project</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="set-name">Set Name *</Label>
                <Input
                  id="set-name"
                  value={setFormData.name}
                  onChange={(e) => setSetFormData({ ...setFormData, name: e.target.value })}
                  placeholder="e.g., Steel Framing Package A"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="set-number">Set Number</Label>
                <Input
                  id="set-number"
                  value={setFormData.set_number}
                  onChange={(e) => setSetFormData({ ...setFormData, set_number: e.target.value })}
                  placeholder="e.g., S-100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discipline">Discipline</Label>
                <Input
                  id="discipline"
                  value={setFormData.discipline}
                  onChange={(e) => setSetFormData({ ...setFormData, discipline: e.target.value })}
                  placeholder="e.g., Structural, Shop"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select 
                  value={setFormData.status} 
                  onValueChange={(value: DrawingSet['status']) => setSetFormData({ ...setFormData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_SEQUENCE.map(status => (
                      <SelectItem key={status} value={status}>
                        {status} - {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateSetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSet}>Create Set</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drawing Sets</CardTitle>
            <Stack size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drawingSets.length}</div>
            <p className="text-xs text-muted-foreground">
              Total sets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved (FFF)</CardTitle>
            <Check size={20} className="text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {drawingSets.filter(s => s.status === 'FFF').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for fabrication
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drawingSets.filter(s => s.status !== 'FFF').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell size={20} className={unreadNotifications.length > 0 ? 'text-primary' : 'text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unreadNotifications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unread updates
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sets">Drawing Sets</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadNotifications.length > 0 && (
              <Badge variant="default" className="ml-2 h-5 px-1.5 text-xs">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drawing Sets</CardTitle>
              <CardDescription>All drawing sets with gated status transitions</CardDescription>
            </CardHeader>
            <CardContent>
              {drawingSets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Stack size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No drawing sets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first drawing set to get started
                  </p>
                  <Button onClick={() => setIsCreateSetOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Create Drawing Set
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Set Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Discipline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawingSets.map((set) => {
                      const currentIndex = STATUS_SEQUENCE.indexOf(set.status)
                      const canAdvance = currentIndex !== -1 && currentIndex < STATUS_SEQUENCE.length - 1

                      return (
                        <TableRow key={set.id}>
                          <TableCell className="font-mono">{set.set_number || '-'}</TableCell>
                          <TableCell className="font-medium">{set.name}</TableCell>
                          <TableCell>{set.discipline || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={STATUS_COLORS[set.status]}>
                                {set.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {STATUS_LABELS[set.status]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(set.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {canAdvance && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(set.id, set.status)}
                                >
                                  → {STATUS_SEQUENCE[currentIndex + 1]}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSet(set)
                                  setIsAddSheetOpen(true)
                                }}
                              >
                                <Upload size={14} className="mr-1" />
                                Add Sheet
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSet(set.id)}
                              >
                                <X size={14} />
                              </Button>
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
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Feed</CardTitle>
              <CardDescription>Status change notifications for drawing sets and sheets</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Notifications will appear here when drawing statuses change
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        notification.read_at ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                      }`}
                    >
                      <Bell size={20} className={notification.read_at ? 'text-muted-foreground' : 'text-primary'} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Drawing Sheet</DialogTitle>
            <DialogDescription>
              Add a new sheet to {selectedSet?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sheet-no">Sheet Number *</Label>
              <Input
                id="sheet-no"
                value={sheetFormData.sheet_no}
                onChange={(e) => setSheetFormData({ ...sheetFormData, sheet_no: e.target.value })}
                placeholder="e.g., S-101"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sheet-title">Title *</Label>
              <Input
                id="sheet-title"
                value={sheetFormData.title}
                onChange={(e) => setSheetFormData({ ...sheetFormData, title: e.target.value })}
                placeholder="Sheet title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sheet-status">Initial Status</Label>
              <Select 
                value={sheetFormData.status} 
                onValueChange={(value: DrawingSheet['status']) => setSheetFormData({ ...sheetFormData, status: value })}
              >
                <SelectTrigger id="sheet-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_SEQUENCE.map(status => (
                    <SelectItem key={status} value={status}>
                      {status} - {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSheet}>Add Sheet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
