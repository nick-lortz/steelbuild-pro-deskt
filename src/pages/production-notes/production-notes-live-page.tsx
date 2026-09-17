import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Plus, 
  CaretDown,
  CaretRight,
  Trash,
  MagnifyingGlass,
  FunnelSimple,
  X,
  Circle,
  CircleDashed,
  CheckCircle,
  Clock,
  WarningCircle,
  Note as NoteIcon,
  User,
  Tag,
  CalendarBlank
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type NoteStatus = 'open' | 'waiting_on' | 'in_progress' | 'resolved' | 'closed'
type NotePriority = 'low' | 'medium' | 'high' | 'critical'
type NoteTag = 'fab' | 'field' | 'rfi' | 'co' | 'safety' | 'material' | 'schedule' | 'quality' | 'other'
type CostImpact = 'none' | 'potential' | 'confirmed'
type ScheduleImpact = 'none' | 'potential' | 'confirmed'

interface ProductionNote {
  id: string
  projectId: string
  projectName: string
  projectNumber: string
  date: string
  noteText: string
  tags: NoteTag[]
  priority: NotePriority
  owner: string
  status: NoteStatus
  costImpact: CostImpact
  scheduleImpact: ScheduleImpact
  linkedRfiId?: string
  linkedCoId?: string
  createdAt: string
  updatedAt: string
  updatedBy: string
}

interface ProjectSection {
  projectId: string
  projectName: string
  projectNumber: string
  status: string
  notes: ProductionNote[]
  openCount: number
  lastUpdated: string
}

