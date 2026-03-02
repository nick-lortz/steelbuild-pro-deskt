import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Wrench, CheckCircle, Warning, Gear, PencilSimple, Trash } from '@phosphor-icons/react'
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
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { Equipment, EquipmentLog } from '@/lib/types'

export function EquipmentPage() {
  const { projectId } = useParams()
  const [equipment, setEquipment] = useKV<Equipment[]>('equipment', [])
  const [equipmentLogs, setEquipmentLogs] = useKV<EquipmentLog[]>(`equipment-logs-${projectId}`, [])
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as Equipment['type'],
    model: '',
    serialNumber: '',
    status: 'available' as Equipment['status'],
    location: '',
  })

  const [logForm, setLogForm] = useState({
    type: 'usage' as EquipmentLog['type'],
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    cost: '',
    performedBy: '',
  })

  const projectEquipment = equipment?.filter(e => e.assignedProjectId === projectId) || []
  const availableCount = projectEquipment.filter(e => e.status === 'available').length
  const inUseCount = projectEquipment.filter(e => e.status === 'in-use').length
  const maintenanceCount = projectEquipment.filter(e => e.status === 'maintenance').length

  const handleCreate = () => {
    if (!formData.name || !formData.type) {
      toast.error('Please fill in required fields')
      return
    }

    const newEquipment: Equipment = {
      id: crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      model: formData.model || undefined,
      serialNumber: formData.serialNumber || undefined,
      status: 'available',
      location: formData.location || undefined,
      assignedProjectId: projectId,
      createdAt: new Date().toISOString(),
    }

    setEquipment(current => [...(current || []), newEquipment])
    setIsCreateOpen(false)
    setFormData({
      name: '',
      type: 'other',
      model: '',
      serialNumber: '',
      status: 'available',
      location: '',
    })
    toast.success('Equipment added')
  }

  const handleEdit = (equip: Equipment) => {
    setEditingEquipment(equip)
    setFormData({
      name: equip.name,
      type: equip.type,
      model: equip.model || '',
      serialNumber: equip.serialNumber || '',
      status: equip.status,
      location: equip.location || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!formData.name || !formData.type || !editingEquipment) {
      toast.error('Please fill in required fields')
      return
    }

    setEquipment(current =>
      (current || []).map(equip =>
        equip.id === editingEquipment.id
          ? {
              ...equip,
              name: formData.name,
              type: formData.type,
              model: formData.model || undefined,
              serialNumber: formData.serialNumber || undefined,
              status: formData.status,
              location: formData.location || undefined,
            }
          : equip
      )
    )
    setIsEditOpen(false)
    setEditingEquipment(null)
    setFormData({
      name: '',
      type: 'other',
      model: '',
      serialNumber: '',
      status: 'available',
      location: '',
    })
    toast.success('Equipment updated')
  }

  const handleDelete = (equipId: string) => {
    setEquipment(current => (current || []).map(e => 
      e.id === equipId ? { ...e, assignedProjectId: undefined } : e
    ))
    toast.success('Equipment removed from project')
  }

  const handleCreateLog = () => {
    if (!selectedEquipmentId || !logForm.description) {
      toast.error('Please fill in required fields')
      return
    }

    const newLog: EquipmentLog = {
      id: crypto.randomUUID(),
      equipmentId: selectedEquipmentId,
      projectId,
      date: logForm.date,
      type: logForm.type,
      hours: logForm.hours ? parseFloat(logForm.hours) : undefined,
      description: logForm.description,
      cost: logForm.cost ? parseFloat(logForm.cost) : undefined,
      performedBy: logForm.performedBy,
      createdAt: new Date().toISOString(),
    }

    setEquipmentLogs(current => [...(current || []), newLog])
    setIsLogOpen(false)
    setSelectedEquipmentId('')
    setLogForm({
      type: 'usage',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      cost: '',
      performedBy: '',
    })
    toast.success('Equipment log created')
  }

  const getStatusBadge = (status: Equipment['status']) => {
    const variants: Record<Equipment['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: JSX.Element }> = {
      available: { variant: 'default', icon: <CheckCircle className="mr-1" size={14} /> },
      'in-use': { variant: 'secondary', icon: <Gear className="mr-1" size={14} /> },
      maintenance: { variant: 'outline', icon: <Warning className="mr-1" size={14} /> },
      retired: { variant: 'destructive', icon: <Wrench className="mr-1" size={14} /> },
    }
    const config = variants[status]
    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const getEquipmentName = (equipId: string) => {
    return equipment?.find(e => e.id === equipId)?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipment</h2>
          <p className="text-muted-foreground">Manage project equipment and track usage</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Wrench className="mr-2" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Equipment Activity</DialogTitle>
                <DialogDescription>Record usage, maintenance, or inspection</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="log-equip">Equipment</Label>
                  <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                    <SelectTrigger id="log-equip">
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectEquipment.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="log-type">Activity Type</Label>
                  <Select value={logForm.type} onValueChange={v => setLogForm(prev => ({ ...prev, type: v as EquipmentLog['type'] }))}>
                    <SelectTrigger id="log-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usage">Usage</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="log-date">Date</Label>
                  <Input
                    id="log-date"
                    type="date"
                    value={logForm.date}
                    onChange={e => setLogForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="log-hours">Hours (Optional)</Label>
                  <Input
                    id="log-hours"
                    type="number"
                    step="0.5"
                    value={logForm.hours}
                    onChange={e => setLogForm(prev => ({ ...prev, hours: e.target.value }))}
                    placeholder="8.0"
                  />
                </div>
                <div>
                  <Label htmlFor="log-desc">Description</Label>
                  <Textarea
                    id="log-desc"
                    value={logForm.description}
                    onChange={e => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Activity details..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="log-cost">Cost (Optional)</Label>
                    <Input
                      id="log-cost"
                      type="number"
                      step="0.01"
                      value={logForm.cost}
                      onChange={e => setLogForm(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="log-by">Performed By</Label>
                    <Input
                      id="log-by"
                      value={logForm.performedBy}
                      onChange={e => setLogForm(prev => ({ ...prev, performedBy: e.target.value }))}
                      placeholder="Name"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateLog} className="w-full">Create Log</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Equipment</DialogTitle>
                <DialogDescription>Add equipment to this project</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Equipment Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Tower Crane #3"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={v => setFormData(prev => ({ ...prev, type: v as Equipment['type'] }))}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crane">Crane</SelectItem>
                      <SelectItem value="welder">Welder</SelectItem>
                      <SelectItem value="lift">Lift</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Model (Optional)</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Model #"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serial">Serial # (Optional)</Label>
                    <Input
                      id="serial"
                      value={formData.serialNumber}
                      onChange={e => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="S/N"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Current location"
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">Add Equipment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Gear className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectEquipment.length}</div>
            <p className="text-xs text-muted-foreground">On this project</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Gear className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseCount}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Warning className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Equipment</CardTitle>
          <CardDescription>Equipment assigned to this project</CardDescription>
        </CardHeader>
        <CardContent>
          {projectEquipment.length === 0 ? (
            <div className="text-center py-12">
              <Gear className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No equipment assigned</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2" />
                Add First Equipment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectEquipment.map(equip => (
                  <TableRow key={equip.id}>
                    <TableCell className="font-medium">{equip.name}</TableCell>
                    <TableCell className="capitalize">{equip.type}</TableCell>
                    <TableCell>{equip.model || '-'}</TableCell>
                    <TableCell>{equip.serialNumber || '-'}</TableCell>
                    <TableCell>{getStatusBadge(equip.status)}</TableCell>
                    <TableCell>{equip.location || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(equip)}>
                          <PencilSimple />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Equipment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove this equipment from the project? It will remain in the global equipment list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(equip.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {equipmentLogs && equipmentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Recent equipment activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentLogs.slice(-10).reverse().map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{getEquipmentName(log.equipmentId)}</TableCell>
                    <TableCell className="capitalize">{log.type}</TableCell>
                    <TableCell>{log.hours ? `${log.hours}h` : '-'}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>{log.performedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update equipment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Equipment Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData(prev => ({ ...prev, type: v as Equipment['type'] }))}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crane">Crane</SelectItem>
                  <SelectItem value="welder">Welder</SelectItem>
                  <SelectItem value="lift">Lift</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v as Equipment['status'] }))}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-serial">Serial #</Label>
                <Input
                  id="edit-serial"
                  value={formData.serialNumber}
                  onChange={e => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">Update Equipment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
