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
import { Plus, User, Phone, Envelope, Buildings } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ProjectContact } from '@/lib/types'

export function ProjectContactsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [contacts, setContacts] = useKV<ProjectContact[]>('project-contacts', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ProjectContact | null>(null)

  const projectContacts = contacts.filter(c => c.projectId === projectId)

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const contactData = {
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      role: formData.get('role') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    if (editingContact) {
      setContacts(current => current.map(c =>
        c.id === editingContact.id ? { ...c, ...contactData } : c
      ))
      toast.success('Contact updated successfully')
    } else {
      const newContact: ProjectContact = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...contactData,
        createdAt: new Date().toISOString(),
      }
      setContacts(current => [...current, newContact])
      toast.success('Contact created successfully')
    }

    setIsDialogOpen(false)
    setEditingContact(null)
    e.currentTarget.reset()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContacts(current => current.filter(c => c.id !== id))
      toast.success('Contact deleted')
    }
  }

  const contactsByCompany = projectContacts.reduce((acc, contact) => {
    if (!acc[contact.company]) {
      acc[contact.company] = []
    }
    acc[contact.company].push(contact)
    return acc
  }, {} as Record<string, ProjectContact[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Contacts</h1>
          <p className="text-muted-foreground">Manage stakeholders and team members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingContact(null)}>
              <Plus className="mr-2" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingContact?.name}
                  required
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={editingContact?.company}
                    required
                    placeholder="ABC Construction"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    name="role"
                    defaultValue={editingContact?.role}
                    required
                    placeholder="Project Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingContact?.email}
                    placeholder="john.smith@abc.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingContact?.phone}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingContact?.notes}
                  placeholder="Additional information..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContact ? 'Update' : 'Create'} Contact
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projectContacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.keys(contactsByCompany).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {projectContacts.filter(c => c.email).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {projectContacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
            <p className="text-muted-foreground">Add your first project contact</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(contactsByCompany).map(([company, companyContacts]) => (
            <Card key={company}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Buildings />
                  {company}
                  <Badge variant="outline">{companyContacts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          <User size={32} className="text-muted-foreground" weight="duotone" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{contact.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{contact.role}</p>
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Envelope size={16} className="text-muted-foreground" />
                                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone size={16} className="text-muted-foreground" />
                                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{contact.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContact(contact)
                            setIsDialogOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
