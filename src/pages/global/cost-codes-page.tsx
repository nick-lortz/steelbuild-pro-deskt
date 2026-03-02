import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, PencilSimple, Trash, MagnifyingGlass, Buildings, Hammer, Truck, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { CostCode } from '@/lib/types'

export function GlobalCostCodesPage() {
  const [costCodes, setCostCodes] = useKV<CostCode[]>('global-cost-codes', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<CostCode | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'labor' as CostCode['category'],
    description: '',
  })

  const filteredCodes = costCodes.filter(code => {
    const matchesSearch = 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || code.category === categoryFilter
    const isGlobal = !code.projectId
    return matchesSearch && matchesCategory && isGlobal
  })

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast.error('Code and name are required')
      return
    }

    const codeExists = costCodes.some(
      c => c.code === formData.code && c.id !== editingCode?.id && !c.projectId
    )
    if (codeExists) {
      toast.error('Cost code already exists')
      return
    }

    if (editingCode) {
      setCostCodes(current =>
        current.map(c =>
          c.id === editingCode.id
            ? { ...c, ...formData, updatedAt: new Date().toISOString() }
            : c
        )
      )
      toast.success('Cost code updated')
    } else {
      const newCode: CostCode = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
      }
      setCostCodes(current => [...current, newCode])
      toast.success('Cost code created')
    }

    resetForm()
  }

  const handleEdit = (code: CostCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      name: code.name,
      category: code.category,
      description: code.description || '',
    })
    setIsCreateOpen(true)
  }

  const handleDelete = (id: string) => {
    setCostCodes(current => current.filter(c => c.id !== id))
    toast.success('Cost code deleted')
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: 'labor',
      description: '',
    })
    setEditingCode(null)
    setIsCreateOpen(false)
  }

  const getCategoryIcon = (category: CostCode['category']) => {
    switch (category) {
      case 'labor': return <Users className="w-4 h-4" />
      case 'material': return <Buildings className="w-4 h-4" />
      case 'equipment': return <Truck className="w-4 h-4" />
      case 'subcontractor': return <Hammer className="w-4 h-4" />
      default: return null
    }
  }

  const getCategoryColor = (category: CostCode['category']) => {
    switch (category) {
      case 'labor': return 'bg-blue-100 text-blue-700'
      case 'material': return 'bg-green-100 text-green-700'
      case 'equipment': return 'bg-amber-100 text-amber-700'
      case 'subcontractor': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Cost Codes</h1>
          <p className="text-muted-foreground mt-1">
            Manage master cost code library used across all projects
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Cost Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Edit Cost Code' : 'Create Cost Code'}</DialogTitle>
              <DialogDescription>
                {editingCode ? 'Update cost code details' : 'Add a new cost code to the master library'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., 01-100"
                />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., General Labor"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: CostCode['category']) =>
                    setFormData({ ...formData, category: value })
                  }
                >
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
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingCode ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cost Code Library</CardTitle>
              <CardDescription>{filteredCodes.length} cost codes</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cost codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm || categoryFilter !== 'all'
                      ? 'No cost codes match your filters'
                      : 'No cost codes yet. Create your first one to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                    <TableCell>{code.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getCategoryColor(code.category)} flex items-center gap-1 w-fit`}>
                        {getCategoryIcon(code.category)}
                        {code.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{code.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(code)}
                        >
                          <PencilSimple className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(code.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{costCodes.filter(c => !c.projectId).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Labor Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{costCodes.filter(c => !c.projectId && c.category === 'labor').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Material Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{costCodes.filter(c => !c.projectId && c.category === 'material').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipment Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{costCodes.filter(c => !c.projectId && c.category === 'equipment').length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
