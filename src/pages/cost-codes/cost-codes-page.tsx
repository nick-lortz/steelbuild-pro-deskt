import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Tag, PencilSimple, Trash, Warning } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { costCodesDb } from '@/lib/db'
import type { CostCode } from '@/lib/types'
import { triggerFinancialRollup } from '@/lib/services/financial-rollup'
import { cn } from '@/lib/utils'

export function CostCodesPage() {
  const { projectId } = useParams()
  const [costCodes, setCostCodes] = useState<CostCode[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<CostCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'labor',
    budget_amount: '',
  })

  const loadCostCodes = async () => {
    setLoading(true)
    try {
      const codes = await costCodesDb.getByProject(projectId)
      setCostCodes(codes)
    } catch (error) {
      console.error('Failed to load cost codes:', error)
      toast.error('Failed to load cost codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCostCodes()
  }, [projectId])

  const totalBudget = costCodes.reduce((sum, cc) => sum + (cc.budgetAmount || 0), 0)
  const totalActual = costCodes.reduce((sum, cc) => sum + (cc.actualAmount || 0), 0)

  const handleCreate = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill in code and name')
      return
    }

    try {
      await costCodesDb.create({
        projectId: projectId || undefined,
        code: formData.code,
        name: formData.name,
        category: formData.category,
        budgetAmount: formData.budget_amount ? parseFloat(formData.budget_amount) : 0,
        actualAmount: 0,
      })

      await loadCostCodes()
      
      if (projectId) {
        await triggerFinancialRollup(projectId)
      }
      
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'costCode', action: 'create' } }))
      setIsCreateOpen(false)
      setFormData({ code: '', name: '', category: 'labor', budget_amount: '' })
      toast.success('Cost code created and financials updated')
    } catch (error: any) {
      console.error('Failed to create cost code:', error)
      toast.error(error.message || 'Failed to create cost code')
    }
  }

  const handleEdit = (code: CostCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      name: code.name,
      category: code.category || 'labor',
      budget_amount: code.budgetAmount?.toString() || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!formData.code || !formData.name || !editingCode) {
      toast.error('Please fill in code and name')
      return
    }

    try {
      await costCodesDb.update(editingCode.id, {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        budgetAmount: formData.budget_amount ? parseFloat(formData.budget_amount) : 0,
      })

      await loadCostCodes()
      
      if (projectId) {
        await triggerFinancialRollup(projectId)
      }
      
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'costCode', action: 'update' } }))
      setIsEditOpen(false)
      setEditingCode(null)
      setFormData({ code: '', name: '', category: 'labor', budget_amount: '' })
      toast.success('Cost code updated and financials recalculated')
    } catch (error: any) {
      console.error('Failed to update cost code:', error)
      toast.error(error.message || 'Failed to update cost code')
    }
  }

  const handleDelete = async (codeId: string) => {
    try {
      await costCodesDb.delete(codeId)
      await loadCostCodes()
      
      if (projectId) {
        await triggerFinancialRollup(projectId)
      }
      
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'costCode', action: 'delete' } }))
      toast.success('Cost code deleted')
    } catch (error: any) {
      console.error('Failed to delete cost code:', error)
      toast.error(error.message || 'Failed to delete cost code')
    }
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-background to-amber-50">
      <div className="space-y-6 p-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Cost Codes</h2>
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
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Codes</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costCodes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active codes</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Tag className="text-accent" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Budgeted</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <Tag className="text-warning" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Spent</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-muted/10">
          <CardTitle className="text-lg">Cost Codes</CardTitle>
          <CardDescription>All cost codes for this project</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!costCodes || costCodes.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                <Tag className="text-muted-foreground" size={32} weight="duotone" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No cost codes yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Create your first cost code to start tracking project costs</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2" size={16} />
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
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCodes.map(code => {
                  const variance = (code.budgetAmount || 0) - (code.actualAmount || 0)
                  const progress = code.budgetAmount ? ((code.actualAmount || 0) / code.budgetAmount) * 100 : 0
                  const isOverBudget = variance < 0
                  
                  return (
                    <TableRow key={code.id}>
                      <TableCell className="font-semibold font-mono text-foreground">
                        {code.code}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{code.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-medium">
                          {code.category || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        ${(code.budgetAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        ${(code.actualAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          'inline-flex items-center gap-1 font-semibold tabular-nums',
                          isOverBudget ? 'text-destructive' : 'text-success'
                        )}>
                          <span>{isOverBudget ? '-' : '+'}</span>
                          <span>${Math.abs(variance).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                progress >= 100 ? 'bg-destructive' : 'bg-accent'
                              )}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(code)}
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
                                <AlertDialogTitle>Delete Cost Code</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete cost code <strong>{code.code}</strong>? This action cannot be undone.
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
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
    </div>
  )
}
