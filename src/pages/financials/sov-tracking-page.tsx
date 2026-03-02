import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Download, FileText, CheckCircle, Clock, XCircle, Sparkle } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { generateSOVFromCostCodes } from '@/lib/functions/sov-generation'
import type { SOVItem, SOVVersion, Budget, CostCode, Task, WorkPackage } from '@/lib/types'

export function SOVTrackingPage() {
  const { projectId } = useParams()
  const [sovVersions, setSOVVersions] = useKV<SOVVersion[]>(`sov-versions-${projectId}`, [])
  const [sovItems, setSOVItems] = useKV<SOVItem[]>(`sov-items-${projectId}`, [])
  const [budgets] = useKV<Budget[]>(`budgets-${projectId}`, [])
  const [costCodes] = useKV<CostCode[]>(`cost-codes-${projectId}`, [])
  const [tasks] = useKV<Task[]>(`tasks-${projectId}`, [])
  const [workPackages] = useKV<WorkPackage[]>(`work-packages-${projectId}`, [])
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  
  const [versionForm, setVersionForm] = useState({
    periodStart: '',
    periodEnd: '',
    status: 'draft' as SOVVersion['status'],
    notes: '',
  })

  const [itemForm, setItemForm] = useState({
    lineNumber: '',
    description: '',
    scheduledValue: '',
    workCompleted: '',
    materialsStored: '',
    retainage: '',
    costCodeId: '',
  })

  const activeVersion = sovVersions?.find(v => v.status === 'draft') || sovVersions?.[0]
  const currentVersionItems = sovItems?.filter(item => item.versionId === (selectedVersion || activeVersion?.id)) || []

  const calculateTotals = (items: SOVItem[]) => {
    return items.reduce((acc, item) => {
      acc.scheduledValue += item.scheduledValue
      acc.workCompleted += item.workCompleted
      acc.materialsStored += item.materialsStored
      acc.totalCompleted += item.totalCompleted
      acc.retainage += item.retainage
      acc.currentBilling += item.currentBilling
      acc.previouslyBilled += item.previouslyBilled
      acc.balance += item.balance
      return acc
    }, {
      scheduledValue: 0,
      workCompleted: 0,
      materialsStored: 0,
      totalCompleted: 0,
      retainage: 0,
      currentBilling: 0,
      previouslyBilled: 0,
      balance: 0,
    })
  }

  const totals = calculateTotals(currentVersionItems)
  const overallPercentComplete = totals.scheduledValue > 0 
    ? ((totals.totalCompleted / totals.scheduledValue) * 100).toFixed(2)
    : '0.00'

  const handleAutoGenerateSOV = async () => {
    if (!projectId) {
      toast.error('No project selected')
      return
    }

    if (!versionForm.periodStart || !versionForm.periodEnd) {
      toast.error('Please select period start and end dates')
      return
    }

    setGenerating(true)
    try {
      const sovData = await generateSOVFromCostCodes(
        {
          projectId,
          periodStart: versionForm.periodStart,
          periodEnd: versionForm.periodEnd,
          retainagePercent: 10,
          includeMaterialsStored: true,
        },
        budgets || [],
        costCodes || [],
        tasks || [],
        workPackages || []
      )

      const versionId = crypto.randomUUID()
      const newVersion: SOVVersion = {
        ...sovData.version,
        id: versionId,
        versionNumber: (sovVersions?.length || 0) + 1,
        createdAt: new Date().toISOString(),
      }

      const itemsWithIds = sovData.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        versionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      setSOVVersions(current => [...(current || []), newVersion])
      setSOVItems(current => [...(current || []), ...itemsWithIds])
      setSelectedVersion(versionId)

      toast.success(
        `SOV generated successfully: ${sovData.summary.itemCount} line items totaling $${sovData.summary.totalScheduledValue.toLocaleString()}`
      )
      setIsAutoGenerateOpen(false)
    } catch (error) {
      console.error('Failed to generate SOV:', error)
      toast.error('Failed to generate SOV')
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateVersion = () => {
    if (!versionForm.periodStart || !versionForm.periodEnd) {
      toast.error('Please fill in required fields')
      return
    }

    const newVersion: SOVVersion = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      versionNumber: (sovVersions?.length || 0) + 1,
      periodStart: versionForm.periodStart,
      periodEnd: versionForm.periodEnd,
      status: versionForm.status,
      notes: versionForm.notes,
      createdAt: new Date().toISOString(),
    }

    setSOVVersions(current => [...(current || []), newVersion])
    setIsVersionDialogOpen(false)
    setVersionForm({
      periodStart: '',
      periodEnd: '',
      status: 'draft',
      notes: '',
    })
    toast.success('SOV version created successfully')
  }

  const handleCreateItem = () => {
    if (!itemForm.description || !itemForm.scheduledValue) {
      toast.error('Please fill in required fields')
      return
    }

    if (!activeVersion) {
      toast.error('Please create an SOV version first')
      return
    }

    const scheduledValue = parseFloat(itemForm.scheduledValue)
    const workCompleted = parseFloat(itemForm.workCompleted || '0')
    const materialsStored = parseFloat(itemForm.materialsStored || '0')
    const retainageRate = parseFloat(itemForm.retainage || '0') / 100
    
    const totalCompleted = workCompleted + materialsStored
    const retainage = totalCompleted * retainageRate
    
    const previousItems = sovItems?.filter(
      item => item.versionId !== activeVersion.id && item.description === itemForm.description
    ) || []
    const previouslyBilled = previousItems.reduce((sum, item) => sum + item.currentBilling, 0)
    
    const currentBilling = totalCompleted - retainage - previouslyBilled
    const balance = scheduledValue - totalCompleted
    const percentComplete = scheduledValue > 0 ? (totalCompleted / scheduledValue) * 100 : 0

    const newItem: SOVItem = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      versionId: activeVersion.id,
      lineNumber: parseInt(itemForm.lineNumber || '1'),
      description: itemForm.description,
      scheduledValue,
      workCompleted,
      materialsStored,
      totalCompleted,
      percentComplete,
      retainage,
      previouslyBilled,
      currentBilling,
      balance,
      costCodeId: itemForm.costCodeId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setSOVItems(current => [...(current || []), newItem])
    setIsItemDialogOpen(false)
    setItemForm({
      lineNumber: '',
      description: '',
      scheduledValue: '',
      workCompleted: '',
      materialsStored: '',
      retainage: '',
      costCodeId: '',
    })
    toast.success('SOV line item added successfully')
  }

  const handleSubmitVersion = (versionId: string) => {
    setSOVVersions(current =>
      (current || []).map(v =>
        v.id === versionId
          ? {
              ...v,
              status: 'submitted',
              submittedDate: new Date().toISOString(),
              submittedBy: 'Current User',
            }
          : v
      )
    )
    toast.success('SOV submitted for approval')
  }

  const handleApproveVersion = (versionId: string) => {
    setSOVVersions(current =>
      (current || []).map(v =>
        v.id === versionId
          ? {
              ...v,
              status: 'approved',
              approvedDate: new Date().toISOString(),
              approvedBy: 'Current User',
            }
          : v
      )
    )
    toast.success('SOV approved')
  }

  const handleAutoGenerate = async () => {
    if (!versionForm.periodStart || !versionForm.periodEnd) {
      toast.error('Please set period start and end dates')
      return
    }

    if (!budgets || budgets.length === 0) {
      toast.error('No budget data available. Create budgets first.')
      return
    }

    setGenerating(true)
    try {
      const result = await generateSOVFromCostCodes(
        {
          projectId: projectId!,
          periodStart: versionForm.periodStart,
          periodEnd: versionForm.periodEnd,
          retainagePercent: 10,
          includeMaterialsStored: true,
        },
        budgets,
        costCodes || [],
        tasks || [],
        workPackages || []
      )

      const newVersionId = crypto.randomUUID()
      const newVersion: SOVVersion = {
        ...result.version,
        id: newVersionId,
        versionNumber: (sovVersions?.length || 0) + 1,
        createdAt: new Date().toISOString(),
      }

      const newItems: SOVItem[] = result.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        versionId: newVersionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      setSOVVersions(current => [...(current || []), newVersion])
      setSOVItems(current => [...(current || []), ...newItems])
      
      setIsAutoGenerateOpen(false)
      setIsVersionDialogOpen(false)
      toast.success(`Generated SOV with ${result.items.length} line items from cost codes`)
    } catch (error) {
      console.error('Error generating SOV:', error)
      toast.error('Failed to generate SOV')
    } finally {
      setGenerating(false)
    }
  }

  const getStatusBadge = (status: SOVVersion['status']) => {
    const config: Record<SOVVersion['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { variant: 'outline', icon: <Clock size={14} /> },
      submitted: { variant: 'secondary', icon: <FileText size={14} /> },
      approved: { variant: 'default', icon: <CheckCircle size={14} /> },
      rejected: { variant: 'destructive', icon: <XCircle size={14} /> },
    }
    return config[status]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-indigo-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Schedule of Values (SOV)</h2>
            <p className="text-muted-foreground">Track billing progress and payment applications</p>
          </div>
        <div className="flex gap-2">
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus size={16} className="mr-2" />
                Add Line Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add SOV Line Item</DialogTitle>
                <DialogDescription>Add a new line item to the current SOV version</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="item-line">Line Number *</Label>
                    <Input
                      id="item-line"
                      type="number"
                      value={itemForm.lineNumber}
                      onChange={(e) => setItemForm({ ...itemForm, lineNumber: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-costcode">Cost Code</Label>
                    <Select value={itemForm.costCodeId} onValueChange={(value) => setItemForm({ ...itemForm, costCodeId: value })}>
                      <SelectTrigger id="item-costcode">
                        <SelectValue placeholder="Select cost code" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgets?.map(budget => (
                          <SelectItem key={budget.costCodeId} value={budget.costCodeId}>
                            {budget.costCodeId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-description">Description *</Label>
                  <Textarea
                    id="item-description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Work item description"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="item-scheduled">Scheduled Value *</Label>
                    <Input
                      id="item-scheduled"
                      type="number"
                      step="0.01"
                      value={itemForm.scheduledValue}
                      onChange={(e) => setItemForm({ ...itemForm, scheduledValue: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-work">Work Completed</Label>
                    <Input
                      id="item-work"
                      type="number"
                      step="0.01"
                      value={itemForm.workCompleted}
                      onChange={(e) => setItemForm({ ...itemForm, workCompleted: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-materials">Materials Stored</Label>
                    <Input
                      id="item-materials"
                      type="number"
                      step="0.01"
                      value={itemForm.materialsStored}
                      onChange={(e) => setItemForm({ ...itemForm, materialsStored: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-retainage">Retainage (%)</Label>
                  <Input
                    id="item-retainage"
                    type="number"
                    step="0.1"
                    value={itemForm.retainage}
                    onChange={(e) => setItemForm({ ...itemForm, retainage: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateItem}>Add Item</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create SOV Version</DialogTitle>
                <DialogDescription>Start a new billing period schedule of values</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="version-start">Period Start *</Label>
                    <Input
                      id="version-start"
                      type="date"
                      value={versionForm.periodStart}
                      onChange={(e) => setVersionForm({ ...versionForm, periodStart: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="version-end">Period End *</Label>
                    <Input
                      id="version-end"
                      type="date"
                      value={versionForm.periodEnd}
                      onChange={(e) => setVersionForm({ ...versionForm, periodEnd: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="version-notes">Notes</Label>
                  <Textarea
                    id="version-notes"
                    value={versionForm.notes}
                    onChange={(e) => setVersionForm({ ...versionForm, notes: e.target.value })}
                    placeholder="Optional notes"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleAutoGenerate}
                  disabled={generating || !versionForm.periodStart || !versionForm.periodEnd}
                >
                  <Sparkle size={16} className="mr-2" />
                  {generating ? 'Generating...' : 'Auto-Generate from Cost Codes'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsVersionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVersion}>Create Version</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contract</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.scheduledValue)}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed to Date</CardTitle>
            <CheckCircle size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalCompleted)}</div>
            <p className="text-xs text-muted-foreground">
              {overallPercentComplete}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Billing</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.currentBilling)}</div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.balance)}</div>
            <p className="text-xs text-muted-foreground">
              To be billed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Period</TabsTrigger>
          <TabsTrigger value="versions">All Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {activeVersion && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Version {activeVersion.versionNumber}</CardTitle>
                    <CardDescription>
                      {new Date(activeVersion.periodStart).toLocaleDateString()} - {new Date(activeVersion.periodEnd).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadge(activeVersion.status).variant}>
                      <span className="mr-1">{getStatusBadge(activeVersion.status).icon}</span>
                      {activeVersion.status}
                    </Badge>
                    {activeVersion.status === 'draft' && (
                      <Button size="sm" onClick={() => handleSubmitVersion(activeVersion.id)}>
                        Submit for Approval
                      </Button>
                    )}
                    {activeVersion.status === 'submitted' && (
                      <Button size="sm" onClick={() => handleApproveVersion(activeVersion.id)}>
                        Approve
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Download size={16} className="mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentVersionItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText size={48} className="text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No line items</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start adding line items to this SOV version
                    </p>
                    <Button onClick={() => setIsItemDialogOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Add Line Item
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Cost Code</TableHead>
                          <TableHead className="text-right">Scheduled</TableHead>
                          <TableHead className="text-right">Work Done</TableHead>
                          <TableHead className="text-right">Materials</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">% Complete</TableHead>
                          <TableHead className="text-right">Retainage</TableHead>
                          <TableHead className="text-right">This Period</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentVersionItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.lineNumber}</TableCell>
                            <TableCell className="max-w-xs">{item.description}</TableCell>
                            <TableCell>
                              {item.costCodeId && (
                                <Badge variant="outline">{item.costCodeId}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(item.scheduledValue)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(item.workCompleted)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(item.materialsStored)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(item.totalCompleted)}</TableCell>
                            <TableCell className="text-right">{item.percentComplete.toFixed(1)}%</TableCell>
                            <TableCell className="text-right font-mono text-destructive">
                              ({formatCurrency(item.retainage)})
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-accent">
                              {formatCurrency(item.currentBilling)}
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(item.balance)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell colSpan={3}>TOTALS</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(totals.scheduledValue)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(totals.workCompleted)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(totals.materialsStored)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(totals.totalCompleted)}</TableCell>
                          <TableCell className="text-right">{overallPercentComplete}%</TableCell>
                          <TableCell className="text-right font-mono text-destructive">
                            ({formatCurrency(totals.retainage)})
                          </TableCell>
                          <TableCell className="text-right font-mono text-accent">
                            {formatCurrency(totals.currentBilling)}
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(totals.balance)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!activeVersion && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No SOV versions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first Schedule of Values version
                </p>
                <Button onClick={() => setIsVersionDialogOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  New Version
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SOV Version History</CardTitle>
              <CardDescription>All billing period versions</CardDescription>
            </CardHeader>
            <CardContent>
              {!sovVersions || sovVersions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No versions created</h3>
                  <p className="text-sm text-muted-foreground">
                    Start tracking SOV by creating a version
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sovVersions.map((version) => {
                      const versionItems = sovItems?.filter(item => item.versionId === version.id) || []
                      return (
                        <TableRow key={version.id}>
                          <TableCell className="font-medium">v{version.versionNumber}</TableCell>
                          <TableCell>
                            {new Date(version.periodStart).toLocaleDateString()} - {new Date(version.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(version.status).variant}>
                              <span className="mr-1">{getStatusBadge(version.status).icon}</span>
                              {version.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {version.submittedDate ? new Date(version.submittedDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {version.approvedDate ? new Date(version.approvedDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>{versionItems.length}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedVersion(version.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
