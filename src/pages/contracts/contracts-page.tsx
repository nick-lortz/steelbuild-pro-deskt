import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, FileText, PencilSimple, Trash } from '@phosphor-icons/react'
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
import type { Contract } from '@/lib/types'

export function ContractsPage() {
  const { projectId } = useParams()
  const [contracts, setContracts] = useKV<Contract[]>(`contracts-${projectId}`, [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState({
    contractNumber: '',
    title: '',
    contractType: 'lump-sum' as Contract['contractType'],
    value: '',
    signedDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    completionDate: '',
    retainage: '10',
    terms: '',
  })

  const totalValue = contracts?.reduce((sum, c) => sum + c.value, 0) || 0

  const handleCreate = () => {
    if (!formData.contractNumber || !formData.title || !formData.value || !formData.signedDate) {
      toast.error('Please fill in required fields')
      return
    }

    const newContract: Contract = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      contractNumber: formData.contractNumber,
      title: formData.title,
      contractType: formData.contractType,
      value: parseFloat(formData.value),
      signedDate: formData.signedDate,
      startDate: formData.startDate,
      completionDate: formData.completionDate || undefined,
      retainage: parseFloat(formData.retainage),
      terms: formData.terms || undefined,
      createdAt: new Date().toISOString(),
    }

    setContracts(current => [...(current || []), newContract])
    setIsCreateOpen(false)
    setFormData({
      contractNumber: '',
      title: '',
      contractType: 'lump-sum',
      value: '',
      signedDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      completionDate: '',
      retainage: '10',
      terms: '',
    })
    toast.success('Contract created')
  }

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      contractNumber: contract.contractNumber,
      title: contract.title,
      contractType: contract.contractType,
      value: contract.value.toString(),
      signedDate: contract.signedDate,
      startDate: contract.startDate,
      completionDate: contract.completionDate || '',
      retainage: contract.retainage.toString(),
      terms: contract.terms || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!formData.contractNumber || !formData.title || !formData.value || !editingContract) {
      toast.error('Please fill in required fields')
      return
    }

    setContracts(current =>
      (current || []).map(contract =>
        contract.id === editingContract.id
          ? {
              ...contract,
              contractNumber: formData.contractNumber,
              title: formData.title,
              contractType: formData.contractType,
              value: parseFloat(formData.value),
              signedDate: formData.signedDate,
              startDate: formData.startDate,
              completionDate: formData.completionDate || undefined,
              retainage: parseFloat(formData.retainage),
              terms: formData.terms || undefined,
            }
          : contract
      )
    )
    setIsEditOpen(false)
    setEditingContract(null)
    setFormData({
      contractNumber: '',
      title: '',
      contractType: 'lump-sum',
      value: '',
      signedDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      completionDate: '',
      retainage: '10',
      terms: '',
    })
    toast.success('Contract updated')
  }

  const handleDelete = (contractId: string) => {
    setContracts(current => (current || []).filter(c => c.id !== contractId))
    toast.success('Contract deleted')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Contracts</h2>
            <p className="text-muted-foreground">Project contracts and agreements</p>
          </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Contract</DialogTitle>
              <DialogDescription>Add a new contract to this project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract-num">Contract Number</Label>
                  <Input
                    id="contract-num"
                    value={formData.contractNumber}
                    onChange={e => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                    placeholder="C-001"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.contractType} onValueChange={v => setFormData(prev => ({ ...prev, contractType: v as Contract['contractType'] }))}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lump-sum">Lump Sum</SelectItem>
                      <SelectItem value="unit-price">Unit Price</SelectItem>
                      <SelectItem value="cost-plus">Cost Plus</SelectItem>
                      <SelectItem value="time-and-materials">Time & Materials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contract title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Contract Value</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="1000000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="retainage">Retainage (%)</Label>
                  <Input
                    id="retainage"
                    type="number"
                    step="0.1"
                    value={formData.retainage}
                    onChange={e => setFormData(prev => ({ ...prev, retainage: e.target.value }))}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="signed">Signed Date</Label>
                  <Input
                    id="signed"
                    type="date"
                    value={formData.signedDate}
                    onChange={e => setFormData(prev => ({ ...prev, signedDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="completion">Completion</Label>
                  <Input
                    id="completion"
                    type="date"
                    value={formData.completionDate}
                    onChange={e => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="terms">Terms (Optional)</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={e => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Contract terms and conditions..."
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Contract</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active contracts</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
            <FileText className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Combined value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
          <CardDescription>All contracts for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {!contracts || contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No contracts yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2" />
                Create First Contract
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>Retainage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map(contract => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                    <TableCell>{contract.title}</TableCell>
                    <TableCell className="capitalize">{contract.contractType.replace('-', ' ')}</TableCell>
                    <TableCell className="text-right font-medium">${contract.value.toLocaleString()}</TableCell>
                    <TableCell>{new Date(contract.signedDate).toLocaleDateString()}</TableCell>
                    <TableCell>{contract.retainage}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(contract)}>
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
                              <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(contract.id)}>Delete</AlertDialogAction>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>Update contract details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-contract-num">Contract Number</Label>
                <Input
                  id="edit-contract-num"
                  value={formData.contractNumber}
                  onChange={e => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={formData.contractType} onValueChange={v => setFormData(prev => ({ ...prev, contractType: v as Contract['contractType'] }))}>
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lump-sum">Lump Sum</SelectItem>
                    <SelectItem value="unit-price">Unit Price</SelectItem>
                    <SelectItem value="cost-plus">Cost Plus</SelectItem>
                    <SelectItem value="time-and-materials">Time & Materials</SelectItem>
                  </SelectContent>
                </Select>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-value">Contract Value</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-retainage">Retainage (%)</Label>
                <Input
                  id="edit-retainage"
                  type="number"
                  step="0.1"
                  value={formData.retainage}
                  onChange={e => setFormData(prev => ({ ...prev, retainage: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-signed">Signed Date</Label>
                <Input
                  id="edit-signed"
                  type="date"
                  value={formData.signedDate}
                  onChange={e => setFormData(prev => ({ ...prev, signedDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-start">Start Date</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-completion">Completion</Label>
                <Input
                  id="edit-completion"
                  type="date"
                  value={formData.completionDate}
                  onChange={e => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-terms">Terms</Label>
              <Textarea
                id="edit-terms"
                value={formData.terms}
                onChange={e => setFormData(prev => ({ ...prev, terms: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">Update Contract</Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
