import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Note, 
  Calendar, 
  Wrench, 
  CheckCircle, 
  Warning, 
  PencilSimple, 
  Trash,
  Download,
  ClipboardText
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface WeeklyProductionNote {
  id: string
  projectId: string
  weekEnding: string
  category: 'accomplishments' | 'upcoming' | 'issues' | 'safety' | 'quality' | 'coordination'
  item: string
  details: string
  impact: 'positive' | 'neutral' | 'negative'
  status: 'open' | 'in-progress' | 'resolved'
  owner?: string
  followUp?: string
  createdAt: string
  updatedAt: string
}

export function WeeklyProductionNotes() {
  const { projectId } = useParams<{ projectId: string }>()
  const [notes, setNotes] = useKV<WeeklyProductionNote[]>('weekly-production-notes', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<WeeklyProductionNote | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string>(getWeekEnding(new Date()))
  const [activeTab, setActiveTab] = useState<string>('all')

  const projectNotes = notes
    .filter(n => n.projectId === projectId)
    .filter(n => n.weekEnding === selectedWeek || selectedWeek === 'all')
    .sort((a, b) => new Date(b.weekEnding).getTime() - new Date(a.weekEnding).getTime())

  const filteredNotes = activeTab === 'all' 
    ? projectNotes 
    : projectNotes.filter(n => n.category === activeTab)

  const getCategoryIcon = (category: WeeklyProductionNote['category']) => {
    const icons = {
      accomplishments: <CheckCircle size={20} className="text-green-600" weight="duotone" />,
      upcoming: <Calendar size={20} className="text-blue-600" weight="duotone" />,
      issues: <Warning size={20} className="text-amber-600" weight="duotone" />,
      safety: <Warning size={20} className="text-red-600" weight="duotone" />,
      quality: <CheckCircle size={20} className="text-purple-600" weight="duotone" />,
      coordination: <Note size={20} className="text-indigo-600" weight="duotone" />,
    }
    return icons[category] || icons.accomplishments
  }

  const getCategoryColor = (category: WeeklyProductionNote['category']) => {
    const colors = {
      accomplishments: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      issues: 'bg-amber-100 text-amber-800',
      safety: 'bg-red-100 text-red-800',
      quality: 'bg-purple-100 text-purple-800',
      coordination: 'bg-indigo-100 text-indigo-800',
    }
    return colors[category]
  }

  const getImpactColor = (impact: WeeklyProductionNote['impact']) => {
    const colors = {
      positive: 'bg-green-50 text-green-700',
      neutral: 'bg-gray-50 text-gray-700',
      negative: 'bg-red-50 text-red-700',
    }
    return colors[impact]
  }

  const getStatusColor = (status: WeeklyProductionNote['status']) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-amber-100 text-amber-800',
      resolved: 'bg-green-100 text-green-800',
    }
    return colors[status]
  }

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const noteData = {
      weekEnding: formData.get('weekEnding') as string,
      category: formData.get('category') as WeeklyProductionNote['category'],
      item: formData.get('item') as string,
      details: formData.get('details') as string,
      impact: formData.get('impact') as WeeklyProductionNote['impact'],
      status: formData.get('status') as WeeklyProductionNote['status'],
      owner: formData.get('owner') as string || undefined,
      followUp: formData.get('followUp') as string || undefined,
    }

    if (editingNote) {
      setNotes(current => current.map(n =>
        n.id === editingNote.id
          ? { ...n, ...noteData, updatedAt: new Date().toISOString() }
          : n
      ))
      toast.success('Production note updated')
    } else {
      const newNote: WeeklyProductionNote = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...noteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setNotes(current => [...current, newNote])
      toast.success('Production note created')
    }

    setIsDialogOpen(false)
    setEditingNote(null)
    e.currentTarget.reset()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(current => current.filter(n => n.id !== id))
      toast.success('Note deleted')
    }
  }

  const handleExportWeekly = () => {
    const weekNotes = projectNotes.filter(n => n.weekEnding === selectedWeek)
    const grouped = {
      accomplishments: weekNotes.filter(n => n.category === 'accomplishments'),
      upcoming: weekNotes.filter(n => n.category === 'upcoming'),
      issues: weekNotes.filter(n => n.category === 'issues'),
      safety: weekNotes.filter(n => n.category === 'safety'),
      quality: weekNotes.filter(n => n.category === 'quality'),
      coordination: weekNotes.filter(n => n.category === 'coordination'),
    }

    let report = `WEEKLY PRODUCTION MEETING NOTES\n`
    report += `Week Ending: ${new Date(selectedWeek).toLocaleDateString()}\n`
    report += `Project ID: ${projectId}\n\n`
    report += `=`.repeat(60) + '\n\n'

    Object.entries(grouped).forEach(([category, items]) => {
      if (items.length > 0) {
        report += `${category.toUpperCase().replace('_', ' ')}\n`
        report += `-`.repeat(40) + '\n'
        items.forEach((item, idx) => {
          report += `${idx + 1}. ${item.item}\n`
          report += `   ${item.details}\n`
          if (item.owner) report += `   Owner: ${item.owner}\n`
          if (item.followUp) report += `   Follow-up: ${item.followUp}\n`
          report += `   Status: ${item.status} | Impact: ${item.impact}\n\n`
        })
        report += '\n'
      }
    })

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `production-notes-${selectedWeek}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Notes exported')
  }

  const uniqueWeeks = Array.from(new Set(projectNotes.map(n => n.weekEnding))).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  const categoryStats = {
    accomplishments: filteredNotes.filter(n => n.category === 'accomplishments').length,
    upcoming: filteredNotes.filter(n => n.category === 'upcoming').length,
    issues: filteredNotes.filter(n => n.category === 'issues').length,
    safety: filteredNotes.filter(n => n.category === 'safety').length,
    quality: filteredNotes.filter(n => n.category === 'quality').length,
    coordination: filteredNotes.filter(n => n.category === 'coordination').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Production Notes</h1>
          <p className="text-muted-foreground">
            Track key discussion points for weekly production meetings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportWeekly} disabled={filteredNotes.length === 0}>
            <Download className="mr-2" />
            Export Week
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingNote(null)}>
                <Plus className="mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNote ? 'Edit' : 'Add'} Production Note</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weekEnding">Week Ending *</Label>
                    <Input
                      id="weekEnding"
                      name="weekEnding"
                      type="date"
                      defaultValue={editingNote?.weekEnding || getWeekEnding(new Date())}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" defaultValue={editingNote?.category || 'accomplishments'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accomplishments">✅ Accomplishments</SelectItem>
                        <SelectItem value="upcoming">📅 Upcoming Work</SelectItem>
                        <SelectItem value="issues">⚠️ Issues</SelectItem>
                        <SelectItem value="safety">🚨 Safety</SelectItem>
                        <SelectItem value="quality">⭐ Quality</SelectItem>
                        <SelectItem value="coordination">🤝 Coordination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item">Item Summary *</Label>
                  <Input
                    id="item"
                    name="item"
                    defaultValue={editingNote?.item}
                    placeholder="e.g., Completed grid 4A steel erection"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Details *</Label>
                  <Textarea
                    id="details"
                    name="details"
                    defaultValue={editingNote?.details}
                    placeholder="Full description of the item..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="impact">Impact *</Label>
                    <Select name="impact" defaultValue={editingNote?.impact || 'neutral'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select name="status" defaultValue={editingNote?.status || 'open'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner">Owner</Label>
                    <Input
                      id="owner"
                      name="owner"
                      defaultValue={editingNote?.owner}
                      placeholder="Responsible person"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followUp">Follow-up Action</Label>
                  <Textarea
                    id="followUp"
                    name="followUp"
                    defaultValue={editingNote?.followUp}
                    placeholder="What needs to happen next?"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingNote ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Object.entries(categoryStats).map(([category, count]) => (
          <Card key={category}>
            <CardContent className="pt-6 flex items-center gap-3">
              {getCategoryIcon(category as WeeklyProductionNote['category'])}
              <div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {category.replace('_', ' ')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Production Notes</CardTitle>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                {uniqueWeeks.map(week => (
                  <SelectItem key={week} value={week}>
                    Week of {new Date(week).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="accomplishments">Accomplishments</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="coordination">Coordination</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardText className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                  <h3 className="text-lg font-semibold mb-2">No production notes</h3>
                  <p className="text-muted-foreground">Add notes to track for weekly meetings</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Impact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotes.map((note) => (
                        <TableRow key={note.id} className="hover:bg-accent/50 group">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(note.weekEnding).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(note.category)}>
                              {note.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate" title={note.item}>
                            {note.item}
                          </TableCell>
                          <TableCell className="max-w-md truncate text-sm text-muted-foreground" title={note.details}>
                            {note.details}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getImpactColor(note.impact)}>
                              {note.impact}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(note.status)}>
                              {note.status.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {note.owner || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingNote(note)
                                  setIsDialogOpen(true)
                                }}
                              >
                                <PencilSimple size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(note.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function getWeekEnding(date: Date): string {
  const day = date.getDay()
  const diff = (day === 0 ? 0 : 7 - day)
  const friday = new Date(date)
  friday.setDate(date.getDate() + diff - 2)
  return friday.toISOString().split('T')[0]
}
