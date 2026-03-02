import { useState } from 'react'
import {
  Plus,
  Wrench,
  Warning,
  CheckCircle,
  Truck,
  Calendar,
  MapPin,
  FileText,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { Equipment, EquipmentLog, Project } from '@/lib/types'

export function GlobalEquipmentPage() {
  const [equipment, setEquipment] = useKV<Equipment[]>('global-equipment', [])
  const [equipmentLogs, setEquipmentLogs] = useKV<EquipmentLog[]>('equipment-logs', [])
  const [projects] = useKV<Project[]>('projects', [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)

  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: '',
    type: 'crane',
    status: 'available',
    model: '',
    serialNumber: '',
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

  const handleCreateEquipment = () => {
    if (!formData.name || !formData.type) {
      toast.error('Please fill in required fields')
      return
    }

    const newEquipment: Equipment = {
      id: crypto.randomUUID(),
      name: formData.name,
      type: formData.type!,
      status: formData.status!,
      model: formData.model,
      serialNumber: formData.serialNumber,
      location: formData.location,
      createdAt: new Date().toISOString(),
    }

    setEquipment(current => [...(current || []), newEquipment])
    setIsCreateOpen(false)
    setFormData({
      name: '',
      type: 'crane',
      status: 'available',
      model: '',
      serialNumber: '',
      location: '',
    })
    toast.success('Equipment created successfully')
  }

  const handleCreateLog = () => {
    if (!selectedEquipment || !logForm.description) {
      toast.error('Please fill in required fields')
      return
    }

    const newLog: EquipmentLog = {
      id: crypto.randomUUID(),
      equipmentId: selectedEquipment.id,
      projectId: selectedEquipment.assignedProjectId,
      date: logForm.date,
      type: logForm.type,
      hours: logForm.hours ? parseFloat(logForm.hours) : undefined,
      description: logForm.description,
      cost: logForm.cost ? parseFloat(logForm.cost) : undefined,
      performedBy: logForm.performedBy || 'Current User',
      createdAt: new Date().toISOString(),
    }

    setEquipmentLogs(current => [...(current || []), newLog])

    if (logForm.type === 'maintenance') {
      setEquipment(current =>
        (current || []).map(e =>
          e.id === selectedEquipment.id
            ? { ...e, lastMaintenanceDate: logForm.date }
            : e
        )
      )
    }

    setIsLogOpen(false)
    setSelectedEquipment(null)
    setLogForm({
      type: 'usage',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      cost: '',
      performedBy: '',
    })
    toast.success('Log entry created successfully')
  }

  const handleAssignProject = (equipmentId: string, projectId: string | null) => {
    setEquipment(current =>
      (current || []).map(e =>
        e.id === equipmentId
          ? {
              ...e,
              assignedProjectId: projectId || undefined,
              status: projectId ? 'in-use' : 'available',
            }
          : e
      )
    )
    toast.success(projectId ? 'Equipment assigned to project' : 'Equipment unassigned')
  }

  const getStatusBadge = (status: Equipment['status']) => {
    const config = {
      available: { variant: 'default' as const, icon: <CheckCircle size={14} /> },
      'in-use': { variant: 'secondary' as const, icon: <Truck size={14} /> },
      maintenance: { variant: 'outline' as const, icon: <Wrench size={14} /> },
      retired: { variant: 'destructive' as const, icon: <Warning size={14} /> },
    }
    return config[status]
  }

  const needsMaintenance = (eq: Equipment) => {
    if (!eq.nextMaintenanceDate) return false
    return new Date(eq.nextMaintenanceDate) <= new Date()
  }

  const availableCount = equipment?.filter(e => e.status === 'available').length || 0
  const inUseCount = equipment?.filter(e => e.status === 'in-use').length || 0
  const maintenanceCount = equipment?.filter(e => e.status === 'maintenance').length || 0
  const needsMaintenanceCount = equipment?.filter(needsMaintenance).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipment Management</h2>
          <p className="text-muted-foreground">Manage and track equipment across all projects</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
              <DialogDescription>Create a new equipment entry</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="eq-name">Equipment Name *</Label>
                <Input
                  id="eq-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Crane 150T"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="eq-type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value: Equipment['type']) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="eq-type">
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
                <div className="grid gap-2">
                  <Label htmlFor="eq-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: Equipment['status']) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="eq-status">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="eq-model">Model</Label>
                  <Input
                    id="eq-model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Model number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eq-serial">Serial Number</Label>
                  <Input
                    id="eq-serial"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Serial #"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eq-location">Location</Label>
                <Input
                  id="eq-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Storage location"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEquipment}>Create Equipment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle size={20} className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{availableCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Truck size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseCount}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground">
              Under maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Maintenance</CardTitle>
            <Warning size={20} className={needsMaintenanceCount > 0 ? 'text-destructive' : 'text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${needsMaintenanceCount > 0 ? 'text-destructive' : ''}`}>
              {needsMaintenanceCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Overdue maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Equipment</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="in-use">In Use</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>Complete equipment list</CardDescription>
            </CardHeader>
            <CardContent>
              {!equipment || equipment.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No equipment</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add equipment to start tracking
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Equipment
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assigned Project</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((eq) => {
                      const statusBadge = getStatusBadge(eq.status)
                      const assignedProject = eq.assignedProjectId 
                        ? projects?.find(p => p.id === eq.assignedProjectId)
                        : null
                      return (
                        <TableRow key={eq.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{eq.name}</div>
                              {eq.serialNumber && (
                                <div className="text-xs text-muted-foreground">SN: {eq.serialNumber}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{eq.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={statusBadge.variant}>
                                <span className="mr-1">{statusBadge.icon}</span>
                                {eq.status}
                              </Badge>
                              {needsMaintenance(eq) && (
                                <Warning size={16} className="text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {eq.location ? (
                              <span className="flex items-center gap-1 text-sm">
                                <MapPin size={14} />
                                {eq.location}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignedProject ? (
                              <Badge variant="secondary">{assignedProject.name}</Badge>
                            ) : (
                              <Select
                                onValueChange={(value) => handleAssignProject(eq.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="Assign" />
                                </SelectTrigger>
                                <SelectContent>
                                  {projects?.filter(p => p.status === 'active').map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {eq.lastMaintenanceDate ? (
                              <span className="text-sm flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(eq.lastMaintenanceDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEquipment(eq)
                                  setIsLogOpen(true)
                                }}
                              >
                                <FileText size={14} className="mr-1" />
                                Log
                              </Button>
                              {eq.assignedProjectId && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAssignProject(eq.id, null)}
                                >
                                  Unassign
                                </Button>
                              )}
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

        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Equipment</CardTitle>
              <CardDescription>Equipment ready for assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {equipment?.filter(e => e.status === 'available').length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No available equipment
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {equipment?.filter(e => e.status === 'available').map(eq => (
                    <Card key={eq.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{eq.name}</CardTitle>
                          <Badge variant="outline">{eq.type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {eq.model && <div>Model: {eq.model}</div>}
                          {eq.location && (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              {eq.location}
                            </div>
                          )}
                          <Select
                            onValueChange={(value) => handleAssignProject(eq.id, value)}
                          >
                            <SelectTrigger className="w-full mt-2">
                              <SelectValue placeholder="Assign to project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects?.filter(p => p.status === 'active').map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-use" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment In Use</CardTitle>
              <CardDescription>Currently assigned equipment</CardDescription>
            </CardHeader>
            <CardContent>
              {equipment?.filter(e => e.status === 'in-use').length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No equipment currently in use
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment?.filter(e => e.status === 'in-use').map(eq => {
                      const project = projects?.find(p => p.id === eq.assignedProjectId)
                      return (
                        <TableRow key={eq.id}>
                          <TableCell className="font-medium">{eq.name}</TableCell>
                          <TableCell><Badge variant="outline">{eq.type}</Badge></TableCell>
                          <TableCell>
                            {project ? <Badge variant="secondary">{project.name}</Badge> : '-'}
                          </TableCell>
                          <TableCell>{eq.location || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignProject(eq.id, null)}
                            >
                              Return
                            </Button>
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

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Logs</CardTitle>
              <CardDescription>Usage and maintenance history</CardDescription>
            </CardHeader>
            <CardContent>
              {!equipmentLogs || equipmentLogs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No logs recorded
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentLogs
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(log => {
                        const eq = equipment?.find(e => e.id === log.equipmentId)
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {new Date(log.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">{eq?.name || 'Unknown'}</TableCell>
                            <TableCell><Badge variant="outline">{log.type}</Badge></TableCell>
                            <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                            <TableCell>{log.hours ? `${log.hours}h` : '-'}</TableCell>
                            <TableCell>
                              {log.cost ? `$${log.cost.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.performedBy}
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
      </Tabs>

      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Equipment Log</DialogTitle>
            <DialogDescription>
              Record usage, maintenance, or inspection for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="log-type">Type *</Label>
                <Select value={logForm.type} onValueChange={(value: EquipmentLog['type']) => setLogForm({ ...logForm, type: value })}>
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
              <div className="grid gap-2">
                <Label htmlFor="log-date">Date *</Label>
                <Input
                  id="log-date"
                  type="date"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="log-description">Description *</Label>
              <Textarea
                id="log-description"
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                placeholder="What was done?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="log-hours">Hours</Label>
                <Input
                  id="log-hours"
                  type="number"
                  step="0.1"
                  value={logForm.hours}
                  onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="log-cost">Cost</Label>
                <Input
                  id="log-cost"
                  type="number"
                  step="0.01"
                  value={logForm.cost}
                  onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="log-by">Performed By</Label>
              <Input
                id="log-by"
                value={logForm.performedBy}
                onChange={(e) => setLogForm({ ...logForm, performedBy: e.target.value })}
                placeholder="Name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLog}>Create Log</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
