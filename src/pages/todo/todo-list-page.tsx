import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, CheckCircle, Circle, Clock, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { TodoItem } from '@/lib/types'

export function TodoListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [todos, setTodos] = useKV<TodoItem[]>('todos', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('active')

  const projectTodos = todos.filter(t => 
    projectId ? t.projectId === projectId : !t.projectId
  )

  const filteredTodos = projectTodos.filter(todo => {
    if (statusFilter === 'active') return todo.status !== 'completed' && todo.status !== 'cancelled'
    if (statusFilter === 'completed') return todo.status === 'completed'
    return true
  })

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const todoData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as TodoItem['priority'],
      status: formData.get('status') as TodoItem['status'],
      category: formData.get('category') as TodoItem['category'],
      assignedTo: formData.get('assignedTo') as string,
      dueDate: formData.get('dueDate') as string,
    }

    if (editingTodo) {
      setTodos(current => current.map(t =>
        t.id === editingTodo.id
          ? { ...t, ...todoData, updatedAt: new Date().toISOString() }
          : t
      ))
      toast.success('Todo updated successfully')
    } else {
      const newTodo: TodoItem = {
        id: crypto.randomUUID(),
        projectId: projectId || undefined,
        ...todoData,
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTodos(current => [...current, newTodo])
      toast.success('Todo created successfully')
    }

    setIsDialogOpen(false)
    setEditingTodo(null)
    e.currentTarget.reset()
  }

  const handleToggleComplete = (id: string) => {
    setTodos(current => current.map(t =>
      t.id === id
        ? {
            ...t,
            status: t.status === 'completed' ? 'pending' : 'completed',
            completedDate: t.status === 'completed' ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : t
    ))
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      setTodos(current => current.filter(t => t.id !== id))
      toast.success('Todo deleted')
    }
  }

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: TodoItem['category']) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      technical: 'bg-blue-100 text-blue-800',
      procurement: 'bg-green-100 text-green-800',
      coordination: 'bg-orange-100 text-orange-800',
      submittal: 'bg-pink-100 text-pink-800',
      rfi: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
  }

  const stats = {
    total: projectTodos.length,
    pending: projectTodos.filter(t => t.status === 'pending').length,
    inProgress: projectTodos.filter(t => t.status === 'in-progress').length,
    completed: projectTodos.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">To-Do List</h1>
          <p className="text-muted-foreground">Track and manage action items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTodo(null)}>
              <Plus className="mr-2" />
              New To-Do
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTodo ? 'Edit To-Do' : 'Create New To-Do'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingTodo?.title}
                  required
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingTodo?.description}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select name="priority" defaultValue={editingTodo?.priority || 'medium'}>
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={editingTodo?.status || 'pending'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" defaultValue={editingTodo?.category || 'other'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="coordination">Coordination</SelectItem>
                      <SelectItem value="submittal">Submittal</SelectItem>
                      <SelectItem value="rfi">RFI</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={editingTodo?.dueDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  name="assignedTo"
                  defaultValue={editingTodo?.assignedTo}
                  placeholder="Team member name"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTodo ? 'Update' : 'Create'} To-Do
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
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
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">All done!</h3>
              <p className="text-muted-foreground mb-4">No todos to show</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTodos
                .sort((a, b) => {
                  if (a.status === 'completed' && b.status !== 'completed') return 1
                  if (a.status !== 'completed' && b.status === 'completed') return -1
                  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                  return priorityOrder[a.priority] - priorityOrder[b.priority]
                })
                .map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      todo.status === 'completed' ? 'opacity-50' : 'hover:bg-accent/50'
                    } transition-colors`}
                  >
                    <Checkbox
                      checked={todo.status === 'completed'}
                      onCheckedChange={() => handleToggleComplete(todo.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${todo.status === 'completed' ? 'line-through' : ''}`}>
                          {todo.title}
                        </h3>
                        <Badge variant="outline" className={getPriorityColor(todo.priority)}>
                          {todo.priority}
                        </Badge>
                        <Badge variant="outline" className={getCategoryColor(todo.category)}>
                          {todo.category}
                        </Badge>
                      </div>
                      {todo.description && (
                        <p className="text-sm text-muted-foreground mb-2">{todo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {todo.assignedTo && <span>Assigned: {todo.assignedTo}</span>}
                        {todo.dueDate && (
                          <>
                            {todo.assignedTo && <span>•</span>}
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTodo(todo)
                          setIsDialogOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(todo.id)}
                      >
                        <X />
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
