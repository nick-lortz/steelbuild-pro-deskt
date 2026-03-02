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
import { Plus, Search, Calendar, AlertCircle, CheckCircle, Clock, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Submittal } from '@/lib/types'

export function SubmittalsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [submittals, setSubmittals] = useKV<Submittal[]>('submittals', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubmittal, setEditingSubmittal] = useState<Submittal | null>(null)

  const projectSubmittals = submittals.filter(s => s.projectId === projectId)

  const filteredSubmittals = projectSubmittals.filter(submittal => {
    const matchesSearch = submittal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submittal.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submittal.specSection.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || submittal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const submittalData = {
      number: formData.get('number') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      specSection: formData.get('specSection') as string,
      type: formData.get('type') as Submittal['type'],
      status: formData.get('status') as Submittal['status'],
      priority: formData.get('priority') as Submittal['priority'],
      submittedTo: formData.get('submittedTo') as string,
      requiredDate: formData.get('requiredDate') as string,
      ballInCourt: formData.get('ballInCourt') as Submittal['ballInCourt'],
    }

    if (editingSubmittal) {
      setSubmittals(current => current.map(s =>
        s.id === editingSubmittal.id
          ? {
              ...s,
              ...submittalData,
              daysOutstanding: calculateDaysOutstanding(s.submittedDate, submittalData.status),
              updatedAt: new Date().toISOString(),
            }
          : s
      ))
      toast.success('Submittal updated successfully')
    } else {
      const newSubmittal: Submittal = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...submittalData,
        daysOutstanding: 0,
        relatedDrawings: [],
        relatedCostCodes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setSubmittals(current => [...current, newSubmittal])
      toast.success('Submittal created successfully')
    }

    setIsDialogOpen(false)
    setEditingSubmittal(null)
    e.currentTarget.reset()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this submittal?')) {
      setSubmittals(current => current.filter(s => s.id !== id))
      toast.success('Submittal deleted')
    }
  }

  const calculateDaysOutstanding = (submittedDate?: string, status?: string) => {
    if (!submittedDate || status === 'approved' || status === 'rejected' || status === 'approved-as-noted') {
      return 0
    }
    const submitted = new Date(submittedDate)
    const now = new Date()
    return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getStatusIcon = (status: Submittal['status']) => {
    switch (status) {
      case 'approved':
      case 'approved-as-noted':
        return <CheckCircle className="text-green-600" />
      case 'rejected':
        return <XCircle className="text-red-600" />
      case 'submitted':
        return <Clock className="text-blue-600" />
      case 'returned':
        return <AlertCircle className="text-yellow-600" />
      default:
        return <Calendar className="text-gray-600" />
    }
  }

  const getStatusColor = (status: Submittal['status']) => {
    switch (status) {
      case 'approved':
      case 'approved-as-noted':
      case 'FFF':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'IFA':
      case 'BFA':
        return 'bg-purple-100 text-purple-800'
      case 'OFS':
      case 'BFS':
        return 'bg-cyan-100 text-cyan-800'
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'returned':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Submittal['priority']) => {
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

  const stats = {
    total: projectSubmittals.length,
    submitted: projectSubmittals.filter(s => s.status === 'submitted').length,
    approved: projectSubmittals.filter(s => s.status === 'approved' || s.status === 'approved-as-noted').length,
    outstanding: projectSubmittals.filter(s => s.status === 'submitted' || s.status === 'returned').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submittals</h1>
          <p className="text-muted-foreground">Track and manage project submittals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSubmittal(null)}>
              <Plus className="mr-2" />
              New Submittal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSubmittal ? 'Edit Submittal' : 'Create New Submittal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Submittal Number *</Label>
                  <Input
                    id="number"
                    name="number"
                    defaultValue={editingSubmittal?.number}
                    required
                    placeholder="SM-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specSection">Spec Section *</Label>
                  <Input
                    id="specSection"
                    name="specSection"
                    defaultValue={editingSubmittal?.specSection}
                    required
                    placeholder="05 12 00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingSubmittal?.title}
                  required
                  placeholder="Structural Steel Shop Drawings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingSubmittal?.description}
                  placeholder="Detailed description of the submittal"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" defaultValue={editingSubmittal?.type || 'shop-drawing'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shop-drawing">Shop Drawing</SelectItem>
                      <SelectItem value="product-data">Product Data</SelectItem>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="design-data">Design Data</SelectItem>
                      <SelectItem value="test-report">Test Report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={editingSubmittal?.status || 'draft'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="IFA">IFA - Issued for Approval</SelectItem>
                      <SelectItem value="BFA">BFA - Bulletined for Approval</SelectItem>
                      <SelectItem value="OFS">OFS - Okay for Submission</SelectItem>
                      <SelectItem value="BFS">BFS - Bulletined for Submission</SelectItem>
                      <SelectItem value="FFF">FFF - For Fabrication & Field</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="returned">Returned for Resubmission</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="approved-as-noted">Approved as Noted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select name="priority" defaultValue={editingSubmittal?.priority || 'medium'}>
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
                  <Label htmlFor="ballInCourt">Ball in Court *</Label>
                  <Select name="ballInCourt" defaultValue={editingSubmittal?.ballInCourt || 'contractor'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="architect">Architect</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submittedTo">Submitted To *</Label>
                  <Input
                    id="submittedTo"
                    name="submittedTo"
                    defaultValue={editingSubmittal?.submittedTo}
                    required
                    placeholder="Architect/Engineer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredDate">Required Date</Label>
                  <Input
                    id="requiredDate"
                    name="requiredDate"
                    type="date"
                    defaultValue={editingSubmittal?.requiredDate}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSubmittal ? 'Update' : 'Create'} Submittal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submittals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.outstanding}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search submittals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="IFA">IFA</SelectItem>
                <SelectItem value="BFA">BFA</SelectItem>
                <SelectItem value="OFS">OFS</SelectItem>
                <SelectItem value="BFS">BFS</SelectItem>
                <SelectItem value="FFF">FFF</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="approved-as-noted">Approved as Noted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmittals.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No submittals found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first submittal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmittals.map((submittal) => (
                <div
                  key={submittal.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(submittal.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{submittal.number}</span>
                      <Badge variant="outline" className={getStatusColor(submittal.status)}>
                        {submittal.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(submittal.priority)}>
                        {submittal.priority}
                      </Badge>
                      {submittal.daysOutstanding > 0 && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          {submittal.daysOutstanding}d outstanding
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground">{submittal.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Spec: {submittal.specSection}</span>
                      <span>•</span>
                      <span>Type: {submittal.type.replace('-', ' ')}</span>
                      <span>•</span>
                      <span>To: {submittal.submittedTo}</span>
                      <span>•</span>
                      <span>Ball in Court: {submittal.ballInCourt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSubmittal(submittal)
                        setIsDialogOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(submittal.id)}
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
