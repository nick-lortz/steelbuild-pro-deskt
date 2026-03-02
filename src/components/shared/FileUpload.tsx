import { useState, useRef } from 'react'
import { Upload, File, X, Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
  className?: string
}

export function FileUpload({ onFileSelect, accept, maxSize = 50 * 1024 * 1024, disabled, className }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      return
    }
    setSelectedFile(file)
    onFileSelect(file)
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          dragActive ? 'border-primary bg-accent/10' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <File size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearFile()
              }}
              disabled={disabled}
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 rounded-full bg-primary/10 mb-3">
              <Upload size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">
              Drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {accept ? `Accepted: ${accept}` : 'All file types accepted'}
              {maxSize && ` (Max ${maxSize / (1024 * 1024)}MB)`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface FileUploadWithProgressProps extends FileUploadProps {
  uploading?: boolean
  progress?: number
  uploadComplete?: boolean
}

export function FileUploadWithProgress({
  uploading,
  progress = 0,
  uploadComplete,
  ...props
}: FileUploadWithProgressProps) {
  return (
    <div className="space-y-3">
      <FileUpload {...props} disabled={props.disabled || uploading} />
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
      {uploadComplete && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check size={16} weight="bold" />
          <span>Upload complete</span>
        </div>
      )}
    </div>
  )
}
