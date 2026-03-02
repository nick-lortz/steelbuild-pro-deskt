import { useState } from 'react'
import { Lock, Pencil, Trash, Upload, Eye } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import type { DrawingSheet } from '@/lib/types'

interface DrawingSheetCardProps {
  sheet: DrawingSheet & { status?: 'IFA' | 'BFA' | 'OFS' | 'BFS' | 'FFF' | 'draft' | 'approved' | 'superseded' }
  userRole?: 'owner' | 'admin' | 'member' | 'viewer'
  onEdit?: (sheet: DrawingSheet) => void
  onDelete?: (sheetId: string) => void
  onUploadRevision?: (sheetId: string) => void
  onView?: (sheetId: string) => void
}

export function DrawingSheetCard({
  sheet,
  userRole = 'member',
  onEdit,
  onDelete,
  onUploadRevision,
  onView,
}: DrawingSheetCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isFFFlocked = sheet.status === 'FFF'
  const canEditOrDelete = !isFFFlocked || userRole === 'admin' || userRole === 'owner'

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'FFF':
        return 'destructive'
      case 'BFS':
      case 'OFS':
        return 'default'
      case 'BFA':
      case 'IFA':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IFA':
        return 'Issued for Approval'
      case 'BFA':
        return 'Build for Approval'
      case 'OFS':
        return 'Open for Shop'
      case 'BFS':
        return 'Build for Shop'
      case 'FFF':
        return 'Final for Fabrication'
      default:
        return status
    }
  }

  const handleEdit = () => {
    if (!canEditOrDelete) {
      toast.error('This drawing is locked (FFF status). Only Admins can edit.')
      return
    }
    onEdit?.(sheet)
  }

  const handleDelete = () => {
    if (!canEditOrDelete) {
      toast.error('This drawing is locked (FFF status). Only Admins can delete.')
      return
    }
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    onDelete?.(sheet.id)
    setShowDeleteDialog(false)
    toast.success('Sheet deleted successfully')
  }

  const handleUploadRevision = () => {
    if (!canEditOrDelete) {
      toast.error('This drawing is locked (FFF status). Only Admins can upload new revisions.')
      return
    }
    onUploadRevision?.(sheet.id)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {sheet.sheetNumber} - {sheet.title}
                  {isFFFlocked && (
                    <Lock className="w-4 h-4 text-destructive" weight="fill" />
                  )}
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Rev: {sheet.currentRevision || 'Initial'} • {sheet.discipline || 'Structural'}
              </CardDescription>
            </div>
            <Badge variant={getStatusVariant(sheet.status || 'draft')}>
              {getStatusLabel(sheet.status || 'draft')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onView?.(sheet.id)}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={!canEditOrDelete}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadRevision}
              disabled={!canEditOrDelete}
            >
              <Upload className="w-4 h-4 mr-2" />
              New Revision
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={!canEditOrDelete}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
          {isFFFlocked && (
            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5 bg-destructive/10 p-2 rounded">
              <Lock className="w-3 h-3 text-destructive" />
              <span>
                This drawing is marked Final for Fabrication and is locked for all users except Admins.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Drawing Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {sheet.sheetNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
