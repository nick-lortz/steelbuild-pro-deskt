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
import { Plus, Users, Calendar, ClipboardText, PencilSimple, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Meeting } from '@/lib/types'

export function MeetingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [meetings, setMeetings] = useKV<Meeting[]>('meetings', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  const projectMeetings = meetings
    .filter(m => m.projectId === projectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const meetingData = {
      type: formData.get('type') as Meeting['type'],
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      location: formData.get('location') as string || undefined,
      attendees: (formData.get('attendees') as string).split(',').map(a => a.trim()).filter(Boolean),
      agenda: formData.get('agenda') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      actionItems: [],
      nextSteps: formData.get('nextSteps') as string || undefined,
    }

    if (editingMeeting) {
      setMeetings(current => current.map(m =>
        m.id === editingMeeting.id
          ? { ...m, ...meetingData, updatedAt: new Date().toISOString() }
          : m
      ))
      toast.success('Meeting updated successfully')
    } else {
      const newMeeting: Meeting = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...meetingData,
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setMeetings(current => [...current, newMeeting])
      toast.success('Meeting created successfully')
    }

    setIsDialogOpen(false)
    setEditingMeeting(null)
    e.currentTarget.reset()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      setMeetings(current => current.filter(m => m.id !== id))
      toast.success('Meeting deleted')
    }
  }

  const getMeetingTypeColor = (type: Meeting['type']) => {
    const colors: Record<Meeting['type'], string> = {
      'production': 'bg-blue-100 text-blue-800',
      'safety': 'bg-red-100 text-red-800',
      'coordination': 'bg-purple-100 text-purple-800',
      'pre-install': 'bg-green-100 text-green-800',
      'closeout': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800',
    }
    return colors[type]
  }

  const upcomingCount = projectMeetings.filter(m => new Date(m.date) > new Date()).length
  const pastCount = projectMeetings.filter(m => new Date(m.date) <= new Date()).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">Track project meetings and action items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMeeting(null)}>
              <Plus className="mr-2" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMeeting ? 'Edit Meeting' : 'Create Meeting'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Meeting Type *</Label>
                  <Select name="type" defaultValue={editingMeeting?.type || 'production'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="coordination">Coordination</SelectItem>
                      <SelectItem value="pre-install">Pre-Install</SelectItem>
                      <SelectItem value="closeout">Closeout</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="datetime-local"
                    defaultValue={editingMeeting?.date}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingMeeting?.title}
                  required
                  placeholder="e.g., Weekly Production Meeting"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingMeeting?.location}
                  placeholder="e.g., Project Trailer, Conference Room A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                <Input
                  id="attendees"
                  name="attendees"
                  defaultValue={editingMeeting?.attendees?.join(', ')}
                  placeholder="e.g., John Smith, Jane Doe, Bob Johnson"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda">Agenda</Label>
                <Textarea
                  id="agenda"
                  name="agenda"
                  defaultValue={editingMeeting?.agenda}
                  placeholder="Meeting topics to cover..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Meeting Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingMeeting?.notes}
                  placeholder="Discussion points, decisions made..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextSteps">Next Steps</Label>
                <Textarea
                  id="nextSteps"
                  name="nextSteps"
                  defaultValue={editingMeeting?.nextSteps}
                  placeholder="Follow-up actions..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMeeting ? 'Update' : 'Create'} Meeting
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projectMeetings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Past</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{pastCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meeting History</CardTitle>
        </CardHeader>
        <CardContent>
          {projectMeetings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">No meetings recorded</h3>
              <p className="text-muted-foreground">Create your first project meeting</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectMeetings.map((meeting) => (
                    <TableRow key={meeting.id} className="hover:bg-accent/50 group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(meeting.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMeetingTypeColor(meeting.type)}>
                          {meeting.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{meeting.title}</TableCell>
                      <TableCell className="text-muted-foreground">{meeting.location || '—'}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {meeting.attendees?.length || 0} attendees
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMeeting(meeting)
                              setIsDialogOpen(true)
                            }}
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(meeting.id)}
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
        </CardContent>
      </Card>
    </div>
  )
}
