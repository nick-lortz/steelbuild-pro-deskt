import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { PDFViewer } from '@/components/shared/PDFViewer'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function DrawingViewerPage() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const fileKey = searchParams.get('fileKey')
  const fileName = searchParams.get('fileName') || 'Drawing'
  
  const handleClose = () => {
    navigate(`/projects/${projectId}/drawings`)
  }

  if (!fileKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-lg text-muted-foreground">No file specified</p>
        <Button onClick={handleClose}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Drawings
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <PDFViewer
        fileKey={fileKey}
        fileName={fileName}
        onClose={handleClose}
      />
    </div>
  )
}
