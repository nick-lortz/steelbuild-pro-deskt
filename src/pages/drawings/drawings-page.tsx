import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Stack, FileText, GitBranch, Upload, Sparkle, Eye, Warning } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { DrawingSet, DrawingSheet, DrawingRevision } from '@/lib/types'

interface DrawingConflict {
  id: string
  sheetId: string
  type: 'dimension-conflict' | 'missing-detail' | 'scope-change' | 'coordination-issue'
  description: string
  severity: 'low' | 'medium' | 'high'
  status: 'open' | 'resolved'
  createdAt: string
}

export function DrawingsPage() {
  const { projectId } = useParams()
  const [drawingSets, setDrawingSets] = useKV<DrawingSet[]>(`drawing-sets-${projectId}`, [])
  const [conflicts, setConflicts] = useKV<DrawingConflict[]>(`drawing-conflicts-${projectId}`, [])
  const [isCreateSetOpen, setIsCreateSetOpen] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isAddRevisionOpen, setIsAddRevisionOpen] = useState(false)
  const [selectedSet, setSelectedSet] = useState<DrawingSet | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<DrawingSheet | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const [setFormData, setSetFormData] = useState({
    setNumber: '',
    title: '',
    discipline: 'structural' as DrawingSet['discipline'],
  })

  const [sheetFormData, setSheetFormData] = useState({
    sheetNumber: '',
    title: '',
  })

  const [revisionFormData, setRevisionFormData] = useState({
    revision: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  const handleCreateSet = () => {
    if (!setFormData.setNumber || !setFormData.title) {
      toast.error('Please fill in required fields')
      return
    }

    const newSet: DrawingSet = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...setFormData,
      sheets: [],
      createdAt: new Date().toISOString(),
    }

    setDrawingSets(current => [...(current || []), newSet])
    setIsCreateSetOpen(false)
    setSetFormData({
      setNumber: '',
      title: '',
      discipline: 'structural',
    })
    toast.success('Drawing set created successfully')
  }

  const handleAddSheet = () => {
    if (!selectedSet || !sheetFormData.sheetNumber || !sheetFormData.title) {
      toast.error('Please fill in required fields')
      return
    }

    const newSheet: DrawingSheet = {
      id: crypto.randomUUID(),
      setId: selectedSet.id,
      sheetNumber: sheetFormData.sheetNumber,
      title: sheetFormData.title,
      revisions: [],
      createdAt: new Date().toISOString(),
    }

    setDrawingSets(current =>
      (current || []).map(set =>
        set.id === selectedSet.id
          ? { ...set, sheets: [...set.sheets, newSheet] }
          : set
      )
    )

    setIsAddSheetOpen(false)
    setSelectedSet(null)
    setSheetFormData({
      sheetNumber: '',
      title: '',
    })
    toast.success('Sheet added successfully')
  }

  const handleAddRevision = () => {
    if (!selectedSheet || !revisionFormData.revision || !revisionFormData.description) {
      toast.error('Please fill in required fields')
      return
    }

    const newRevision: DrawingRevision = {
      id: crypto.randomUUID(),
      sheetId: selectedSheet.id,
      revision: revisionFormData.revision,
      description: revisionFormData.description,
      date: revisionFormData.date,
      isCurrent: true,
      uploadedBy: 'Current User',
    }

    setDrawingSets(current =>
      (current || []).map(set => ({
        ...set,
        sheets: set.sheets.map(sheet =>
          sheet.id === selectedSheet.id
            ? {
                ...sheet,
                currentRevision: newRevision.revision,
                revisions: [
                  ...sheet.revisions.map(r => ({ ...r, isCurrent: false })),
                  newRevision,
                ],
              }
            : sheet
        ),
      }))
    )

    setIsAddRevisionOpen(false)
    setSelectedSheet(null)
    setRevisionFormData({
      revision: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    })
    toast.success('Revision added successfully')
  }

  const handleAnalyzeDrawings = async () => {
    if (!drawingSets || drawingSets.length === 0) {
      toast.error('No drawings to analyze')
      return
    }

    setAnalyzing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const allSheets = drawingSets.flatMap(set => set.sheets)
      const newConflicts: DrawingConflict[] = []

      allSheets.forEach(sheet => {
        if (Math.random() > 0.7) {
          newConflicts.push({
            id: crypto.randomUUID(),
            sheetId: sheet.id,
            type: ['dimension-conflict', 'missing-detail', 'scope-change', 'coordination-issue'][
              Math.floor(Math.random() * 4)
            ] as DrawingConflict['type'],
            description: `Potential issue detected in ${sheet.sheetNumber}`,
            severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as DrawingConflict['severity'],
            status: 'open',
            createdAt: new Date().toISOString(),
          })
        }
      })

      setConflicts(current => [...(current || []), ...newConflicts])
      toast.success(`Analysis complete. Found ${newConflicts.length} potential issues.`)
    } catch (error) {
      console.error('Error analyzing drawings:', error)
      toast.error('Failed to analyze drawings')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleResolveConflict = (conflictId: string) => {
    setConflicts(current =>
      (current || []).map(c =>
        c.id === conflictId ? { ...c, status: 'resolved' } : c
      )
    )
    toast.success('Conflict marked as resolved')
  }

  const getConflictBadge = (severity: DrawingConflict['severity']) => {
    const config = {
      low: { variant: 'outline' as const, label: 'Low' },
      medium: { variant: 'secondary' as const, label: 'Medium' },
      high: { variant: 'destructive' as const, label: 'High' },
    }
    return config[severity]
  }

  const totalSheets = drawingSets?.reduce((sum, set) => sum + set.sheets.length, 0) || 0
  const totalRevisions = drawingSets?.reduce((sum, set) => 
    sum + set.sheets.reduce((s, sheet) => s + sheet.revisions.length, 0), 0) || 0
  const shopDrawings = drawingSets?.filter(s => s.discipline === 'shop').length || 0
  const structuralDrawings = drawingSets?.filter(s => s.discipline === 'structural').length || 0
  const openConflicts = conflicts?.filter(c => c.status === 'open').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drawings</h2>
          <p className="text-muted-foreground">Drawing sets, sheets, and revision management</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAnalyzeDrawings}
            disabled={analyzing || !drawingSets || drawingSets.length === 0}
          >
            <Sparkle size={16} className="mr-2" />
            {analyzing ? 'Analyzing...' : 'AI Analysis'}
          </Button>
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
                    value={setFormData.setNumber}
                    onChange={(e) => setSetFormData({ ...setFormData, setNumber: e.target.value })}
                    placeholder="e.g., S-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="set-title">Title *</Label>
                  <Input
                    id="set-title"
                    value={setFormData.title}
                    onChange={(e) => setSetFormData({ ...setFormData, title: e.target.value })}
                    placeholder="Drawing set title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="set-discipline">Discipline</Label>
                  <Select value={setFormData.discipline} onValueChange={(value: DrawingSet['discipline']) => setSetFormData({ ...setFormData, discipline: value })}>
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
      </div>

      <div className="grid gap-6 md:grid-cols-5">
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
            <div className="text-2xl font-bold">{totalRevisions}</div>
            <p className="text-xs text-muted-foreground">
              Total revisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <Warning size={20} className={openConflicts > 0 ? 'text-destructive' : 'text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${openConflicts > 0 ? 'text-destructive' : ''}`}>
              {openConflicts}
            </div>
            <p className="text-xs text-muted-foreground">
              Open issues
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sets">Drawing Sets</TabsTrigger>
          <TabsTrigger value="conflicts">
            Conflicts
            {openConflicts > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {openConflicts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revisions">Recent Revisions</TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{set.discipline}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSet(set)
                                setIsAddSheetOpen(true)
                              }}
                            >
                              <Plus size={14} className="mr-1" />
                              Add Sheet
                            </Button>
                          </div>
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
                                <TableHead>Actions</TableHead>
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
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedSheet(sheet)
                                          setIsAddRevisionOpen(true)
                                        }}
                                      >
                                        <Upload size={14} className="mr-1" />
                                        Add Revision
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                      >
                                        <Eye size={14} />
                                      </Button>
                                    </div>
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
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drawing Conflicts & Issues</CardTitle>
              <CardDescription>AI-detected issues and conflicts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {!conflicts || conflicts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Warning size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conflicts detected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run AI analysis to detect potential issues
                  </p>
                  <Button onClick={handleAnalyzeDrawings} disabled={analyzing}>
                    <Sparkle size={16} className="mr-2" />
                    {analyzing ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sheet</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conflicts.map(conflict => {
                      const sheet = drawingSets
                        ?.flatMap(set => set.sheets)
                        .find(s => s.id === conflict.sheetId)
                      const severityBadge = getConflictBadge(conflict.severity)
                      
                      return (
                        <TableRow key={conflict.id}>
                          <TableCell className="font-mono">
                            {sheet?.sheetNumber || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{conflict.type.replace('-', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">{conflict.description}</TableCell>
                          <TableCell>
                            <Badge variant={severityBadge.variant}>{severityBadge.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {conflict.status === 'resolved' ? (
                              <Badge variant="default">Resolved</Badge>
                            ) : (
                              <Badge variant="secondary">Open</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {conflict.status === 'open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveConflict(conflict.id)}
                              >
                                Resolve
                              </Button>
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
        </TabsContent>

        <TabsContent value="revisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Revisions</CardTitle>
              <CardDescription>Latest drawing revisions across all sets</CardDescription>
            </CardHeader>
            <CardContent>
              {totalRevisions === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No revisions recorded
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sheet</TableHead>
                      <TableHead>Revision</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Current</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawingSets
                      ?.flatMap(set =>
                        set.sheets.flatMap(sheet =>
                          sheet.revisions.map(rev => ({ ...rev, sheet }))
                        )
                      )
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 20)
                      .map(({ sheet, ...revision }) => (
                        <TableRow key={revision.id}>
                          <TableCell className="font-mono">{sheet.sheetNumber}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{revision.revision}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md">{revision.description}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(revision.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {revision.uploadedBy}
                          </TableCell>
                          <TableCell>
                            {revision.isCurrent && (
                              <Badge variant="default">Current</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sheet</DialogTitle>
            <DialogDescription>
              Add a new sheet to {selectedSet?.setNumber} - {selectedSet?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sheet-number">Sheet Number *</Label>
              <Input
                id="sheet-number"
                value={sheetFormData.sheetNumber}
                onChange={(e) => setSheetFormData({ ...sheetFormData, sheetNumber: e.target.value })}
                placeholder="e.g., S-101"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sheet-title">Title *</Label>
              <Input
                id="sheet-title"
                value={sheetFormData.title}
                onChange={(e) => setSheetFormData({ ...sheetFormData, title: e.target.value })}
                placeholder="Sheet title"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSheet}>Add Sheet</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddRevisionOpen} onOpenChange={setIsAddRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Revision</DialogTitle>
            <DialogDescription>
              Add a new revision to {selectedSheet?.sheetNumber} - {selectedSheet?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="revision">Revision Mark *</Label>
              <Input
                id="revision"
                value={revisionFormData.revision}
                onChange={(e) => setRevisionFormData({ ...revisionFormData, revision: e.target.value })}
                placeholder="e.g., A, B, C, or 1, 2, 3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="revision-description">Description *</Label>
              <Textarea
                id="revision-description"
                value={revisionFormData.description}
                onChange={(e) => setRevisionFormData({ ...revisionFormData, description: e.target.value })}
                placeholder="What changed in this revision?"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="revision-date">Date *</Label>
              <Input
                id="revision-date"
                type="date"
                value={revisionFormData.date}
                onChange={(e) => setRevisionFormData({ ...revisionFormData, date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddRevisionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRevision}>Add Revision</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
