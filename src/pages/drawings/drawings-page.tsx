import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Stack, FileText, GitBranch } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { DrawingSet, DrawingSheet } from '@/lib/types'

export function DrawingsPage() {
  const { projectId } = useParams()
  const [drawingSets, setDrawingSets] = useKV<DrawingSet[]>(`drawing-sets-${projectId}`, [])
  const [isCreateSetOpen, setIsCreateSetOpen] = useState(false)
  const [formData, setFormData] = useState({
    setNumber: '',
    title: '',
    discipline: 'structural' as DrawingSet['discipline'],
  })

  const handleCreateSet = () => {
    if (!formData.setNumber || !formData.title) {
      toast.error('Please fill in required fields')
      return
    }

    const newSet: DrawingSet = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...formData,
      sheets: [],
      createdAt: new Date().toISOString(),
    }

    setDrawingSets(current => [...(current || []), newSet])
    setIsCreateSetOpen(false)
    setFormData({
      setNumber: '',
      title: '',
      discipline: 'structural',
    })
    toast.success('Drawing set created successfully')
  }

  const totalSheets = drawingSets?.reduce((sum, set) => sum + set.sheets.length, 0) || 0
  const shopDrawings = drawingSets?.filter(s => s.discipline === 'shop').length || 0
  const structuralDrawings = drawingSets?.filter(s => s.discipline === 'structural').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drawings</h2>
          <p className="text-muted-foreground">Drawing sets and revision management</p>
        </div>
        <Dialog open={isCreateSetOpen} onOpenChange={setIsCreateSetOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Drawing Set
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Drawing Set</DialogTitle>
              <DialogDescription>Add a new drawing set to the project</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="set-number">Set Number *</Label>
                <Input
                  id="set-number"
                  value={formData.setNumber}
                  onChange={(e) => setFormData({ ...formData, setNumber: e.target.value })}
                  placeholder="e.g., S-100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="set-title">Title *</Label>
                <Input
                  id="set-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Drawing set title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="set-discipline">Discipline</Label>
                <Select value={formData.discipline} onValueChange={(value: DrawingSet['discipline']) => setFormData({ ...formData, discipline: value })}>
                  <SelectTrigger id="set-discipline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="architectural">Architectural</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="shop">Shop Drawings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateSetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSet}>Create Set</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drawing Sets</CardTitle>
            <Stack size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drawingSets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {totalSheets} total sheets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop Drawings</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shopDrawings}</div>
            <p className="text-xs text-muted-foreground">
              Fabrication drawings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Structural</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structuralDrawings}</div>
            <p className="text-xs text-muted-foreground">
              Structural sets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisions</CardTitle>
            <GitBranch size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drawingSets?.reduce((sum, set) => 
                sum + set.sheets.reduce((s, sheet) => s + sheet.revisions.length, 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total revisions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drawing Sets</CardTitle>
          <CardDescription>All drawing sets organized by discipline</CardDescription>
        </CardHeader>
        <CardContent>
          {!drawingSets || drawingSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Stack size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drawing sets</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first drawing set to organize project drawings
              </p>
              <Button onClick={() => setIsCreateSetOpen(true)}>
                <Plus size={16} className="mr-2" />
                Create Drawing Set
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {drawingSets.map((set) => (
                <AccordionItem key={set.id} value={set.id}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <Stack size={20} />
                        <div className="text-left">
                          <div className="font-semibold">{set.setNumber} - {set.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {set.discipline} • {set.sheets.length} sheets
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{set.discipline}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {set.sheets.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No sheets in this set
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sheet Number</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Current Revision</TableHead>
                            <TableHead>Revisions</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {set.sheets.map((sheet) => (
                            <TableRow key={sheet.id}>
                              <TableCell className="font-mono">{sheet.sheetNumber}</TableCell>
                              <TableCell>{sheet.title}</TableCell>
                              <TableCell>
                                {sheet.currentRevision ? (
                                  <Badge variant="secondary">{sheet.currentRevision}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>{sheet.revisions.length}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(sheet.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
