import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, FileText, Download, Upload } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { Document } from '@/lib/types'

export function DocumentsPage() {
  const { projectId } = useParams()
  const [documents, setDocuments] = useKV<Document[]>(`documents-${projectId}`, [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as Document['type'],
    category: '',
    tags: '',
  })

  const handleCreate = () => {
    if (!formData.name || !formData.category) {
      toast.error('Please fill in required fields')
      return
    }

    const newDoc: Document = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...formData,
      size: 0,
      uploadedBy: 'Current User',
      uploadedDate: new Date().toISOString(),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    }

    setDocuments(current => [...(current || []), newDoc])
    setIsCreateOpen(false)
    setFormData({
      name: '',
      type: 'other',
      category: '',
      tags: '',
    })
    toast.success('Document added successfully')
  }

  const getTypeIcon = (type: Document['type']) => {
    return <FileText size={16} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const groupedDocs = documents?.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, Document[]>) || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">Project documentation and files</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload size={16} className="mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Add a new document to the project</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="doc-name">Document Name *</Label>
                <Input
                  id="doc-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Document title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="doc-type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: Document['type']) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="doc-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="drawing">Drawing</SelectItem>
                      <SelectItem value="specification">Specification</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="doc-category">Category *</Label>
                  <Input
                    id="doc-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Submittals, Shop Drawings"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doc-tags">Tags</Label>
                <Input
                  id="doc-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Comma-separated tags"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Add Document</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(groupedDocs).length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents?.filter(d => d.type === 'contract').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drawings</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents?.filter(d => d.type === 'drawing').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents?.filter(d => d.type === 'photo').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>All project documents organized by category</CardDescription>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start building your project document library
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Upload size={16} className="mr-2" />
                Upload Document
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(doc.type)}
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>{doc.category}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{doc.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(doc.uploadedDate).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{doc.uploadedBy}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatFileSize(doc.size)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