export function ProductionNotesLivePage() {
  const [allNotes, setAllNotes] = useKV<ProductionNote[]>('production-notes-live', [])
  const [projects] = useKV<any[]>('projects', [])
  const [expandedProjects, setExpandedProjects] = useKV<Record<string, boolean>>('production-notes-expanded', {})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | NoteStatus>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | NotePriority>('all')
  const [filterTag, setFilterTag] = useState<'all' | NoteTag>('all')
  const [showMyNotes, setShowMyNotes] = useState(false)
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)
  const [showWaitingOnly, setShowWaitingOnly] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

  const projectSections = useMemo(() => {
    const sections: ProjectSection[] = []
    
    projects.forEach(project => {
      const projectNotes = allNotes.filter(n => n.projectId === project.id)
      
      let filtered = projectNotes

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(n =>
          n.noteText.toLowerCase().includes(query) ||
          n.tags.some(t => t.includes(query)) ||
          n.owner.toLowerCase().includes(query) ||
          (n.linkedRfiId && n.linkedRfiId.toLowerCase().includes(query)) ||
          (n.linkedCoId && n.linkedCoId.toLowerCase().includes(query))
        )
      }

      if (filterStatus !== 'all') {
        filtered = filtered.filter(n => n.status === filterStatus)
      }

      if (filterPriority !== 'all') {
        filtered = filtered.filter(n => n.priority === filterPriority)
      }

      if (filterTag !== 'all') {
        filtered = filtered.filter(n => n.tags.includes(filterTag))
      }

      if (showMyNotes) {
        filtered = filtered.filter(n => n.owner === 'Current User')
      }

      if (showOpenOnly) {
        filtered = filtered.filter(n => n.status === 'open')
      }

      if (showCriticalOnly) {
        filtered = filtered.filter(n => n.priority === 'critical')
      }

      if (showWaitingOnly) {
        filtered = filtered.filter(n => n.status === 'waiting_on')
      }

      if (filtered.length > 0) {
        const openCount = projectNotes.filter(n => n.status === 'open' || n.status === 'in_progress' || n.status === 'waiting_on').length
        const lastUpdated = projectNotes.length > 0
          ? new Date(Math.max(...projectNotes.map(n => new Date(n.updatedAt).getTime()))).toISOString()
          : new Date().toISOString()

        sections.push({
          projectId: project.id,
          projectName: project.name,
          projectNumber: project.project_number || 'N/A',
          status: project.status,
          notes: filtered.sort((a, b) => {
            if (a.priority === 'critical' && b.priority !== 'critical') return -1
            if (b.priority === 'critical' && a.priority !== 'critical') return 1
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          }),
          openCount,
          lastUpdated
        })
      }
    })

    return sections.sort((a, b) => a.projectName.localeCompare(b.projectName))
  }, [allNotes, projects, searchQuery, filterStatus, filterPriority, filterTag, showMyNotes, showOpenOnly, showCriticalOnly, showWaitingOnly])

  const totalNotes = allNotes.length
  const openNotes = allNotes.filter(n => n.status === 'open' || n.status === 'in_progress' || n.status === 'waiting_on').length
  const criticalNotes = allNotes.filter(n => n.priority === 'critical').length
  const pastDueNotes = allNotes.filter(n => {
    const noteDate = new Date(n.date)
    const today = new Date()
    return noteDate < today && (n.status === 'open' || n.status === 'in_progress')
  }).length

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  const handleAddNote = (projectId: string, projectName: string, projectNumber: string) => {
    const newNote: ProductionNote = {
      id: crypto.randomUUID(),
      projectId,
      projectName,
      projectNumber,
      date: new Date().toISOString().split('T')[0],
      noteText: '',
      tags: [],
      priority: 'medium',
      owner: 'Current User',
      status: 'open',
      costImpact: 'none',
      scheduleImpact: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'Current User'
    }
    
    setAllNotes(current => [newNote, ...current])
    setEditingNoteId(newNote.id)
    
    if (!expandedProjects[projectId]) {
      toggleProject(projectId)
    }
  }

  const handleUpdateNote = (noteId: string, updates: Partial<ProductionNote>) => {
    setSavingNoteId(noteId)
    
    setTimeout(() => {
      setAllNotes(current => current.map(n =>
        n.id === noteId
          ? {
              ...n,
              ...updates,
              updatedAt: new Date().toISOString(),
              updatedBy: 'Current User'
            }
          : n
      ))
      
      setSavingNoteId(null)
      toast.success('Saved')
    }, 300)
  }

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Delete this note? This action cannot be undone.')) {
      setAllNotes(current => current.filter(n => n.id !== noteId))
      toast.success('Note deleted')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterTag('all')
    setShowMyNotes(false)
    setShowOpenOnly(false)
    setShowCriticalOnly(false)
    setShowWaitingOnly(false)
  }

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterTag !== 'all' || showMyNotes || showOpenOnly || showCriticalOnly || showWaitingOnly

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Notes</h1>
          <p className="text-muted-foreground mt-1">
            Live project notes for weekly production meetings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <NoteIcon className="text-blue-500" size={24} weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalNotes}</div>
              <div className="text-sm text-muted-foreground">Total Notes</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Circle className="text-amber-500" size={24} weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold">{openNotes}</div>
              <div className="text-sm text-muted-foreground">Open Notes</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-500/10">
              <WarningCircle className="text-red-500" size={24} weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold">{criticalNotes}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Clock className="text-orange-500" size={24} weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold">{pastDueNotes}</div>
              <div className="text-sm text-muted-foreground">Past Due</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search notes, tags, owners, RFI IDs, CO IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTag} onValueChange={(v) => setFilterTag(v as typeof filterTag)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                <SelectItem value="fab">Fab</SelectItem>
                <SelectItem value="field">Field</SelectItem>
                <SelectItem value="rfi">RFI</SelectItem>
                <SelectItem value="co">CO</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showOpenOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOpenOnly(!showOpenOnly)}
            >
              <FunnelSimple className="mr-2" size={16} />
              Open Only
            </Button>
            <Button
              variant={showMyNotes ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMyNotes(!showMyNotes)}
            >
              <User className="mr-2" size={16} />
              My Notes
            </Button>
            <Button
              variant={showCriticalOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCriticalOnly(!showCriticalOnly)}
            >
              <WarningCircle className="mr-2" size={16} />
              Critical
            </Button>
            <Button
              variant={showWaitingOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowWaitingOnly(!showWaitingOnly)}
            >
              <Clock className="mr-2" size={16} />
              Waiting
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="mr-2" size={16} />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {projectSections.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <NoteIcon className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">No production notes</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Add notes to track for weekly production meetings'}
              </p>
            </div>
          </Card>
        ) : (
          projectSections.map((section) => (
            <NoteProjectSection
              key={section.projectId}
              section={section}
              expanded={expandedProjects[section.projectId] !== false}
              onToggle={() => toggleProject(section.projectId)}
              onAddNote={() => handleAddNote(section.projectId, section.projectName, section.projectNumber)}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              editingNoteId={editingNoteId}
              setEditingNoteId={setEditingNoteId}
              savingNoteId={savingNoteId}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface NoteProjectSectionProps {
  section: ProjectSection
  expanded: boolean
  onToggle: () => void
  onAddNote: () => void
  onUpdateNote: (noteId: string, updates: Partial<ProductionNote>) => void
  onDeleteNote: (noteId: string) => void
  editingNoteId: string | null
  setEditingNoteId: (id: string | null) => void
  savingNoteId: string | null
}

function NoteProjectSection({
  section,
  expanded,
  onToggle,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  editingNoteId,
  setEditingNoteId,
  savingNoteId
}: NoteProjectSectionProps) {
  return (
    <Card>
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-accent/50 transition-colors border-b">
            <div className="flex items-center gap-4 flex-1">
              {expanded ? (
                <CaretDown size={20} className="text-muted-foreground" />
              ) : (
                <CaretRight size={20} className="text-muted-foreground" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{section.projectName}</h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {section.projectNumber}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {section.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{section.notes.length} notes</span>
                  <span className="text-amber-600">{section.openCount} open</span>
                  <span>Last updated {new Date(section.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAddNote()
              }}
            >
              <Plus className="mr-2" size={16} />
              Add Note
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="divide-y">
            {section.notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                isEditing={editingNoteId === note.id}
                isSaving={savingNoteId === note.id}
                onEdit={() => setEditingNoteId(note.id)}
                onCancelEdit={() => setEditingNoteId(null)}
                onUpdate={(updates) => {
                  onUpdateNote(note.id, updates)
                  setEditingNoteId(null)
                }}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

interface NoteRowProps {
  note: ProductionNote
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (updates: Partial<ProductionNote>) => void
  onDelete: () => void
}

function NoteRow({ note, isEditing, isSaving, onEdit, onCancelEdit, onUpdate, onDelete }: NoteRowProps) {
  const [editedNote, setEditedNote] = useState(note)

  const handleSave = () => {
    if (!editedNote.noteText.trim()) {
      toast.error('Note text is required')
      return
    }
    onUpdate(editedNote)
  }

  const getPriorityColor = (priority: NotePriority) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    }
    return colors[priority]
  }

  const getStatusIcon = (status: NoteStatus) => {
    const icons = {
      open: <Circle size={16} className="text-amber-500" weight="fill" />,
      in_progress: <CircleDashed size={16} className="text-blue-500" weight="bold" />,
      waiting_on: <Clock size={16} className="text-orange-500" weight="duotone" />,
      resolved: <CheckCircle size={16} className="text-green-500" weight="fill" />,
      closed: <CheckCircle size={16} className="text-gray-500" weight="fill" />
    }
    return icons[status]
  }

  const getTagColor = (tag: NoteTag) => {
    const colors = {
      fab: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      field: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rfi: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      co: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      safety: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      material: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      schedule: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      quality: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
    return colors[tag]
  }

  if (!isEditing) {
    return (
      <div className="p-4 hover:bg-accent/50 transition-colors group" onClick={onEdit}>
        <div className="flex items-start gap-4">
          <div className={cn('w-1 h-full rounded-full', getPriorityColor(note.priority))} />
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarBlank size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{new Date(note.date).toLocaleDateString()}</span>
                  {getStatusIcon(note.status)}
                  <Badge variant="outline" className="text-xs capitalize">{note.status.replace('_', ' ')}</Badge>
                  <Badge variant="outline" className={cn('text-xs capitalize', getPriorityColor(note.priority), 'text-white border-0')}>
                    {note.priority}
                  </Badge>
                </div>
                
                <p className="text-sm mb-2 whitespace-pre-wrap">{note.noteText}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className={cn('text-xs', getTagColor(tag))}>
                      {tag}
                    </Badge>
                  ))}
                  
                  {note.owner && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User size={12} />
                      <span>{note.owner}</span>
                    </div>
                  )}

                  {note.linkedRfiId && (
                    <Badge variant="outline" className="text-xs">
                      RFI: {note.linkedRfiId}
                    </Badge>
                  )}

                  {note.linkedCoId && (
                    <Badge variant="outline" className="text-xs">
                      CO: {note.linkedCoId}
                    </Badge>
                  )}

                  {note.costImpact !== 'none' && (
                    <Badge variant="outline" className="text-xs text-amber-600">
                      Cost: {note.costImpact}
                    </Badge>
                  )}

                  {note.scheduleImpact !== 'none' && (
                    <Badge variant="outline" className="text-xs text-orange-600">
                      Schedule: {note.scheduleImpact}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash size={16} className="text-destructive" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last edited by {note.updatedBy} on {new Date(note.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-accent/30 border-l-4 border-blue-500">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Date</label>
            <Input
              type="date"
              value={editedNote.date}
              onChange={(e) => setEditedNote({ ...editedNote, date: e.target.value })}
              className="h-9"
            />
          </div>
          
          <div>
            <label className="text-xs font-medium mb-1 block">Owner</label>
            <Input
              value={editedNote.owner}
              onChange={(e) => setEditedNote({ ...editedNote, owner: e.target.value })}
              placeholder="Assigned person"
              className="h-9"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Note</label>
          <Textarea
            value={editedNote.noteText}
            onChange={(e) => setEditedNote({ ...editedNote, noteText: e.target.value })}
            placeholder="Enter production note..."
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Priority</label>
            <Select
              value={editedNote.priority}
              onValueChange={(v) => setEditedNote({ ...editedNote, priority: v as NotePriority })}
            >
              <SelectTrigger className="h-9">
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

          <div>
            <label className="text-xs font-medium mb-1 block">Status</label>
            <Select
              value={editedNote.status}
              onValueChange={(v) => setEditedNote({ ...editedNote, status: v as NoteStatus })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Cost Impact</label>
            <Select
              value={editedNote.costImpact}
              onValueChange={(v) => setEditedNote({ ...editedNote, costImpact: v as CostImpact })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="potential">Potential</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Schedule Impact</label>
            <Select
              value={editedNote.scheduleImpact}
              onValueChange={(v) => setEditedNote({ ...editedNote, scheduleImpact: v as ScheduleImpact })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="potential">Potential</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Linked RFI ID (optional)</label>
            <Input
              value={editedNote.linkedRfiId || ''}
              onChange={(e) => setEditedNote({ ...editedNote, linkedRfiId: e.target.value || undefined })}
              placeholder="RFI-001"
              className="h-9"
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Linked CO ID (optional)</label>
            <Input
              value={editedNote.linkedCoId || ''}
              onChange={(e) => setEditedNote({ ...editedNote, linkedCoId: e.target.value || undefined })}
              placeholder="CO-001"
              className="h-9"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Tags (select multiple)</label>
          <div className="flex flex-wrap gap-2">
            {(['fab', 'field', 'rfi', 'co', 'safety', 'material', 'schedule', 'quality', 'other'] as NoteTag[]).map((tag) => (
              <Badge
                key={tag}
                variant={editedNote.tags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => {
                  setEditedNote({
                    ...editedNote,
                    tags: editedNote.tags.includes(tag)
                      ? editedNote.tags.filter(t => t !== tag)
                      : [...editedNote.tags, tag]
                  })
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" onClick={onCancelEdit} disabled={isSaving} size="sm">
            Cancel
          </Button>
          {isSaving && <span className="text-xs text-muted-foreground">Saving changes...</span>}
        </div>
      </div>
    </div>
  )
}
