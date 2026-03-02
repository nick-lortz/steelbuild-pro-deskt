import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Truck, CheckCircle, Clock, Warning, X } from '@phosphor-icons/react'
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
import type { Delivery } from '@/lib/types'

export function DeliveriesPage() {
  const { projectId } = useParams()
  const [deliveries, setDeliveries] = useKV<Delivery[]>(`deliveries-${projectId}`, [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    deliveryNumber: '',
    description: '',
    supplier: '',
    expectedDate: '',
    trackingNumber: '',
  })

  const handleCreate = () => {
    if (!formData.deliveryNumber || !formData.description || !formData.supplier || !formData.expectedDate) {
      toast.error('Please fill in required fields')
      return
    }

    const newDelivery: Delivery = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...formData,
      status: 'scheduled',
      items: [],
      createdAt: new Date().toISOString(),
    }

    setDeliveries(current => [...(current || []), newDelivery])
    setIsCreateOpen(false)
    setFormData({
      deliveryNumber: '',
      description: '',
      supplier: '',
      expectedDate: '',
      trackingNumber: '',
    })
    toast.success('Delivery scheduled successfully')
  }

  const getStatusBadge = (status: Delivery['status']) => {
    const variants: Record<Delivery['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      scheduled: { variant: 'outline', icon: <Clock size={14} /> },
      'in-transit': { variant: 'default', icon: <Truck size={14} /> },
      delivered: { variant: 'secondary', icon: <CheckCircle size={14} /> },
      delayed: { variant: 'destructive', icon: <Warning size={14} /> },
      cancelled: { variant: 'destructive', icon: <X size={14} /> },
    }
    return variants[status]
  }

  const scheduledDeliveries = deliveries?.filter(d => d.status === 'scheduled').length || 0
  const inTransitDeliveries = deliveries?.filter(d => d.status === 'in-transit').length || 0
  const deliveredCount = deliveries?.filter(d => d.status === 'delivered').length || 0
  const delayedDeliveries = deliveries?.filter(d => d.status === 'delayed').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Deliveries</h2>
          <p className="text-muted-foreground">Material delivery tracking and scheduling</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Schedule Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Delivery</DialogTitle>
              <DialogDescription>Create a new material delivery record</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="delivery-number">Delivery Number *</Label>
                <Input
                  id="delivery-number"
                  value={formData.deliveryNumber}
                  onChange={(e) => setFormData({ ...formData, deliveryNumber: e.target.value })}
                  placeholder="e.g., DEL-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="delivery-description">Description *</Label>
                <Textarea
                  id="delivery-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's being delivered"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="delivery-supplier">Supplier *</Label>
                  <Input
                    id="delivery-supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="delivery-date">Expected Date *</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="delivery-tracking">Tracking Number</Label>
                <Input
                  id="delivery-tracking"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  placeholder="Optional tracking number"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Schedule Delivery</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck size={20} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              On the way
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle size={20} className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredCount}</div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <Warning size={20} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{delayedDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Schedule</CardTitle>
          <CardDescription>All scheduled and completed deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {!deliveries || deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deliveries scheduled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking material deliveries to your project site
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={16} className="mr-2" />
                Schedule Delivery
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => {
                  const statusBadge = getStatusBadge(delivery.status)
                  const isLate = delivery.status !== 'delivered' && 
                    new Date(delivery.expectedDate) < new Date() &&
                    delivery.status !== 'cancelled'
                  
                  return (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-mono font-medium">{delivery.deliveryNumber}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {delivery.description}
                        </div>
                        {delivery.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{delivery.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>{delivery.supplier}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant} className="gap-1">
                          {statusBadge.icon}
                          {delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(delivery.expectedDate).toLocaleDateString()}
                        </div>
                        {isLate && (
                          <Badge variant="destructive" className="mt-1 text-xs">Late</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {delivery.actualDate ? (
                          <div className="text-sm">{new Date(delivery.actualDate).toLocaleDateString()}</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {delivery.trackingNumber ? (
                          <span className="font-mono text-xs">{delivery.trackingNumber}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{delivery.items.length}</TableCell>
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
