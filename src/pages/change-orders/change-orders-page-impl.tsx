import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, FileText, CheckCircle, Clock, X, PencilSimple, Trash } from '@phosphor-icons/react'
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
import type { ChangeOrder, ChangeOrderLineItem } from '@/lib/types'

export function ChangeOrdersPageImpl() {
  const { projectId } = useParams()
  const [changeOrders, setChangeOrders] = useKV<ChangeOrder[]>(`change-orders-${projectId}`, [])
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCO, setEditingCO] = useState<ChangeOrder | null>(null)
  
  const [formData, setFormData] = useState({
    number: '',
    title: '',
    description: '',
    requestedBy: '',
    status: 'draft' as ChangeOrder['status'],
  })

  const [lineItems, setLineItems] = useState<Array<Omit<ChangeOrderLineItem, 'id' | 'changeOrderId'>>>([])
  const [newLineItem, setNewLineItem] = useState({
    description: '',
    quantity: '',
    unit: '',
    unitPrice: '',
  })

  const draftCount = changeOrders?.filter(co => co.status === 'draft').length || 0
  const submittedCount = changeOrders?.filter(co => co.status === 'submitted').length || 0
  const approvedCount = changeOrders?.filter(co => co.status === 'approved').length || 0
  const totalValue = changeOrders?.reduce((sum, co) => sum + co.total, 0) || 0

  const addLineItem = () => {
    if (!newLineItem.description || !newLineItem.quantity || !newLineItem.unitPrice) {
      toast.error('Please fill in line item fields')
      return
    }

    const qty = parseFloat(newLineItem.quantity)
    const price = parseFloat(newLineItem.unitPrice)
    const total = qty * price

    setLineItems(current => [...current, {
      description: newLineItem.description,
      quantity: qty,
      unit: newLineItem.unit || 'EA',
      unitPrice: price,
      total,
    }])
    setNewLineItem({ description: '', quantity: '', unit: '', unitPrice: '' })
  }

  const removeLineItem = (index: number) => {
    setLineItems(current => current.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
    if (!formData.number || !formData.title || !formData.requestedBy) {
      toast.error('Please fill in required fields')
      return
    }

    if (lineItems.length === 0) {
      toast.error('Add at least one line item')
      return
    }

    const total = lineItems.reduce((sum, item) => sum + item.total, 0)

    const newCO: ChangeOrder = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      number: formData.number,
      title: formData.title,
      description: formData.description || undefined,
      status: 'draft',
      requestedBy: formData.requestedBy,
      requestedDate: new Date().toISOString(),
      lineItems: lineItems.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        changeOrderId: '',
      })),
      total,
      createdAt: new Date().toISOString(),
    }

    setChangeOrders(current => [...(current || []), newCO])
    setIsCreateOpen(false)
    setFormData({ number: '', title: '', description: '', requestedBy: '', status: 'draft' })
    setLineItems([])
    toast.success('Change order created')
  }

  const handleEdit = (co: ChangeOrder) => {
    setEditingCO(co)
    setFormData({
      number: co.number,
      title: co.title,
      description: co.description || '',
      requestedBy: co.requestedBy,
      status: co.status,
    })
    setLineItems(co.lineItems)
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!formData.number || !formData.title || !formData.requestedBy || !editingCO) {
      toast.error('Please fill in required fields')
      return
    }

    const total = lineItems.reduce((sum, item) => sum + item.total, 0)

    setChangeOrders(current =>
      (current || []).map(co =>
        co.id === editingCO.id
          ? {
              ...co,
              number: formData.number,
              title: formData.title,
              description: formData.description || undefined,
              requestedBy: formData.requestedBy,
              status: formData.status,
              lineItems: lineItems.map(item => ({
                ...item,
                id: item.id || crypto.randomUUID(),
                changeOrderId: co.id,
              })) as ChangeOrderLineItem[],
              total,
            }
          : co
      )
    )
    setIsEditOpen(false)
    setEditingCO(null)
    setFormData({ number: '', title: '', description: '', requestedBy: '', status: 'draft' })
    setLineItems([])
    toast.success('Change order updated')
  }

  const handleDelete = (coId: string) => {
    setChangeOrders(current => (current || []).filter(co => co.id !== coId))
    toast.success('Change order deleted')
  }

  const getStatusBadge = (status: ChangeOrder['status']) => {
    const config = {
      draft: { variant: 'outline' as const, label: 'Draft' },
      submitted: { variant: 'secondary' as const, label: 'Submitted' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
    }
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Change Orders</h2>
          <p className="text-muted-foreground">Manage project change orders</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              New Change Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Change Order</DialogTitle>
              <DialogDescription>Add a new change order with line items</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">CO Number</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="CO-001"
                  />
                </div>
                <div>
                  <Label htmlFor="requested">Requested By</Label>
                  <Input
                    id="requested"
                    value={formData.requestedBy}
                    onChange={e => setFormData(prev => ({ ...prev, requestedBy: e.target.value }))}
                    placeholder="Name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Change order title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the change..."
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Line Items</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    <Input
                      placeholder="Description"
                      value={newLineItem.description}
                      onChange={e => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      value={newLineItem.quantity}
                      onChange={e => setNewLineItem(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                    <Input
                      placeholder="Unit"
                      value={newLineItem.unit}
                      onChange={e => setNewLineItem(prev => ({ ...prev, unit: e.target.value }))}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="$/Unit"
                      value={newLineItem.unitPrice}
                      onChange={e => setNewLineItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                    />
                  </div>
                  <Button onClick={addLineItem} variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2" size={16} />
                    Add Line Item
                  </Button>
                </div>

                {lineItems.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {lineItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                    <div className="text-right font-bold pt-2 border-t">
                      Total: ${lineItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleCreate} className="w-full">Create Change Order</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <FileText className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{changeOrders?.length || 0} change orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">Pending submission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <Clock className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Orders</CardTitle>
          <CardDescription>All change orders for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {!changeOrders || changeOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No change orders yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2" />
                Create First Change Order
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changeOrders.map(co => (
                  <TableRow key={co.id}>
                    <TableCell className="font-medium">{co.number}</TableCell>
                    <TableCell>{co.title}</TableCell>
                    <TableCell>{co.requestedBy}</TableCell>
                    <TableCell>{new Date(co.requestedDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(co.status)}</TableCell>
                    <TableCell className="text-right font-medium">${co.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(co)}>
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
                              <AlertDialogTitle>Delete Change Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(co.id)}>Delete</AlertDialogAction>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Change Order</DialogTitle>
            <DialogDescription>Update change order details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-number">CO Number</Label>
                <Input
                  id="edit-number"
                  value={formData.number}
                  onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-requested">Requested By</Label>
                <Input
                  id="edit-requested"
                  value={formData.requestedBy}
                  onChange={e => setFormData(prev => ({ ...prev, requestedBy: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v as ChangeOrder['status'] }))}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Line Items</h3>
              {lineItems.length > 0 && (
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right font-bold pt-2 border-t">
                    Total: ${lineItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleUpdate} className="w-full">Update Change Order</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
