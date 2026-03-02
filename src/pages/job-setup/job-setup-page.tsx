import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, CheckSquare, Square, ClipboardText } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { JobSetupItem } from '@/lib/types'

export function JobSetupPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [items, setItems] = useKV<JobSetupItem[]>('job-setup-items', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<JobSetupItem | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const projectItems = items.filter(i => i.projectId === projectId)
  const filteredItems = projectItems.filter(i => 
    categoryFilter === 'all' || i.category === categoryFilter
  )

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const itemData = {
      category: formData.get('category') as JobSetupItem['category'],
      description: formData.get('description') as string,
      required: formData.get('required') === 'on',
      status: formData.get('status') as JobSetupItem['status'],
      assignedTo: formData.get('assignedTo') as string || undefined,
      dueDate: formData.get('dueDate') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      dependencies: [],
      order: editingItem?.order || projectItems.length,
    }

    if (editingItem) {
      setItems(current => current.map(i =>
        i.id === editingItem.id
          ? { ...i, ...itemData, updatedAt: new Date().toISOString() }
          : i
      ))
      toast.success('Setup item updated successfully')
    } else {
      const newItem: JobSetupItem = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...itemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setItems(current => [...current, newItem])
      toast.success('Setup item created successfully')
    }

    setIsDialogOpen(false)
    setEditingItem(null)
    e.currentTarget.reset()
  }

  const handleToggleComplete = (id: string) => {
    setItems(current => current.map(i =>
      i.id === id
        ? {
            ...i,
            status: i.status === 'completed' ? 'not-started' : 'completed',
            completedDate: i.status === 'completed' ? undefined : new Date().toISOString(),
            completedBy: i.status === 'completed' ? undefined : 'current-user',
            updatedAt: new Date().toISOString(),
          }
        : i
    ))
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(current => current.filter(i => i.id !== id))
      toast.success('Setup item deleted')
    }
  }

  const getCategoryColor = (category: JobSetupItem['category']) => {
    const colors: Record<string, string> = {
      contracts: 'bg-purple-100 text-purple-800',
      insurance: 'bg-blue-100 text-blue-800',
      permits: 'bg-green-100 text-green-800',
      submittals: 'bg-orange-100 text-orange-800',
      logistics: 'bg-yellow-100 text-yellow-800',
      safety: 'bg-red-100 text-red-800',
      qc: 'bg-indigo-100 text-indigo-800',
      coordination: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
  }

  const getStatusColor = (status: JobSetupItem['status']) => {
    const colors: Record<string, string> = {
      'not-started': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800',
    }
    return colors[status]
  }

  const stats = {
    total: projectItems.length,
    required: projectItems.filter(i => i.required).length,
    completed: projectItems.filter(i => i.status === 'completed').length,
    blocked: projectItems.filter(i => i.status === 'blocked').length,
  }

  const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Setup Checklist</h1>
          <p className="text-muted-foreground">Track project mobilization tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <Plus className="mr-2" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Setup Item' : 'Create Setup Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editingItem?.category || 'other'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contracts">Contracts</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="permits">Permits</SelectItem>
                    <SelectItem value="submittals">Submittals</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="qc">QC</SelectItem>
                    <SelectItem value="coordination">Coordination</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingItem?.description}
                  required
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={editingItem?.status || 'not-started'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    name="assignedTo"
                    defaultValue={editingItem?.assignedTo}
                    placeholder="Team member name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={editingItem?.dueDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingItem?.notes}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  name="required"
                  defaultChecked={editingItem?.required}
                  className="rounded"
                />
                <Label htmlFor="required">Mark as required</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'} Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.required}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.blocked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{completionPercent}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="contracts">Contracts</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="permits">Permits</SelectItem>
              <SelectItem value="submittals">Submittals</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="qc">QC</SelectItem>
              <SelectItem value="coordination">Coordination</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardText className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">No setup items</h3>
              <p className="text-muted-foreground">Add items to your job setup checklist</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg ${
                      item.status === 'completed' ? 'opacity-50' : 'hover:bg-accent/50'
                    } transition-colors`}
                  >
                    <Checkbox
                      checked={item.status === 'completed'}
                      onCheckedChange={() => handleToggleComplete(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${item.status === 'completed' ? 'line-through' : ''}`}>
                          {item.description}
                        </h3>
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('-', ' ')}
                        </Badge>
                        {item.required && (
                          <Badge variant="outline" className="bg-red-50 text-red-800">
                            Required
                          </Badge>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{item.notes}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {item.assignedTo && <span>Assigned: {item.assignedTo}</span>}
                        {item.dueDate && (
                          <>
                            {item.assignedTo && <span>•</span>}
                            <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                        {item.completedDate && (
                          <>
                            <span>•</span>
                            <span>Completed: {new Date(item.completedDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item)
                          setIsDialogOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
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
