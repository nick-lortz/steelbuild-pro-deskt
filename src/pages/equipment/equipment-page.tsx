import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
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
import { toast } from 'sonner'
import { equipmentDb } from '@/lib/db'
import type { Equipment } from '@/lib/types'

function EquipmentError({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Warning size={64} className="text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  )
}

function EquipmentPageContent() {
  const { projectId } = useParams()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'crane',
    asset_tag: '',
    status: 'available',
    assigned_to: '',
    notes: '',
  })

  const loadEquipment = async () => {
    setLoading(true)
    try {
      const allEquipment = await equipmentDb.getAll()
      
      if (!Array.isArray(allEquipment)) {
        console.warn('Equipment data is not an array, resetting to empty array')
        setEquipment([])
        return
      }
      
      const validEquipment = allEquipment.filter(item => {
        if (!item || typeof item !== 'object') return false
        if (!item.id || !item.name) return false
        return true
      })
      
      if (validEquipment.length < allEquipment.length) {
        console.warn(`Filtered out ${allEquipment.length - validEquipment.length} invalid equipment records`)
      }
      
      setEquipment(validEquipment)
    } catch (error) {
      console.error('Failed to load equipment:', error)
      toast.error('Failed to load equipment')
      setEquipment([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEquipment()
  }, [])

  const projectEquipment = equipment || []
  const availableCount = projectEquipment.filter(e => e.status === 'available').length
  const inUseCount = projectEquipment.filter(e => e.status === 'in-use').length
  const maintenanceCount = projectEquipment.filter(e => e.status === 'maintenance').length

  const handleCreate = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      await equipmentDb.create({
        name: formData.name,
        type: formData.type,
        assetTag: formData.asset_tag || undefined,
        status: 'available',
        assignedTo: formData.assigned_to || undefined,
        notes: formData.notes || undefined,
      })

      await loadEquipment()
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'equipment', action: 'create' } }))
      setIsCreateOpen(false)
      setFormData({
        name: '',
        type: 'crane',
        asset_tag: '',
        status: 'available',
        assigned_to: '',
        notes: '',
      })
      toast.success('Equipment added')
    } catch (error: any) {
      console.error('Failed to add equipment:', error)
      toast.error(error.message || 'Failed to add equipment')
    }
  }

  const handleEdit = (equip: Equipment) => {
    setEditingEquipment(equip)
    setFormData({
      name: equip.name,
      type: equip.type,
      asset_tag: equip.asset_tag || '',
      status: equip.status,
      assigned_to: equip.assigned_to || '',
      notes: equip.notes || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!formData.name || !formData.type || !editingEquipment) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      await equipmentDb.update(editingEquipment.id, {
        name: formData.name,
        type: formData.type,
        assetTag: formData.asset_tag || undefined,
        status: formData.status,
        assignedTo: formData.assigned_to || undefined,
        notes: formData.notes || undefined,
      })

      await loadEquipment()
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'equipment', action: 'update' } }))
      setIsEditOpen(false)
      setEditingEquipment(null)
      setFormData({
        name: '',
        type: 'crane',
        asset_tag: '',
        status: 'available',
        assigned_to: '',
        notes: '',
      })
      toast.success('Equipment updated')
    } catch (error: any) {
      console.error('Failed to update equipment:', error)
      toast.error(error.message || 'Failed to update equipment')
    }
  }

  const handleDelete = async (equipmentId: string) => {
    try {
      await equipmentDb.delete(equipmentId)
      await loadEquipment()
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'equipment', action: 'delete' } }))
      toast.success('Equipment deleted')
    } catch (error: any) {
      console.error('Failed to delete equipment:', error)
      toast.error(error.message || 'Failed to delete equipment')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: JSX.Element }> = {
      available: { variant: 'default', icon: <CheckCircle className="mr-1" size={14} /> },
      'in-use': { variant: 'secondary', icon: <Gear className="mr-1" size={14} /> },
      maintenance: { variant: 'outline', icon: <Warning className="mr-1" size={14} /> },
      retired: { variant: 'destructive', icon: <Wrench className="mr-1" size={14} /> },
    }
    const config = variants[status] || variants.available
    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Gear size={48} className="mx-auto text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading equipment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Warning size={64} className="text-destructive" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Failed to load equipment</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-zinc-50">
      <div className="space-y-6 p-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Equipment</h2>
            <p className="text-muted-foreground">Manage project equipment and track usage</p>
          </div>
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
                <Select value={formData.type} onValueChange={v => setFormData(prev => ({ ...prev, type: v }))}>
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
              <div>
                <Label htmlFor="asset-tag">Asset Tag (Optional)</Label>
                <Input
                  id="asset-tag"
                  value={formData.asset_tag}
                  onChange={e => setFormData(prev => ({ ...prev, asset_tag: e.target.value }))}
                  placeholder="Asset tag or ID"
                />
              </div>
              <div>
                <Label htmlFor="assigned-to">Assigned To (Optional)</Label>
                <Input
                  id="assigned-to"
                  value={formData.assigned_to}
                  onChange={e => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  placeholder="Person or team"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional information"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Add Equipment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gear className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectEquipment.length}</div>
            <p className="text-xs text-muted-foreground">On this project</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <CheckCircle className="text-accent" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gear className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseCount}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <Warning className="text-warning" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-muted/10">
          <CardTitle className="text-lg">Project Equipment</CardTitle>
          <CardDescription>Equipment assigned to this project</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {projectEquipment.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                <Gear className="text-muted-foreground" size={32} weight="duotone" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No equipment assigned</h3>
              <p className="text-muted-foreground text-sm mb-6">Add equipment to start tracking usage and availability</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2" size={16} />
                Add First Equipment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectEquipment.map(equip => (
                  <TableRow key={equip.id}>
                    <TableCell className="font-semibold text-foreground">{equip.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize font-medium">
                        {equip.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {equip.asset_tag ? (
                        <span className="font-mono text-sm">{equip.asset_tag}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(equip.status)}</TableCell>
                    <TableCell>
                      {equip.assigned_to ? (
                        <span className="text-sm font-medium">{equip.assigned_to}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(equip)}
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
                              <AlertDialogTitle>Remove Equipment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{equip.name}</strong> from the project? This action cannot be undone.
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
              <Select value={formData.type} onValueChange={v => setFormData(prev => ({ ...prev, type: v }))}>
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
              <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
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
            <div>
              <Label htmlFor="edit-asset-tag">Asset Tag</Label>
              <Input
                id="edit-asset-tag"
                value={formData.asset_tag}
                onChange={e => setFormData(prev => ({ ...prev, asset_tag: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-assigned-to">Assigned To</Label>
              <Input
                id="edit-assigned-to"
                value={formData.assigned_to}
                onChange={e => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">Update Equipment</Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

export function EquipmentPage() {
  return (
    <ErrorBoundary FallbackComponent={EquipmentError}>
      <EquipmentPageContent />
    </ErrorBoundary>
  )
}
