import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  FunnelSimple, 
  MagnifyingGlass, 
  Warning, 
  CheckCircle,
  Clock,
  Hourglass,
  XCircle
} from '@phosphor-icons/react'
import type { ProductionNote } from '@/lib/types'
import { CreateNoteDialog } from './create-note-dialog'
import { NoteDetailPanel } from './note-detail-panel'
import { cn } from '@/lib/utils'

export function ProductionNotesDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const [notes, setNotes] = useKV<ProductionNote[]>('production-notes-v2', [])
  const [selectedNote, setSelectedNote] = useState<ProductionNote | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'status' | 'dueDate' | 'lastUpdated'>('newest')

  const projectNotes = useMemo(() => {
    return notes.filter(n => n.projectId === projectId)
  }, [notes, projectId])

  const filteredNotes = useMemo(() => {
    let filtered = projectNotes

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.body.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(note => note.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(note => note.priority === priorityFilter)
    }

    if (disciplineFilter !== 'all') {
      filtered = filtered.filter(note => note.discipline === disciplineFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(note => note.category === categoryFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'status':
          const statusOrder = { open: 0, in_progress: 1, waiting_on: 2, resolved: 3, closed: 4 }
          return statusOrder[a.status] - statusOrder[b.status]
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'lastUpdated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [projectNotes, searchQuery, statusFilter, priorityFilter, disciplineFilter, categoryFilter, sortBy])

  const kpis = useMemo(() => {
    const open = projectNotes.filter(n => n.status === 'open' || n.status === 'in_progress').length
    const pastDue = projectNotes.filter(n => 
      n.dueDate && new Date(n.dueDate) < new Date() && n.status !== 'resolved' && n.status !== 'closed'
    ).length
    const highCritical = projectNotes.filter(n => 
      (n.priority === 'high' || n.priority === 'critical') && n.status !== 'resolved' && n.status !== 'closed'
    ).length
    const blockers = projectNotes.filter(n => n.blocked).length

    const byCategory = projectNotes.reduce((acc, note) => {
      if (note.status !== 'resolved' && note.status !== 'closed') {
        acc[note.category] = (acc[note.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return { open, pastDue, highCritical, blockers, byCategory }
  }, [projectNotes])

  const handleCreateNote = (noteData: Partial<ProductionNote>) => {
    const newNote: ProductionNote = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      title: noteData.title!,
      body: noteData.body!,
      status: noteData.status || 'open',
      priority: noteData.priority || 'medium',
      category: noteData.category || 'general' as any,
      discipline: noteData.discipline || 'structural',
      assignee: noteData.assignee,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: noteData.dueDate,
      blocked: false,
      blockers: [],
      tags: noteData.tags || [],
      attachments: [],
      visibility: noteData.visibility || 'internal',
    }

    setNotes(current => [...current, newNote])
    setIsCreateDialogOpen(false)
  }

  const handleUpdateNote = (updatedNote: ProductionNote) => {
    setNotes(current => 
      current.map(n => n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : n)
    )
    setSelectedNote(updatedNote)
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes(current => current.filter(n => n.id !== noteId))
    setSelectedNote(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="text-blue-500" size={16} />
      case 'in_progress': return <Hourglass className="text-yellow-500" size={16} />
      case 'waiting_on': return <Warning className="text-orange-500" size={16} />
      case 'resolved': return <CheckCircle className="text-green-500" size={16} />
      case 'closed': return <XCircle className="text-gray-500" size={16} />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Notes</h1>
          <p className="text-muted-foreground">Track fabrication and erection-impacting notes</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2" size={18} />
          New Note
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{kpis.pastDue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High/Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{kpis.highCritical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Blockers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{kpis.blockers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              {Object.entries(kpis.byCategory).map(([cat, count]) => (
                <div key={cat} className="flex justify-between">
                  <span className="capitalize">{cat}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on">Waiting On</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disciplines</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="misc_metals">Misc Metals</SelectItem>
                <SelectItem value="stairs">Stairs</SelectItem>
                <SelectItem value="rails">Rails</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fab">Fabrication</SelectItem>
                <SelectItem value="field">Field</SelectItem>
                <SelectItem value="detailing">Detailing</SelectItem>
                <SelectItem value="qc">QC</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="coordination">Coordination</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="design_intent">Design Intent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="dueDate">By Due Date</SelectItem>
                <SelectItem value="lastUpdated">Last Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No notes match your filters</p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors',
                      selectedNote?.id === note.id && 'bg-accent border-primary'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-1 h-full rounded-full flex-shrink-0', getPriorityColor(note.priority))} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(note.status)}
                          <h3 className="font-semibold truncate">{note.title}</h3>
                          {note.blocked && (
                            <Badge variant="destructive" className="text-xs">Blocked</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{note.body}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{note.category}</Badge>
                          <Badge variant="outline" className="text-xs">{note.discipline}</Badge>
                          {note.assignee && <span>• {note.assignee}</span>}
                          <span>• {new Date(note.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-l pl-6">
              {selectedNote ? (
                <NoteDetailPanel
                  note={selectedNote}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a note to view details</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateNoteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateNote}
      />
    </div>
  )
}
