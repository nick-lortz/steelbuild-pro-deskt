import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, User, Clock, CurrencyDollar, PencilSimple, Trash, CalendarBlank } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { LaborEntry, LaborCategory, CostCode } from '@/lib/types'

export function LaborPage() {
  const { projectId } = useParams()
  const [laborEntries, setLaborEntries] = useKV<LaborEntry[]>(`labor-entries-${projectId}`, [])
  const [laborCategories, setLaborCategories] = useKV<LaborCategory[]>('labor-categories', [
    { id: '1', name: 'Ironworker', code: 'IW', baseRate: 45, overtimeRate: 67.5, createdAt: new Date().toISOString() },
    { id: '2', name: 'Welder', code: 'WLD', baseRate: 50, overtimeRate: 75, createdAt: new Date().toISOString() },
    { id: '3', name: 'Crane Operator', code: 'CRN', baseRate: 55, overtimeRate: 82.5, createdAt: new Date().toISOString() },
    { id: '4', name: 'Foreman', code: 'FMN', baseRate: 60, overtimeRate: 90, createdAt: new Date().toISOString() },
    { id: '5', name: 'Laborer', code: 'LBR', baseRate: 35, overtimeRate: 52.5, createdAt: new Date().toISOString() },
  ])
  const [costCodes, setCostCodes] = useKV<CostCode[]>(`cost-codes-${projectId}`, [])
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<LaborEntry | null>(null)
  const [formData, setFormData] = useState({
    categoryId: '',
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    regularHours: '',
    overtimeHours: '',
    costCodeId: '',
    description: '',
  })

  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: '',
    baseRate: '',
    overtimeRate: '',
  })

  const totalRegularHours = laborEntries?.reduce((sum, e) => sum + e.regularHours, 0) || 0
  const totalOvertimeHours = laborEntries?.reduce((sum, e) => sum + e.overtimeHours, 0) || 0
  const totalHours = totalRegularHours + totalOvertimeHours

  const totalCost = laborEntries?.reduce((sum, entry) => {
    const category = laborCategories?.find(c => c.id === entry.categoryId)
    if (!category) return sum
    return sum + (entry.regularHours * category.baseRate) + (entry.overtimeHours * category.overtimeRate)
  }, 0) || 0

  const handleCreateEntry = () => {
    if (!formData.categoryId || !formData.employeeName || !formData.date || !formData.regularHours) {
      toast.error('Please fill in required fields')
      return
    }

    const regularHours = parseFloat(formData.regularHours)
    const overtimeHours = formData.overtimeHours ? parseFloat(formData.overtimeHours) : 0

    const newEntry: LaborEntry = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      categoryId: formData.categoryId,
      employeeName: formData.employeeName,
      date: formData.date,
      regularHours,
      overtimeHours,
      totalHours: regularHours + overtimeHours,
      costCodeId: formData.costCodeId || undefined,
      description: formData.description || undefined,
      createdAt: new Date().toISOString(),
    }

    setLaborEntries(current => [...(current || []), newEntry])
    setIsCreateOpen(false)
    setFormData({
      categoryId: '',
      employeeName: '',
      date: new Date().toISOString().split('T')[0],
      regularHours: '',
      overtimeHours: '',
      costCodeId: '',
      description: '',
    })
    toast.success('Labor entry created')
  }

  const handleEdit = (entry: LaborEntry) => {
    setEditingEntry(entry)
    setFormData({
      categoryId: entry.categoryId,
      employeeName: entry.employeeName,
      date: entry.date,
      regularHours: entry.regularHours.toString(),
      overtimeHours: entry.overtimeHours.toString(),
      costCodeId: entry.costCodeId || '',
      description: entry.description || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!formData.categoryId || !formData.employeeName || !formData.date || !formData.regularHours || !editingEntry) {
      toast.error('Please fill in required fields')
      return
    }

    const regularHours = parseFloat(formData.regularHours)
    const overtimeHours = formData.overtimeHours ? parseFloat(formData.overtimeHours) : 0

    setLaborEntries(current =>
      (current || []).map(entry =>
        entry.id === editingEntry.id
          ? {
              ...entry,
              categoryId: formData.categoryId,
              employeeName: formData.employeeName,
              date: formData.date,
              regularHours,
              overtimeHours,
              totalHours: regularHours + overtimeHours,
              costCodeId: formData.costCodeId || undefined,
              description: formData.description || undefined,
            }
          : entry
      )
    )
    setIsEditOpen(false)
    setEditingEntry(null)
    setFormData({
      categoryId: '',
      employeeName: '',
      date: new Date().toISOString().split('T')[0],
      regularHours: '',
      overtimeHours: '',
      costCodeId: '',
      description: '',
    })
    toast.success('Labor entry updated')
  }

  const handleDelete = (entryId: string) => {
    setLaborEntries(current => (current || []).filter(e => e.id !== entryId))
    toast.success('Labor entry deleted')
  }

  const handleCreateCategory = () => {
    if (!categoryForm.name || !categoryForm.code || !categoryForm.baseRate) {
      toast.error('Please fill in required fields')
      return
    }

    const newCategory: LaborCategory = {
      id: crypto.randomUUID(),
      name: categoryForm.name,
      code: categoryForm.code,
      baseRate: parseFloat(categoryForm.baseRate),
      overtimeRate: categoryForm.overtimeRate ? parseFloat(categoryForm.overtimeRate) : parseFloat(categoryForm.baseRate) * 1.5,
      createdAt: new Date().toISOString(),
    }

    setLaborCategories(current => [...(current || []), newCategory])
    setIsCategoryOpen(false)
    setCategoryForm({ name: '', code: '', baseRate: '', overtimeRate: '' })
    toast.success('Labor category created')
  }

  const getCategoryName = (categoryId: string) => {
    return laborCategories?.find(c => c.id === categoryId)?.name || 'Unknown'
  }

  const getCostCodeName = (costCodeId?: string) => {
    if (!costCodeId) return '-'
    return costCodes?.find(c => c.id === costCodeId)?.code || costCodeId
  }

  const calculateEntryCost = (entry: LaborEntry) => {
    const category = laborCategories?.find(c => c.id === entry.categoryId)
    if (!category) return 0
    return (entry.regularHours * category.baseRate) + (entry.overtimeHours * category.overtimeRate)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Labor</h2>
          <p className="text-muted-foreground">Track labor hours and costs</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2" />
                Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Labor Category</DialogTitle>
                <DialogDescription>Add a new labor category with rates</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cat-name">Category Name</Label>
                  <Input
                    id="cat-name"
                    value={categoryForm.name}
                    onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Ironworker"
                  />
                </div>
                <div>
                  <Label htmlFor="cat-code">Code</Label>
                  <Input
                    id="cat-code"
                    value={categoryForm.code}
                    onChange={e => setCategoryForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., IW"
                  />
                </div>
                <div>
                  <Label htmlFor="cat-base">Base Rate ($/hr)</Label>
                  <Input
                    id="cat-base"
                    type="number"
                    step="0.01"
                    value={categoryForm.baseRate}
                    onChange={e => setCategoryForm(prev => ({ ...prev, baseRate: e.target.value }))}
                    placeholder="45.00"
                  />
                </div>
                <div>
                  <Label htmlFor="cat-ot">Overtime Rate ($/hr)</Label>
                  <Input
                    id="cat-ot"
                    type="number"
                    step="0.01"
                    value={categoryForm.overtimeRate}
                    onChange={e => setCategoryForm(prev => ({ ...prev, overtimeRate: e.target.value }))}
                    placeholder="67.50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank for 1.5x base rate</p>
                </div>
                <Button onClick={handleCreateCategory} className="w-full">Create Category</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Log Hours
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Labor Hours</DialogTitle>
                <DialogDescription>Record labor hours for an employee</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee Name</Label>
                  <Input
                    id="employee"
                    value={formData.employeeName}
                    onChange={e => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.categoryId} onValueChange={v => setFormData(prev => ({ ...prev, categoryId: v }))}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {laborCategories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} (${cat.baseRate}/hr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="regular">Regular Hours</Label>
                    <Input
                      id="regular"
                      type="number"
                      step="0.5"
                      value={formData.regularHours}
                      onChange={e => setFormData(prev => ({ ...prev, regularHours: e.target.value }))}
                      placeholder="8.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtime">Overtime Hours</Label>
                    <Input
                      id="overtime"
                      type="number"
                      step="0.5"
                      value={formData.overtimeHours}
                      onChange={e => setFormData(prev => ({ ...prev, overtimeHours: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="costcode">Cost Code (Optional)</Label>
                  <Select value={formData.costCodeId} onValueChange={v => setFormData(prev => ({ ...prev, costCodeId: v }))}>
                    <SelectTrigger id="costcode">
                      <SelectValue placeholder="Select cost code" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCodes?.map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.code} - {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="desc">Description (Optional)</Label>
                  <Input
                    id="desc"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Work description"
                  />
                </div>
                <Button onClick={handleCreateEntry} className="w-full">Log Hours</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {laborEntries?.length || 0} entries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Hours</CardTitle>
            <CalendarBlank className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegularHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Standard time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Clock className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOvertimeHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Premium time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <CurrencyDollar className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Labor costs
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Labor Entries</CardTitle>
          <CardDescription>Recent labor hour entries</CardDescription>
        </CardHeader>
        <CardContent>
          {!laborEntries || laborEntries.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No labor entries yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2" />
                Log First Entry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Regular</TableHead>
                  <TableHead>OT</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Cost Code</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laborEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{entry.employeeName}</TableCell>
                    <TableCell>{getCategoryName(entry.categoryId)}</TableCell>
                    <TableCell>{entry.regularHours}h</TableCell>
                    <TableCell>{entry.overtimeHours}h</TableCell>
                    <TableCell className="font-medium">{entry.totalHours}h</TableCell>
                    <TableCell>{getCostCodeName(entry.costCodeId)}</TableCell>
                    <TableCell className="font-medium">${calculateEntryCost(entry).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
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
                              <AlertDialogTitle>Delete Labor Entry</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this labor entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(entry.id)}>Delete</AlertDialogAction>
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
            <DialogTitle>Edit Labor Entry</DialogTitle>
            <DialogDescription>Update labor hour entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-employee">Employee Name</Label>
              <Input
                id="edit-employee"
                value={formData.employeeName}
                onChange={e => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.categoryId} onValueChange={v => setFormData(prev => ({ ...prev, categoryId: v }))}>
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {laborCategories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} (${cat.baseRate}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-regular">Regular Hours</Label>
                <Input
                  id="edit-regular"
                  type="number"
                  step="0.5"
                  value={formData.regularHours}
                  onChange={e => setFormData(prev => ({ ...prev, regularHours: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-overtime">Overtime Hours</Label>
                <Input
                  id="edit-overtime"
                  type="number"
                  step="0.5"
                  value={formData.overtimeHours}
                  onChange={e => setFormData(prev => ({ ...prev, overtimeHours: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-costcode">Cost Code</Label>
              <Select value={formData.costCodeId} onValueChange={v => setFormData(prev => ({ ...prev, costCodeId: v }))}>
                <SelectTrigger id="edit-costcode">
                  <SelectValue placeholder="Select cost code" />
                </SelectTrigger>
                <SelectContent>
                  {costCodes?.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Input
                id="edit-desc"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">Update Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
