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
import { Plus, Note, Warning, MapPin, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ProductionNote } from '@/lib/types'

export function ProductionNotesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [notes, setNotes] = useKV<ProductionNote[]>('production-notes', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingNote, setEditingNote] = useState<ProductionNote | null>(null)

  const projectNotes = notes.filter(n => n.projectId === projectId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const filteredNotes = projectNotes.filter(note => 
    categoryFilter === 'all' || note.category === categoryFilter
  )

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const noteData = {
      date: formData.get('date') as string,
      shift: formData.get('shift') as ProductionNote['shift'],
      category: formData.get('category') as ProductionNote['category'],
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      location: formData.get('location') as string,
      crew: formData.get('crew') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      urgent: formData.get('urgent') === 'on',
      followUpRequired: formData.get('followUpRequired') === 'on',
      followUpDate: formData.get('followUpDate') as string || undefined,
    }

    if (editingNote) {
      setNotes(current => current.map(n =>
        n.id === editingNote.id ? { ...n, ...noteData } : n
      ))
      toast.success('Note updated successfully')
    } else {
      const newNote: ProductionNote = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...noteData,
        attachments: [],
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
      }
      setNotes(current => [...current, newNote])
      toast.success('Note created successfully')
    }

    setIsDialogOpen(false)
    setEditingNote(null)
    e.currentTarget.reset()
  }

  const getCategoryColor = (category: ProductionNote['category']) => {
    const colors: Record<string, string> = {
      progress: 'bg-blue-100 text-blue-800',
      issue: 'bg-red-100 text-red-800',
      quality: 'bg-purple-100 text-purple-800',
      safety: 'bg-yellow-100 text-yellow-800',
      equipment: 'bg-green-100 text-green-800',
      material: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.general
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Notes</h1>
          <p className="text-muted-foreground">Daily field notes and observations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingNote(null)}>
              <Plus className="mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Create Production Note'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={editingNote?.date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">Shift</Label>
                  <Select name="shift" defaultValue={editingNote?.shift || 'day'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editingNote?.category || 'general'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingNote?.title}
                  required
                  placeholder="Brief summary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editingNote?.content}
                  required
                  placeholder="Detailed notes..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={editingNote?.location}
                    placeholder="Grid line or area"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crew">Crew</Label>
                  <Input
                    id="crew"
                    name="crew"
                    defaultValue={editingNote?.crew}
                    placeholder="Crew identifier"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={editingNote?.tags?.join(', ')}
                  placeholder="welding, column, inspection"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    name="urgent"
                    defaultChecked={editingNote?.urgent}
                    className="rounded"
                  />
                  <Label htmlFor="urgent">Mark as urgent</Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    name="followUpRequired"
                    defaultChecked={editingNote?.followUpRequired}
                    className="rounded"
                  />
                  <Label htmlFor="followUpRequired">Follow-up required</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    name="followUpDate"
                    type="date"
                    defaultValue={editingNote?.followUpDate}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNote ? 'Update' : 'Create'} Note
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <Note className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">No notes found</h3>
              <p className="text-muted-foreground">Create your first production note</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 border-l-4 ${note.urgent ? 'border-red-500 bg-red-50' : 'border-primary'} rounded-lg`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{note.title}</h3>
                      <Badge className={getCategoryColor(note.category)}>
                        {note.category}
                      </Badge>
                      {note.urgent && (
                        <Badge className="bg-red-100 text-red-800">
                          <Warning className="mr-1" size={14} />
                          Urgent
                        </Badge>
                      )}
                      {note.followUpRequired && (
                        <Badge className="bg-orange-100 text-orange-800">
                          Follow-up Required
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingNote(note)
                        setIsDialogOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm mb-3">{note.content}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(note.date).toLocaleDateString()}</span>
                    {note.shift && <span>• {note.shift} shift</span>}
                    {note.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {note.location}
                        </span>
                      </>
                    )}
                    {note.crew && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {note.crew}
                        </span>
                      </>
                    )}
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {note.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
