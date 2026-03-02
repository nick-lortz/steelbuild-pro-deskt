import { useState } from 'react'
import { FileText, DownloadSimple, FolderOpen, Trash, Eye } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { DrawingSheet } from '@/types/electron'

interface DrawingSheetViewerProps {
  sheet: DrawingSheet
  onDelete?: (sheetId: string) => void
}

export function DrawingSheetViewer({ sheet, onDelete }: DrawingSheetViewerProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!sheet.file_key || !window.SBP?.file) {
      toast.error('No file attached to this sheet')
      return
    }

    setDownloading(true)
    try {
      const result = await window.SBP.file.downloadDrawing(sheet.file_key)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to download file')
      }

      const blob = new Blob([new Uint8Array(result.data.buffer)], {
        type: result.data.mimeType,
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.data.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('File downloaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const handleOpen = async () => {
    if (!sheet.file_key || !window.SBP?.file) {
      toast.error('No file attached to this sheet')
      return
    }

    try {
      const result = await window.SBP.file.openDrawing(sheet.file_key)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to open file')
      }
      
      toast.success('Opening file...')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open file')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete sheet ${sheet.sheet_no}?`)) {
      return
    }

    if (sheet.file_key && window.SBP?.file) {
      try {
        await window.SBP.file.deleteDrawing(sheet.file_key)
      } catch (error) {
        console.error('Failed to delete file:', error)
      }
    }

    if (onDelete) {
      onDelete(sheet.id)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <FileText size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-mono text-sm font-semibold">{sheet.sheet_no}</h4>
                <Badge variant="outline" className="text-xs">
                  {sheet.status}
                </Badge>
              </div>
              <p className="text-sm text-foreground mb-1">{sheet.title}</p>
              {sheet.file_key ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye size={12} />
                  File attached
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No file attached</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 flex-shrink-0">
            {sheet.file_key && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleOpen}
                  title="Open in default application"
                >
                  <FolderOpen size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  disabled={downloading}
                  title="Download file"
                >
                  <DownloadSimple size={16} />
                </Button>
              </>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                title="Delete sheet"
              >
                <Trash size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
