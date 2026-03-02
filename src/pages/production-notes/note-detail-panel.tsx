import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  PencilSimple, 
  Trash, 
  Warning, 
  CheckCircle,
  Calendar,
  User,
  Tag,
  Link as LinkIcon,
  Eye,
  EyeSlash
} from '@phosphor-icons/react'
import type { ProductionNote } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface NoteDetailPanelProps {
  note: ProductionNote
  onUpdate: (note: ProductionNote) => void
  onDelete: (noteId: string) => void
}

export function NoteDetailPanel({ note, onUpdate, onDelete }: NoteDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedNote, setEditedNote] = useState<ProductionNote>(note)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newBlocker, setNewBlocker] = useState('')
  const [waitingOnParty, setWaitingOnParty] = useState(note.waitingOnParty || '')

  const handleSave = () => {
    if (!editedNote.title || !editedNote.body) {
      toast.error('Title and body are required')
      return
    }

    if (editedNote.status === 'waiting_on' && !editedNote.blockers.length && !newBlocker) {
      toast.error('Please add at least one blocker when status is "Waiting On"')
      return
    }

    if (editedNote.status === 'resolved' && !editedNote.resolutionSummary) {
      toast.error('Please provide a resolution summary')
      return
    }

    let finalNote = { ...editedNote }
    
    if (newBlocker) {
      finalNote = {
        ...finalNote,
        blockers: [...finalNote.blockers, { description: newBlocker, party: waitingOnParty }],
        blocked: true,
      }
    }

    if (finalNote.status === 'waiting_on') {
      finalNote.waitingOnParty = waitingOnParty
      finalNote.blocked = true
    } else if (finalNote.status === 'resolved' || finalNote.status === 'closed') {
      finalNote.blocked = false
    }

    onUpdate(finalNote)
    setIsEditing(false)
    setNewBlocker('')
    setWaitingOnParty('')
    toast.success('Note updated successfully')
  }

  const handleCancel = () => {
    setEditedNote(note)
    setIsEditing(false)
    setNewBlocker('')
  }

  const handleDelete = () => {
    onDelete(note.id)
    setShowDeleteDialog(false)
    toast.success('Note deleted successfully')
  }

  const removeBlocker = (index: number) => {
    const updatedBlockers = editedNote.blockers.filter((_, i) => i !== index)
    setEditedNote(prev => ({
      ...prev,
      blockers: updatedBlockers,
      blocked: updatedBlockers.length > 0,
    }))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: 'default', label: 'Open' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      waiting_on: { variant: 'destructive', label: 'Waiting On' },
      resolved: { variant: 'outline', label: 'Resolved' },
      closed: { variant: 'outline', label: 'Closed' },
    }
    const config = variants[status] || variants.open
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editedNote.title}
              onChange={(e) => setEditedNote(prev => ({ ...prev, title: e.target.value }))}
              className="text-xl font-bold"
            />
          ) : (
            <h2 className="text-xl font-bold">{note.title}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <PencilSimple size={16} className="mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(true)}>
                <Trash size={16} className="mr-1" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={getPriorityColor(isEditing ? editedNote.priority : note.priority)}>
          {isEditing ? editedNote.priority : note.priority}
        </Badge>
        {getStatusBadge(isEditing ? editedNote.status : note.status)}
        <Badge variant="outline">{isEditing ? editedNote.category : note.category}</Badge>
        <Badge variant="outline">{isEditing ? editedNote.discipline : note.discipline}</Badge>
        {(isEditing ? editedNote.blocked : note.blocked) && (
          <Badge variant="destructive">
            <Warning size={14} className="mr-1" />
            Blocked
          </Badge>
        )}
      </div>

      <Separator />

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editedNote.body}
              onChange={(e) => setEditedNote(prev => ({ ...prev, body: e.target.value }))}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={editedNote.priority}
                onValueChange={(value: any) => setEditedNote(prev => ({ ...prev, priority: value }))}
              >
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
              <Label>Status</Label>
              <Select
                value={editedNote.status}
                onValueChange={(value: any) => setEditedNote(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_on">Waiting On</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {editedNote.status === 'waiting_on' && (
            <div className="space-y-2">
              <Label>Waiting On (Party)</Label>
              <Input
                value={waitingOnParty}
                onChange={(e) => setWaitingOnParty(e.target.value)}
                placeholder="e.g., GC, Engineer, HVAC Contractor"
              />
            </div>
          )}

          {editedNote.status === 'resolved' && (
            <div className="space-y-2">
              <Label>Resolution Summary *</Label>
              <Textarea
                value={editedNote.resolutionSummary || ''}
                onChange={(e) => setEditedNote(prev => ({ ...prev, resolutionSummary: e.target.value }))}
                placeholder="Describe how this was resolved..."
                rows={3}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editedNote.category}
                onValueChange={(value: any) => setEditedNote(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <div className="space-y-2">
              <Label>Discipline</Label>
              <Select
                value={editedNote.discipline}
                onValueChange={(value: any) => setEditedNote(prev => ({ ...prev, discipline: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="misc_metals">Misc Metals</SelectItem>
                  <SelectItem value="stairs">Stairs</SelectItem>
                  <SelectItem value="rails">Rails</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input
                value={editedNote.assignee || ''}
                onChange={(e) => setEditedNote(prev => ({ ...prev, assignee: e.target.value }))}
                placeholder="Assign to team member"
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editedNote.dueDate || ''}
                onChange={(e) => setEditedNote(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Add Blocker</Label>
            <Input
              value={newBlocker}
              onChange={(e) => setNewBlocker(e.target.value)}
              placeholder="Describe what's blocking progress..."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Description</Label>
            <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
          </div>

          {note.resolutionSummary && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{note.resolutionSummary}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {note.assignee && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">{note.assignee}</span>
              </div>
            )}
            {note.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className={cn(
                  'font-medium',
                  new Date(note.dueDate) < new Date() && note.status !== 'resolved' && note.status !== 'closed' && 'text-red-500'
                )}>
                  {new Date(note.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {note.visibility === 'internal' ? (
              <>
                <EyeSlash size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Internal Only</span>
              </>
            ) : (
              <>
                <Eye size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Shared with GC</span>
              </>
            )}
          </div>

          {note.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag size={16} />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(note.workPackageId || note.drawingSetId || note.rfiId || note.changeOrderId || note.pieceMark) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LinkIcon size={16} />
                <span>Linked Entities</span>
              </div>
              <div className="space-y-1 text-sm">
                {note.pieceMark && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Piece Mark:</span>
                    <Badge variant="outline">{note.pieceMark}</Badge>
                  </div>
                )}
                {note.workPackageId && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Work Package:</span>
                    <Badge variant="outline">{note.workPackageId}</Badge>
                  </div>
                )}
                {note.drawingSetId && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Drawing Set:</span>
                    <Badge variant="outline">{note.drawingSetId}</Badge>
                  </div>
                )}
                {note.rfiId && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">RFI:</span>
                    <Badge variant="outline">{note.rfiId}</Badge>
                  </div>
                )}
                {note.changeOrderId && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Change Order:</span>
                    <Badge variant="outline">{note.changeOrderId}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {note.blockers.length > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                  <Warning size={16} />
                  Blockers ({note.blockers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {note.blockers.map((blocker, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-700 font-bold">•</span>
                      <div className="flex-1">
                        <p>{blocker.description}</p>
                        {blocker.party && (
                          <p className="text-xs text-muted-foreground mt-1">Waiting on: {blocker.party}</p>
                        )}
                      </div>
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBlocker(index)}
                        >
                          <Trash size={14} />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created by {note.createdBy} on {new Date(note.createdAt).toLocaleString()}</p>
            <p>Last updated {new Date(note.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
