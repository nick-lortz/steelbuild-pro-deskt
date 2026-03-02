import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Stack,
  FileText,
  Upload,
  Check,
  X,
  FilePdf,
  Eye,
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

type DrawingSetStatus = 'IFA' | 'BFA' | 'OFS' | 'BFS' | 'FFF'

interface DrawingSet {
  id: string
  project_id: string
  name: string
  status: DrawingSetStatus
  discipline?: string
  set_number?: string
  created_at: string
}

interface DrawingSheet {
  id: string
  set_id: string
  sheet_no: string
  title: string
  status: DrawingSetStatus
  file_name?: string
  file_data?: string
  created_at: string
}

const STATUS_SEQUENCE: DrawingSetStatus[] = ['IFA', 'BFA', 'OFS', 'BFS', 'FFF'];

const STATUS_LABELS: Record<DrawingSetStatus, string> = {
  'IFA': 'Issued for Approval',
  'BFA': 'Back from Approval',
  'OFS': 'Out for Signature',
  'BFS': 'Back from Signature',
  'FFF': 'Fully Approved for Fabrication',
}

const STATUS_COLORS: Record<DrawingSetStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'IFA': 'outline',
  'BFA': 'secondary',
  'OFS': 'default',
  'BFS': 'secondary',
  'FFF': 'default',
}

