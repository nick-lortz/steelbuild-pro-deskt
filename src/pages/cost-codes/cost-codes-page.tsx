import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Tag, PencilSimple, Trash, Warning } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useCostCodes } from '@/hooks/use-database'

export function CostCodesPage() {
  const { projectId } = useParams()
  const { costCodes, loading, error, createCostCode, updateCostCode, deleteCostCode } = useCostCodes(projectId)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<any>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: 'labor',
    budget_amount: '',
  })

  const totalBudget = costCodes.reduce((sum, cc) => sum + (cc.budget_amount || 0), 0)
  const totalActual = costCodes.reduce((sum, cc) => sum + (cc.actual_amount || 0), 0)

  const handleCreate = async () => {
    if (!formData.code || !formData.description) {
      toast.error('Please fill in code and description')
      return
    }

    const result = await createCostCode({
      code: formData.code,
      description: formData.description,
      category: formData.category,
      budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : 0,
      actual_amount: 0,
    })

    if (result.success) {
      setIsCreateOpen(false)
      setFormData({ code: '', description: '', category: 'labor', budget_amount: '' })
      toast.success('Cost code created')
    } else {
      toast.error(result.error || 'Failed to create cost code')
    }
  }

  const handleEdit = (code: any) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      description: code.description,
      category: code.category || 'labor',
      budget_amount: code.budget_amount?.toString() || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!formData.code || !formData.description || !editingCode) {
      toast.error('Please fill in code and description')
      return
    }

    const result = await updateCostCode(editingCode.id, {
      code: formData.code,
      description: formData.description,
      category: formData.category,
      budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : 0,
    })

    if (result.success) {
      setIsEditOpen(false)
      setEditingCode(null)
      setFormData({ code: '', description: '', category: 'labor', budget_amount: '' })
      toast.success('Cost code updated')
    } else {
      toast.error(result.error || 'Failed to update cost code')
    }
  }

  const handleDelete = async (codeId: string) => {
    const result = await deleteCostCode(codeId)
    if (result.success) {
      toast.success('Cost code deleted')
    } else {
      toast.error(result.error || 'Failed to delete cost code')
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Warning size={64} className="text-destructive" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Failed to load cost codes</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cost Codes</h2>
          <p className="text-muted-foreground">Manage project cost codes and budgets</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              New Cost Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Cost Code</DialogTitle>
              <DialogDescription>Add a new cost code to this project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="01-1000"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(prev => ({ ...prev, category: v as CostCode['category'] }))}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="subcontractor">Subcontractor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Cost code name"
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget Amount (Optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget_amount}
                  onChange={e => setFormData(prev => ({ ...prev, budget_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Cost Code</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Codes</CardTitle>
            <Tag className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costCodes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Tag className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Budgeted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
            <Tag className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Spent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Codes</CardTitle>
          <CardDescription>All cost codes for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {!costCodes || costCodes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No cost codes yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2" />
                Create First Cost Code
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCodes.map(code => {
                  const variance = (code.budget_amount || 0) - (code.actual_amount || 0)
                  return (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium font-mono">{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell className="capitalize">{code.category || 'N/A'}</TableCell>
                      <TableCell className="text-right">${(code.budget_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">${(code.actual_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-medium ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${variance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(code)}>
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
                                <AlertDialogTitle>Delete Cost Code</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(code.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cost Code</DialogTitle>
            <DialogDescription>Update cost code details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code">Code</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData(prev => ({ ...prev, category: v as CostCode['category'] }))}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-budget">Budget Amount</Label>
              <Input
                id="edit-budget"
                type="number"
                step="0.01"
                value={formData.budget_amount}
                onChange={e => setFormData(prev => ({ ...prev, budget_amount: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">Update Cost Code</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
