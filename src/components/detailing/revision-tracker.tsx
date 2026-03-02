import { useState } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowsClockwise,
  FileText,
  User
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Revision {
  id: string
  revisionNumber: number
  description: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
  changes: string[]
  attachments: Array<{ name: string; url: string }>
}

interface RevisionTrackerProps {
  detailingId: string
  currentRevision: number
  revisions: Revision[]
  onNewRevision: (revision: Omit<Revision, 'id' | 'createdAt'>) => void
  onApproveRevision: (revisionId: string, approver: string) => void
  onRejectRevision: (revisionId: string, reason: string) => void
}

export function RevisionTracker({
  detailingId,
  currentRevision,
  revisions,
  onNewRevision,
  onApproveRevision,
  onRejectRevision
}: RevisionTrackerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [formData, setFormData] = useState({
    description: '',
    changes: '',
    createdBy: ''
  })

  const handleCreateRevision = () => {
    if (!formData.description || !formData.createdBy) {
      toast.error('Please fill in all required fields')
      return
    }

    const changes = formData.changes
      .split('\n')
      .filter(c => c.trim())
      .map(c => c.trim())

    onNewRevision({
      revisionNumber: currentRevision + 1,
      description: formData.description,
      status: 'draft',
      createdBy: formData.createdBy,
      changes,
      attachments: []
    })

    setFormData({ description: '', changes: '', createdBy: '' })
    setIsCreateDialogOpen(false)
    toast.success(`Revision ${currentRevision + 1} created`)
  }

  const handleApprove = () => {
    if (!selectedRevision) return
    
    const approver = prompt('Enter your name:')
    if (!approver) return

    onApproveRevision(selectedRevision.id, approver)
    setIsApprovalDialogOpen(false)
    setSelectedRevision(null)
    toast.success('Revision approved')
  }

  const handleReject = () => {
    if (!selectedRevision || !rejectReason) {
      toast.error('Please provide a rejection reason')
      return
    }

    onRejectRevision(selectedRevision.id, rejectReason)
    setIsRejectDialogOpen(false)
    setSelectedRevision(null)
    setRejectReason('')
    toast.success('Revision rejected')
  }

  const getStatusColor = (status: Revision['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'submitted':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: Revision['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle weight="fill" className="text-green-500" />
      case 'rejected':
        return <XCircle weight="fill" className="text-red-500" />
      case 'submitted':
        return <Clock className="text-yellow-500" />
      default:
        return <FileText className="text-gray-500" />
    }
  }

  const sortedRevisions = [...revisions].sort((a, b) => b.revisionNumber - a.revisionNumber)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Revision History</h3>
          <p className="text-sm text-muted-foreground">
            Current: Rev {currentRevision} • Total: {revisions.length}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2"
          size="sm"
        >
          <ArrowsClockwise size={16} />
          New Revision
        </Button>
      </div>

      <div className="space-y-3">
        {sortedRevisions.map((revision) => (
          <div
            key={revision.id}
            className="border rounded-lg p-4 hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(revision.status)}
                <div>
                  <div className="font-semibold">
                    Revision {revision.revisionNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {revision.description}
                  </div>
                </div>
              </div>
              <Badge className={`${getStatusColor(revision.status)} border`}>
                {revision.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User size={14} />
                <span>Created by {revision.createdBy}</span>
                <span>•</span>
                <span>{format(new Date(revision.createdAt), 'MMM d, yyyy')}</span>
              </div>

              {revision.approvedBy && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={14} weight="fill" />
                  <span>Approved by {revision.approvedBy}</span>
                  {revision.approvedAt && (
                    <>
                      <span>•</span>
                      <span>{format(new Date(revision.approvedAt), 'MMM d, yyyy')}</span>
                    </>
                  )}
                </div>
              )}

              {revision.rejectedReason && (
                <div className="text-red-400 text-sm">
                  <span className="font-medium">Rejected:</span> {revision.rejectedReason}
                </div>
              )}

              {revision.changes.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Changes:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {revision.changes.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {revision.status === 'submitted' && (
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setSelectedRevision(revision)
                    setIsApprovalDialogOpen(true)
                  }}
                >
                  <CheckCircle size={16} />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    setSelectedRevision(revision)
                    setIsRejectDialogOpen(true)
                  }}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}

        {revisions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText size={48} className="mx-auto mb-2 opacity-50" />
            <p>No revisions yet</p>
            <p className="text-sm">Create the first revision to start tracking</p>
          </div>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Revision</DialogTitle>
            <DialogDescription>
              Document changes for revision {currentRevision + 1}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Revision Number</Label>
              <Input value={currentRevision + 1} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                placeholder="Brief description of this revision"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createdBy">
                Created By <span className="text-destructive">*</span>
              </Label>
              <Input
                id="createdBy"
                placeholder="Your name"
                value={formData.createdBy}
                onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="changes">Changes (one per line)</Label>
              <Textarea
                id="changes"
                placeholder="List of changes in this revision..."
                value={formData.changes}
                onChange={(e) => setFormData({ ...formData, changes: e.target.value })}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRevision}>Create Revision</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Revision</DialogTitle>
            <DialogDescription>
              Confirm approval of Revision {selectedRevision?.revisionNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to approve this revision? This action will allow the drawings to proceed to fabrication.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} className="gap-2">
                <CheckCircle size={16} />
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Revision</DialogTitle>
            <DialogDescription>
              Provide reason for rejecting Revision {selectedRevision?.revisionNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectReason"
                placeholder="Explain why this revision needs to be revised..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                className="gap-2"
              >
                <XCircle size={16} />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
