import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Package, CheckCircle, Clock, Warning } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { WorkPackage } from '@/lib/types'

export function WorkPackagesPage() {
  const { projectId } = useParams()
  const [packages, setPackages] = useKV<WorkPackage[]>(`work-packages-${projectId}`, [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    packageNumber: '',
    title: '',
    type: 'fabrication' as WorkPackage['type'],
    assignedCrew: '',
  })

  const handleCreate = () => {
    if (!formData.packageNumber || !formData.title) {
      toast.error('Please fill in required fields')
      return
    }

    const newPackage: WorkPackage = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...formData,
      status: 'planning',
      drawings: [],
      materials: [],
      createdAt: new Date().toISOString(),
    }

    setPackages(current => [...(current || []), newPackage])
    setIsCreateOpen(false)
    setFormData({
      packageNumber: '',
      title: '',
      type: 'fabrication',
      assignedCrew: '',
    })
    toast.success('Work package created successfully')
  }

  const getStatusBadge = (status: WorkPackage['status']) => {
    const variants: Record<WorkPackage['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      planning: { variant: 'outline', icon: <Clock size={14} /> },
      ready: { variant: 'default', icon: <CheckCircle size={14} /> },
      'in-progress': { variant: 'default', icon: <Clock size={14} /> },
      completed: { variant: 'secondary', icon: <CheckCircle size={14} /> },
    }
    return variants[status]
  }

  const readyPackages = packages?.filter(p => p.status === 'ready').length || 0
  const inProgressPackages = packages?.filter(p => p.status === 'in-progress').length || 0
  const completedPackages = packages?.filter(p => p.status === 'completed').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Work Packages</h2>
          <p className="text-muted-foreground">Fabrication and erection package management</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Work Package</DialogTitle>
              <DialogDescription>Create a new fabrication or erection package</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pkg-number">Package Number *</Label>
                <Input
                  id="pkg-number"
                  value={formData.packageNumber}
                  onChange={(e) => setFormData({ ...formData, packageNumber: e.target.value })}
                  placeholder="e.g., FAB-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pkg-title">Title *</Label>
                <Input
                  id="pkg-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Package description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pkg-type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: WorkPackage['type']) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="pkg-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fabrication">Fabrication</SelectItem>
                      <SelectItem value="erection">Erection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pkg-crew">Assigned Crew</Label>
                  <Input
                    id="pkg-crew"
                    value={formData.assignedCrew}
                    onChange={(e) => setFormData({ ...formData, assignedCrew: e.target.value })}
                    placeholder="Crew name"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Package</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {completedPackages} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <CheckCircle size={20} className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyPackages}</div>
            <p className="text-xs text-muted-foreground">
              Ready to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock size={20} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressPackages}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPackages}</div>
            <p className="text-xs text-muted-foreground">
              Finished packages
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Package List</CardTitle>
          <CardDescription>All work packages for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {!packages || packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No work packages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create work packages to organize fabrication and erection tasks
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={16} className="mr-2" />
                Create Package
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Crew</TableHead>
                  <TableHead>Drawings</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Dates</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => {
                  const statusBadge = getStatusBadge(pkg.status)
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-mono font-medium">{pkg.packageNumber}</TableCell>
                      <TableCell>{pkg.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pkg.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant} className="gap-1">
                          {statusBadge.icon}
                          {pkg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{pkg.assignedCrew || '-'}</TableCell>
                      <TableCell>{pkg.drawings.length}</TableCell>
                      <TableCell>{pkg.materials.length}</TableCell>
                      <TableCell>
                        {pkg.startDate ? (
                          <div className="text-sm">
                            {new Date(pkg.startDate).toLocaleDateString()}
                            {pkg.completionDate && ` - ${new Date(pkg.completionDate).toLocaleDateString()}`}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not scheduled</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