export function DrawingsDBPage() {
  const { projectId } = useParams()
  const [drawingSets, setDrawingSets] = useKV<DrawingSet[]>(`drawing-sets-${projectId}`, [])
  const [drawingSheets, setDrawingSheets] = useKV<DrawingSheet[]>(`drawing-sheets-${projectId}`, [])
  
  const [isCreateSetOpen, setIsCreateSetOpen] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [selectedSet, setSelectedSet] = useState<DrawingSet | null>(null)
  const [viewSheetsSetId, setViewSheetsSetId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  const [setFormData, setSetFormData] = useState({
    name: '',
    status: 'IFA' as DrawingSetStatus,
    discipline: '',
    set_number: '',
  })

  const [sheetFormData, setSheetFormData] = useState({
    sheet_no: '',
    title: '',
    status: 'IFA' as DrawingSetStatus,
  })

  const handleDeleteSheet = (sheetId: string) => {
    setDrawingSheets((current) => 
      current.filter(sheet => sheet.id !== sheetId)
    )
    toast.success('Sheet deleted successfully')
  }

  const handleCreateSet = () => {
    if (!setFormData.name || !projectId) {
      toast.error('Please enter a set name')
      return
    }

    const newSet: DrawingSet = {
      id: crypto.randomUUID(),
      project_id: projectId,
      name: setFormData.name,
      status: setFormData.status,
      discipline: setFormData.discipline,
      set_number: setFormData.set_number,
      created_at: new Date().toISOString(),
    }

    setDrawingSets((current) => [...current, newSet])
    setIsCreateSetOpen(false)
    setSetFormData({
      name: '',
      status: 'IFA',
      discipline: '',
      set_number: '',
    })
    toast.success('Drawing set created successfully')
  }

  const handleAddSheet = async () => {
    if (!selectedSet || !sheetFormData.sheet_no || !sheetFormData.title) {
      toast.error('Please fill in required fields')
      return
    }

    if (!selectedFile) {
      toast.error('Please select a PDF file to upload')
      return
    }

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported')
      return
    }

    setUploadingFile(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Data = btoa(
            new Uint8Array(e.target.result as ArrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          )

          const newSheet: DrawingSheet = {
            id: crypto.randomUUID(),
            set_id: selectedSet.id,
            sheet_no: sheetFormData.sheet_no,
            title: sheetFormData.title,
            status: sheetFormData.status,
            file_name: selectedFile.name,
            file_data: base64Data,
            created_at: new Date().toISOString(),
          }

          setDrawingSheets((current) => [...current, newSheet])
          setIsAddSheetOpen(false)
          setSelectedSet(null)
          setSelectedFile(null)
          setSheetFormData({
            sheet_no: '',
            title: '',
            status: 'IFA',
          })
          setUploadingFile(false)
          toast.success('Sheet added successfully with PDF file')
        }
      }

      reader.onerror = () => {
        setUploadingFile(false)
        toast.error('Failed to read file')
      }

      reader.readAsArrayBuffer(selectedFile)
    } catch (error) {
      setUploadingFile(false)
      toast.error('Failed to upload file')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Only PDF files are supported')
        return
      }
      setSelectedFile(file)
      toast.success(`Selected: ${file.name}`)
    }
  }

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'))
    const invalidFiles = files.length - pdfFiles.length

    if (invalidFiles > 0) {
      toast.error(`${invalidFiles} non-PDF file(s) skipped`)
    }

    if (pdfFiles.length > 0) {
      setSelectedFiles(pdfFiles)
      toast.success(`Selected ${pdfFiles.length} PDF file(s)`)
    }
  }

  const handleRemoveBulkFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const extractSheetNumber = (filename: string): string => {
    const cleaned = filename.replace(/\.pdf$/i, '')
    const match = cleaned.match(/[A-Z]-?\d+/i)
    return match ? match[0] : cleaned
  }

  const extractSheetTitle = (filename: string): string => {
    const cleaned = filename.replace(/\.pdf$/i, '')
    const withoutNumber = cleaned.replace(/^[A-Z]-?\d+[_\s-]*/i, '')
    return withoutNumber || cleaned
  }

  const handleBulkUpload = async () => {
    if (!selectedSet) {
      toast.error('No drawing set selected')
      return
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one PDF file')
      return
    }

    setUploadingFile(true)

    try {
      const newSheets: DrawingSheet[] = []

      for (const file of selectedFiles) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              const base64 = btoa(
                new Uint8Array(e.target.result as ArrayBuffer)
                  .reduce((data, byte) => data + String.fromCharCode(byte), '')
              )
              resolve(base64)
            } else {
              reject(new Error('Failed to read file'))
            }
          }
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsArrayBuffer(file)
        })

        const newSheet: DrawingSheet = {
          id: crypto.randomUUID(),
          set_id: selectedSet.id,
          sheet_no: extractSheetNumber(file.name),
          title: extractSheetTitle(file.name),
          status: sheetFormData.status,
          file_name: file.name,
          file_data: base64Data,
          created_at: new Date().toISOString(),
        }

        newSheets.push(newSheet)
      }

      setDrawingSheets((current) => [...current, ...newSheets])
      setIsBulkUploadOpen(false)
      setSelectedSet(null)
      setSelectedFiles([])
      setUploadingFile(false)
      toast.success(`Successfully uploaded ${newSheets.length} sheet(s)`)
    } catch (error) {
      setUploadingFile(false)
      toast.error('Failed to upload files')
    }
  }

  const handleViewPDF = (sheet: DrawingSheet) => {
    if (!sheet.file_data) {
      toast.error('No PDF file attached to this sheet')
      return
    }

    try {
      const byteCharacters = atob(sheet.file_data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      toast.error('Failed to open PDF file')
    }
  }

  const handleStatusChange = (setId: string, currentStatus: DrawingSetStatus) => {
    const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)
    if (currentIndex === -1 || currentIndex === STATUS_SEQUENCE.length - 1) {
      toast.error('Cannot transition status')
      return
    }

    const nextStatus = STATUS_SEQUENCE[currentIndex + 1]
    
    setDrawingSets((current) =>
      current.map(set =>
        set.id === setId ? { ...set, status: nextStatus } : set
      )
    )
    
    toast.success(`Status updated to ${STATUS_LABELS[nextStatus]}`)
  }

  const handleDeleteSet = (setId: string) => {
    if (!confirm('Are you sure you want to delete this drawing set?')) {
      return
    }

    setDrawingSets((current) => current.filter(set => set.id !== setId))
    setDrawingSheets((current) => current.filter(sheet => sheet.set_id !== setId))
    toast.success('Drawing set deleted successfully')
  }

  const filteredSheets = viewSheetsSetId 
    ? drawingSheets.filter(sheet => sheet.set_id === viewSheetsSetId)
    : drawingSheets

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drawings</h2>
          <p className="text-muted-foreground">Drawing sets with gated status workflow (IFA → BFA → OFS → BFS → FFF)</p>
        </div>
        <Dialog open={isCreateSetOpen} onOpenChange={setIsCreateSetOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Drawing Set
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Drawing Set</DialogTitle>
              <DialogDescription>Add a new drawing set to the project</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="set-name">Set Name *</Label>
                <Input
                  id="set-name"
                  value={setFormData.name}
                  onChange={(e) => setSetFormData({ ...setFormData, name: e.target.value })}
                  placeholder="e.g., Steel Framing Package A"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="set-number">Set Number</Label>
                <Input
                  id="set-number"
                  value={setFormData.set_number}
                  onChange={(e) => setSetFormData({ ...setFormData, set_number: e.target.value })}
                  placeholder="e.g., S-100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discipline">Discipline</Label>
                <Input
                  id="discipline"
                  value={setFormData.discipline}
                  onChange={(e) => setSetFormData({ ...setFormData, discipline: e.target.value })}
                  placeholder="e.g., Structural, Shop"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select 
                  value={setFormData.status} 
                  onValueChange={(value: DrawingSetStatus) => setSetFormData({ ...setFormData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_SEQUENCE.map(status => (
                      <SelectItem key={status} value={status}>
                        {status} - {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
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
            <div className="text-2xl font-bold">{drawingSets.length}</div>
            <p className="text-xs text-muted-foreground">
              Total sets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved (FFF)</CardTitle>
            <Check size={20} className="text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {drawingSets.filter(s => s.status === 'FFF').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for fabrication
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drawingSets.filter(s => s.status !== 'FFF').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sheets</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drawingSheets.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All sheets
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sets">Drawing Sets</TabsTrigger>
          <TabsTrigger value="sheets">All Sheets</TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drawing Sets</CardTitle>
              <CardDescription>All drawing sets with gated status transitions</CardDescription>
            </CardHeader>
            <CardContent>
              {drawingSets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Stack size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No drawing sets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first drawing set to get started
                  </p>
                  <Button onClick={() => setIsCreateSetOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Create Drawing Set
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Set Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Discipline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawingSets.map((set) => {
                      const currentIndex = STATUS_SEQUENCE.indexOf(set.status)
                      const canAdvance = currentIndex !== -1 && currentIndex < STATUS_SEQUENCE.length - 1

                      return (
                        <TableRow key={set.id}>
                          <TableCell className="font-mono">{set.set_number || '-'}</TableCell>
                          <TableCell className="font-medium">{set.name}</TableCell>
                          <TableCell>{set.discipline || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={STATUS_COLORS[set.status]}>
                                {set.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {STATUS_LABELS[set.status]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(set.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {canAdvance && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(set.id, set.status)}
                                >
                                  → {STATUS_SEQUENCE[currentIndex + 1]}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSet(set)
                                  setIsAddSheetOpen(true)
                                }}
                              >
                                <Upload size={14} className="mr-1" />
                                Add Sheet
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedSet(set)
                                  setIsBulkUploadOpen(true)
                                }}
                              >
                                <Stack size={14} className="mr-1" />
                                Bulk Upload
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSet(set.id)}
                              >
                                <X size={14} />
                              </Button>
                            </div>
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

        <TabsContent value="sheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Drawing Sheets</CardTitle>
              <CardDescription>View and manage all sheets across drawing sets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={viewSheetsSetId || 'all'} onValueChange={(value) => setViewSheetsSetId(value === 'all' ? null : value)}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Filter by drawing set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sets</SelectItem>
                      {drawingSets.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          {set.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filteredSheets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText size={48} className="text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No drawing sheets</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {viewSheetsSetId ? 'This set has no sheets yet' : 'Add sheets to your drawing sets to see them here'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sheet No.</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Drawing Set</TableHead>
                        <TableHead>PDF</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSheets.map((sheet) => {
                        const set = drawingSets.find(s => s.id === sheet.set_id)
                        return (
                          <TableRow key={sheet.id}>
                            <TableCell className="font-mono">{sheet.sheet_no}</TableCell>
                            <TableCell>{sheet.title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {set?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {sheet.file_name ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <FilePdf size={12} />
                                    {sheet.file_name}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewPDF(sheet)}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No file</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_COLORS[sheet.status]}>
                                {sheet.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(sheet.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSheet(sheet.id)}
                              >
                                <X size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Drawing Sheet</DialogTitle>
            <DialogDescription>
              Add a new sheet to {selectedSet?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sheet-no">Sheet Number *</Label>
              <Input
                id="sheet-no"
                value={sheetFormData.sheet_no}
                onChange={(e) => setSheetFormData({ ...sheetFormData, sheet_no: e.target.value })}
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
            <div className="grid gap-2">
              <Label htmlFor="pdf-upload">PDF File *</Label>
              <div className="flex gap-2">
                <Input
                  id="pdf-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FilePdf size={14} />
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PDF file for this drawing sheet
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sheet-status">Initial Status</Label>
              <Select 
                value={sheetFormData.status} 
                onValueChange={(value: DrawingSetStatus) => setSheetFormData({ ...sheetFormData, status: value })}
              >
                <SelectTrigger id="sheet-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_SEQUENCE.map(status => (
                    <SelectItem key={status} value={status}>
                      {status} - {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddSheetOpen(false)
                setSelectedFile(null)
              }}
              disabled={uploadingFile}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSheet} disabled={uploadingFile}>
              {uploadingFile ? 'Uploading...' : 'Add Sheet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Bulk Upload Drawing Sheets</DialogTitle>
            <DialogDescription>
              Upload multiple PDF files to {selectedSet?.name}. Sheet numbers and titles will be auto-extracted from filenames.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-status">Initial Status for All Sheets</Label>
              <Select 
                value={sheetFormData.status} 
                onValueChange={(value: DrawingSetStatus) => setSheetFormData({ ...sheetFormData, status: value })}
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_SEQUENCE.map(status => (
                    <SelectItem key={status} value={status}>
                      {status} - {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-pdf-upload">Select PDF Files *</Label>
              <Input
                id="bulk-pdf-upload"
                ref={bulkFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleBulkFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Select multiple PDF files. Filenames should include sheet numbers (e.g., S-101, A-203).
              </p>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="grid gap-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Sheet No.</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[200px]">File</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFiles.map((file, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {extractSheetNumber(file.name)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {extractSheetTitle(file.name)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <FilePdf size={12} />
                              {file.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveBulkFile(index)}
                            >
                              <X size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBulkUploadOpen(false)
                setSelectedFiles([])
              }}
              disabled={uploadingFile}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpload} 
              disabled={uploadingFile || selectedFiles.length === 0}
            >
              {uploadingFile ? `Uploading ${selectedFiles.length} file(s)...` : `Upload ${selectedFiles.length} Sheet(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
