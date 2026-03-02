import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { 
  CaretLeft, 
  CaretRight, 
  MagnifyingGlassMinus, 
  MagnifyingGlassPlus,
  ArrowsOut,
  ArrowsIn,
  X,
  Spinner
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  fileKey: string
  fileName?: string
  onClose?: () => void
}

export function PDFViewer({ fileKey, fileName = 'Document', onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const loadPDF = async () => {
      if (!window.SBP?.file) {
        setError('File system not available')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await window.SBP.file.downloadDrawing(fileKey)
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load PDF')
        }

        setPdfData(new Uint8Array(result.data.buffer))
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load PDF'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    loadPDF()
  }, [fileKey])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const onDocumentLoadError = (error: Error) => {
    setError('Failed to load PDF document')
    toast.error('Failed to load PDF: ' + error.message)
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset
      return Math.min(Math.max(1, newPageNumber), numPages)
    })
  }

  const previousPage = () => changePage(-1)
  const nextPage = () => changePage(1)
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => setScale(1.0)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (loading) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size={48} className="animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading PDF...</p>
      </Card>
    )
  }

  if (error || !pdfData) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <X size={48} className="text-destructive mb-4" />
        <p className="text-destructive font-medium mb-2">Error Loading PDF</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    )
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'}`}>
      <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{fileName}</span>
          {numPages > 0 && (
            <span className="text-sm text-muted-foreground">
              ({numPages} {numPages === 1 ? 'page' : 'pages'})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 border rounded-lg bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="h-7 px-2"
            >
              <CaretLeft size={16} />
            </Button>
            <span className="text-sm font-mono min-w-[80px] text-center">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="h-7 px-2"
            >
              <CaretRight size={16} />
            </Button>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 border rounded-lg bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-7 px-2"
              title="Zoom Out"
            >
              <MagnifyingGlassMinus size={16} />
            </Button>
            <span className="text-sm font-mono min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="h-7 px-2"
              title="Zoom In"
            >
              <MagnifyingGlassPlus size={16} />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            className="h-8"
          >
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="flex justify-center p-8">
          <div className="shadow-2xl">
            <Document
              file={{ data: pdfData }}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center min-h-[600px] bg-white">
                  <Spinner size={32} className="animate-spin text-primary" />
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="border border-border"
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  )
}
