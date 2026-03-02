import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { 
  Package, 
  Hammer, 
  CheckCircle, 
  Clock, 
  Warning,
  X,
  Plus,
  Filter,
  Download,
  Truck,
  FileText,
  CircleDashed,
  ArrowRight,
  ListChecks
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { FabItem, FabWorkPackage, FabDelivery, DetailingDependency, FabBlocker } from '@/lib/types-fab'
import type { WorkPackage, Delivery } from '@/lib/types'

export function FabTrackingComprehensivePage() {
  const { projectId } = useParams<{ projectId: string }>()
  
  const [fabItems, setFabItems] = useKV<FabItem[]>(`fab-items-${projectId}`, [])
  const [fabPackages, setFabPackages] = useKV<FabWorkPackage[]>(`fab-packages-${projectId}`, [])
  const [workPackages] = useKV<WorkPackage[]>(`work-packages-${projectId}`, [])
  const [deliveries] = useKV<Delivery[]>(`deliveries-${projectId}`, [])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'items' | 'packages' | 'schedule'>('items')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FabItem | null>(null)
  
  const [newItem, setNewItem] = useState({
    pieceNumber: '',
    pieceMark: '',
    description: '',
    drawingNumber: '',
    material: '',
    materialGrade: 'A992',
    weight: 0,
    quantity: 1,
    workPackageId: '',
    deliveryId: '',
  })

  const filteredItems = useMemo(() => {
    return fabItems.filter(item => {
      const matchesSearch = 
        item.pieceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pieceMark.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || item.fabricationStatus === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [fabItems, searchTerm, statusFilter])

  const metrics = useMemo(() => {
    const total = fabItems.length
    const detailingComplete = fabItems.filter(i => i.detailingStatus === 'released').length
    const fabricationReady = fabItems.filter(i => i.fabricationStatus === 'ready').length
    const inProduction = fabItems.filter(i => i.fabricationStatus === 'in-production').length
    const completed = fabItems.filter(i => i.fabricationStatus === 'completed').length
    const shipped = fabItems.filter(i => i.fabricationStatus === 'shipped').length
    const blocked = fabItems.filter(i => 
      i.detailingBlockers.filter(b => b.status === 'active').length > 0 ||
      i.fabricationBlockers.filter(b => b.status === 'active').length > 0
    ).length
    
    const totalWeight = fabItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    const completedWeight = fabItems
      .filter(i => i.fabricationStatus === 'completed' || i.fabricationStatus === 'shipped')
      .reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    
    return {
      total,
      detailingComplete,
      fabricationReady,
      inProduction,
      completed,
      shipped,
      blocked,
      totalWeight,
      completedWeight,
      overallProgress: total > 0 ? Math.round((completed + shipped) / total * 100) : 0,
      weightProgress: totalWeight > 0 ? Math.round(completedWeight / totalWeight * 100) : 0,
    }
  }, [fabItems])

  const handleCreateItem = () => {
    if (!newItem.pieceNumber || !newItem.description || !newItem.material) {
      toast.error('Please fill in required fields')
      return
    }

    const item: FabItem = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      workPackageId: newItem.workPackageId || undefined,
      deliveryId: newItem.deliveryId || undefined,
      pieceNumber: newItem.pieceNumber,
      pieceMark: newItem.pieceMark,
      description: newItem.description,
      drawingNumber: newItem.drawingNumber || undefined,
      material: newItem.material,
      materialGrade: newItem.materialGrade,
      weight: newItem.weight,
      quantity: newItem.quantity,
      unitOfMeasure: 'EA',
      
      detailingStatus: 'not-started',
      detailingProgress: 0,
      detailingDependencies: [],
      detailingBlockers: [],
      
      fabricationStatus: 'not-ready',
      fabricationProgress: 0,
      fabricationBlockers: [],
      
      deliveryRequired: !!newItem.deliveryId,
      deliveryStatus: newItem.deliveryId ? 'scheduled' : undefined,
      
      qcChecks: [],
      qcStatus: 'pending',
      
      tags: [],
      priority: 'normal',
      criticality: 'non-critical',
      
      cost: 0,
      estimatedHours: 0,
      actualHours: 0,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setFabItems(current => [...current, item])
    setIsCreateDialogOpen(false)
    setNewItem({
      pieceNumber: '',
      pieceMark: '',
      description: '',
      drawingNumber: '',
      material: '',
      materialGrade: 'A992',
      weight: 0,
      quantity: 1,
      workPackageId: '',
      deliveryId: '',
    })
    toast.success('Fab item created successfully')
  }

  const updateItemStatus = (itemId: string, field: keyof FabItem, value: any) => {
    setFabItems(current => 
      current.map(item => 
        item.id === itemId 
          ? { ...item, [field]: value, updatedAt: new Date().toISOString() } 
          : item
      )
    )
    toast.success('Status updated')
  }

  const addBlocker = (itemId: string, blockerType: 'detailing' | 'fabrication', blocker: FabBlocker) => {
    setFabItems(current =>
      current.map(item => {
        if (item.id !== itemId) return item
        
        if (blockerType === 'detailing') {
          return {
            ...item,
            detailingBlockers: [...item.detailingBlockers, blocker],
            updatedAt: new Date().toISOString(),
          }
        } else {
          return {
            ...item,
            fabricationBlockers: [...item.fabricationBlockers, blocker],
            updatedAt: new Date().toISOString(),
          }
        }
      })
    )
    toast.warning('Blocker added')
  }

  const resolveBlocker = (itemId: string, blockerType: 'detailing' | 'fabrication', blockerId: string) => {
    setFabItems(current =>
      current.map(item => {
        if (item.id !== itemId) return item
        
        const updateBlockers = (blockers: FabBlocker[]) =>
          blockers.map(b =>
            b.id === blockerId
              ? { ...b, status: 'resolved' as const, resolvedDate: new Date().toISOString() }
              : b
          )
        
        if (blockerType === 'detailing') {
          return {
            ...item,
            detailingBlockers: updateBlockers(item.detailingBlockers),
            updatedAt: new Date().toISOString(),
          }
        } else {
          return {
            ...item,
            fabricationBlockers: updateBlockers(item.fabricationBlockers),
            updatedAt: new Date().toISOString(),
          }
        }
      })
    )
    toast.success('Blocker resolved')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'not-started': 'bg-gray-500',
      'in-progress': 'bg-blue-500',
      'review': 'bg-yellow-500',
      'approved': 'bg-green-500',
      'released': 'bg-green-600',
      'not-ready': 'bg-gray-500',
      'ready': 'bg-green-500',
      'material-ordered': 'bg-blue-400',
      'material-received': 'bg-blue-600',
      'in-production': 'bg-orange-500',
      'qc-hold': 'bg-red-500',
      'completed': 'bg-green-600',
      'shipped': 'bg-purple-600',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getPriorityBadge = (priority: FabItem['priority']) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    }
    return variants[priority]
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Fabrication Tracking
          </h2>
          <p className="text-muted-foreground">
            Comprehensive fab tracking tied to detailing, work packages, and deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info('Export feature coming soon')}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                New Fab Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Fab Item</DialogTitle>
                <DialogDescription>
                  Add a new fabrication item with detailing dependencies and delivery links
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="piece-number">Piece Number *</Label>
                    <Input
                      id="piece-number"
                      value={newItem.pieceNumber}
                      onChange={(e) => setNewItem({ ...newItem, pieceNumber: e.target.value })}
                      placeholder="B-101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="piece-mark">Piece Mark *</Label>
                    <Input
                      id="piece-mark"
                      value={newItem.pieceMark}
                      onChange={(e) => setNewItem({ ...newItem, pieceMark: e.target.value })}
                      placeholder="W14x90"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Column at Grid A-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="drawing-number">Drawing Number</Label>
                    <Input
                      id="drawing-number"
                      value={newItem.drawingNumber}
                      onChange={(e) => setNewItem({ ...newItem, drawingNumber: e.target.value })}
                      placeholder="S-101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work-package">Work Package</Label>
                    <Select value={newItem.workPackageId} onValueChange={(val) => setNewItem({ ...newItem, workPackageId: val })}>
                      <SelectTrigger id="work-package">
                        <SelectValue placeholder="Select work package" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {workPackages?.map(pkg => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.packageNumber} - {pkg.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material *</Label>
                    <Input
                      id="material"
                      value={newItem.material}
                      onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
                      placeholder="W14x90"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-grade">Material Grade</Label>
                    <Select value={newItem.materialGrade} onValueChange={(val) => setNewItem({ ...newItem, materialGrade: val })}>
                      <SelectTrigger id="material-grade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A36">A36</SelectItem>
                        <SelectItem value="A572">A572</SelectItem>
                        <SelectItem value="A992">A992 Gr.50</SelectItem>
                        <SelectItem value="A500">A500</SelectItem>
                        <SelectItem value="A913">A913</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={newItem.weight}
                      onChange={(e) => setNewItem({ ...newItem, weight: Number(e.target.value) })}
                      placeholder="1500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery">Delivery</Label>
                    <Select value={newItem.deliveryId} onValueChange={(val) => setNewItem({ ...newItem, deliveryId: val })}>
                      <SelectTrigger id="delivery">
                        <SelectValue placeholder="Select delivery" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {deliveries?.map(delivery => (
                          <SelectItem key={delivery.id} value={delivery.id}>
                            {delivery.deliveryNumber} - {new Date(delivery.expectedDate).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateItem}>Create Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package size={20} className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalWeight.toLocaleString()} lbs total
            </p>
            <Progress value={metrics.overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.overallProgress}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detailing</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText size={20} className="text-blue-500" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.detailingComplete}</div>
            <p className="text-xs text-muted-foreground">
              Released for fabrication
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Production</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Hammer size={20} className="text-orange-500" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inProduction}</div>
            <p className="text-xs text-muted-foreground">
              Currently fabricating
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle size={20} className="text-green-500" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed + metrics.shipped}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedWeight.toLocaleString()} lbs
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Warning size={20} className="text-red-500" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blocked}</div>
            <p className="text-xs text-muted-foreground">
              Items need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fabrication Items</CardTitle>
              <CardDescription>Track detailing, fabrication, and delivery status</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search pieces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[200px]"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not-ready">Not Ready</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="material-ordered">Material Ordered</SelectItem>
                    <SelectItem value="material-received">Material Received</SelectItem>
                    <SelectItem value="in-production">In Production</SelectItem>
                    <SelectItem value="qc-hold">QC Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No fabrication items</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create fab items to track detailing, production, and deliveries
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Create Fab Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-lg">{item.pieceNumber}</span>
                          <Badge variant="outline" className="font-mono">{item.pieceMark}</Badge>
                          {item.drawingNumber && (
                            <Badge variant="outline">
                              <FileText size={12} className="mr-1" />
                              {item.drawingNumber}
                            </Badge>
                          )}
                          <Badge className={getPriorityBadge(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">{item.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          <span>{item.material} {item.materialGrade}</span>
                          <span>•</span>
                          <span>{item.weight.toLocaleString()} lbs × {item.quantity}</span>
                          <span>•</span>
                          <span className="font-semibold">{(item.weight * item.quantity).toLocaleString()} lbs total</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium flex items-center gap-1">
                            <FileText size={14} />
                            Detailing
                          </Label>
                          <Badge className={`text-xs ${getStatusColor(item.detailingStatus)} text-white`}>
                            {item.detailingStatus}
                          </Badge>
                        </div>
                        <Progress value={item.detailingProgress} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.detailingProgress}%</span>
                          {item.detailingBlockers.filter(b => b.status === 'active').length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {item.detailingBlockers.filter(b => b.status === 'active').length} blockers
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium flex items-center gap-1">
                            <Hammer size={14} />
                            Fabrication
                          </Label>
                          <Select 
                            value={item.fabricationStatus} 
                            onValueChange={(val) => updateItemStatus(item.id, 'fabricationStatus', val)}
                          >
                            <SelectTrigger className={`h-7 text-xs ${getStatusColor(item.fabricationStatus)} text-white border-none`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not-ready">Not Ready</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="material-ordered">Material Ordered</SelectItem>
                              <SelectItem value="material-received">Material Received</SelectItem>
                              <SelectItem value="in-production">In Production</SelectItem>
                              <SelectItem value="qc-hold">QC Hold</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Progress value={item.fabricationProgress} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.fabricationProgress}%</span>
                          {item.fabricationBlockers.filter(b => b.status === 'active').length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {item.fabricationBlockers.filter(b => b.status === 'active').length} blockers
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium flex items-center gap-1">
                            <Truck size={14} />
                            Delivery
                          </Label>
                          {item.deliveryRequired ? (
                            <Badge className={`text-xs ${item.deliveryStatus === 'delivered' ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                              {item.deliveryStatus || 'scheduled'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not required
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          {item.deliveryRequired && item.deliveryScheduledDate && (
                            <div className="text-xs text-muted-foreground">
                              <Clock size={12} className="inline mr-1" />
                              {new Date(item.deliveryScheduledDate).toLocaleDateString()}
                            </div>
                          )}
                          {item.qcStatus !== 'pending' && (
                            <Badge 
                              variant={item.qcStatus === 'passed' ? 'default' : 'destructive'} 
                              className="text-xs"
                            >
                              <ListChecks size={12} className="mr-1" />
                              QC: {item.qcStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {(item.detailingDependencies.length > 0 || 
                      item.detailingBlockers.filter(b => b.status === 'active').length > 0 ||
                      item.fabricationBlockers.filter(b => b.status === 'active').length > 0) && (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          {item.detailingDependencies.filter(d => d.status !== 'resolved').length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-muted-foreground">Dependencies:</span>
                              <div className="mt-1 space-y-1">
                                {item.detailingDependencies
                                  .filter(d => d.status !== 'resolved')
                                  .map(dep => (
                                    <div key={dep.id} className="flex items-center gap-2">
                                      <CircleDashed size={12} className="text-yellow-500" />
                                      <span className="text-muted-foreground">{dep.description}</span>
                                      <Badge variant="outline" className="text-xs">{dep.dependencyType}</Badge>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          
                          {[...item.detailingBlockers, ...item.fabricationBlockers]
                            .filter(b => b.status === 'active')
                            .map(blocker => (
                              <div key={blocker.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                                <div className="flex items-center gap-2">
                                  <Warning size={14} className="text-destructive" />
                                  <div>
                                    <div className="text-xs font-medium">{blocker.description}</div>
                                    <div className="text-xs text-muted-foreground">{blocker.blockerType}</div>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => resolveBlocker(
                                    item.id, 
                                    item.detailingBlockers.includes(blocker) ? 'detailing' : 'fabrication',
                                    blocker.id
                                  )}
                                >
                                  Resolve
                                </Button>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
