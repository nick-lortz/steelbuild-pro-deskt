import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Plus, Package, CheckCircle, Hammer } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Fabrication } from '@/lib/types'

export function FabricationTrackingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [fabrications, setFabrications] = useKV<Fabrication[]>('fabrications', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const projectFabs = fabrications.filter(f => f.projectId === projectId)
  const filteredFabs = projectFabs.filter(f => 
    statusFilter === 'all' || f.status === statusFilter
  )

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newFab: Fabrication = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      pieceNumber: formData.get('pieceNumber') as string,
      description: formData.get('description') as string,
      material: formData.get('material') as string,
      weight: Number(formData.get('weight')),
      quantity: Number(formData.get('quantity')),
      status: 'not-started',
      detailingProgress: 0,
      fabricationProgress: 0,
      drawingNumber: formData.get('drawingNumber') as string,
      targetCompletionDate: formData.get('targetCompletionDate') as string,
      qcChecks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setFabrications(current => [...current, newFab])
    toast.success('Fabrication item created')
    setIsDialogOpen(false)
    e.currentTarget.reset()
  }

  const updateStatus = (id: string, status: Fabrication['status']) => {
    setFabrications(current => current.map(f =>
      f.id === id ? { ...f, status, updatedAt: new Date().toISOString() } : f
    ))
    toast.success('Status updated')
  }

  const getStatusColor = (status: Fabrication['status']) => {
    const colors: Record<string, string> = {
      'not-started': 'bg-gray-100 text-gray-800',
      'detailing': 'bg-blue-100 text-blue-800',
      'material-ordered': 'bg-yellow-100 text-yellow-800',
      'material-received': 'bg-purple-100 text-purple-800',
      'in-production': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
    }
    return colors[status] || colors['not-started']
  }

  const stats = {
    total: projectFabs.length,
    notStarted: projectFabs.filter(f => f.status === 'not-started').length,
    inProduction: projectFabs.filter(f => f.status === 'in-production').length,
    completed: projectFabs.filter(f => f.status === 'completed' || f.status === 'shipped').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fabrication Tracking</h1>
          <p className="text-muted-foreground">Monitor fabrication progress and status</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Fabrication Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pieceNumber">Piece Number *</Label>
                  <Input id="pieceNumber" name="pieceNumber" required placeholder="B-101" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawingNumber">Drawing Number</Label>
                  <Input id="drawingNumber" name="drawingNumber" placeholder="S-101" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input id="description" name="description" required placeholder="W14x90 Column" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Material *</Label>
                  <Input id="material" name="material" required placeholder="A992 Gr.50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs) *</Label>
                  <Input id="weight" name="weight" type="number" required placeholder="1500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" name="quantity" type="number" required placeholder="4" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetCompletionDate">Target Completion</Label>
                <Input id="targetCompletionDate" name="targetCompletionDate" type="date" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.notStarted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.inProduction}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="detailing">Detailing</SelectItem>
              <SelectItem value="material-ordered">Material Ordered</SelectItem>
              <SelectItem value="material-received">Material Received</SelectItem>
              <SelectItem value="in-production">In Production</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredFabs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">No fabrication items</h3>
              <p className="text-muted-foreground">Start tracking fabrication</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFabs.map((fab) => (
                <div key={fab.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold">{fab.pieceNumber}</span>
                        {fab.drawingNumber && (
                          <Badge variant="outline">{fab.drawingNumber}</Badge>
                        )}
                      </div>
                      <h3 className="font-medium">{fab.description}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>{fab.material}</span>
                        <span>•</span>
                        <span>{fab.weight.toLocaleString()} lbs</span>
                        <span>•</span>
                        <span>Qty: {fab.quantity}</span>
                      </div>
                    </div>
                    <Select value={fab.status} onValueChange={(val) => updateStatus(fab.id, val as Fabrication['status'])}>
                      <SelectTrigger className={`w-[180px] ${getStatusColor(fab.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="detailing">Detailing</SelectItem>
                        <SelectItem value="material-ordered">Material Ordered</SelectItem>
                        <SelectItem value="material-received">Material Received</SelectItem>
                        <SelectItem value="in-production">In Production</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Detailing Progress</span>
                      <span>{fab.detailingProgress}%</span>
                    </div>
                    <Progress value={fab.detailingProgress} />
                    <div className="flex justify-between text-sm">
                      <span>Fabrication Progress</span>
                      <span>{fab.fabricationProgress}%</span>
                    </div>
                    <Progress value={fab.fabricationProgress} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
