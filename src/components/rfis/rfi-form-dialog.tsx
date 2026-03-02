import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { businessRules, BusinessRuleError } from '@/lib/business-rules'
import type { RFI } from '@/lib/types'
import { useKV } from '@github/spark/hooks'

interface RFIFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  projectId: string
  rfi?: RFI
}

export function RFIFormDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  rfi,
}: RFIFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [rfis, setRfis] = useKV<RFI[]>(`project:${projectId}:rfis`, [])
  
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: rfi || {
      number: '',
      subject: '',
      question: '',
      status: 'open' as const,
      priority: 'medium' as const,
      submittedBy: '',
      submittedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
    },
  })

  useEffect(() => {
    if (rfi) {
      reset(rfi)
    } else {
      reset({
        number: '',
        subject: '',
        question: '',
        status: 'open' as const,
        priority: 'medium' as const,
        submittedBy: '',
        submittedDate: new Date().toISOString().split('T')[0],
        dueDate: '',
      })
    }
  }, [rfi, reset])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await businessRules.uniqueness.validateRFINumber(
        projectId,
        data.number,
        rfi?.id
      )

      const now = new Date().toISOString()
      
      if (rfi) {
        const updatedRfi: RFI = {
          ...rfi,
          ...data,
        }
        
        setRfis((current) =>
          (current || []).map((r) => (r.id === rfi.id ? updatedRfi : r))
        )
        toast.success('RFI updated successfully')
      } else {
        const newRFI: RFI = {
          ...data,
          id: crypto.randomUUID(),
          projectId,
          createdAt: now,
        }
        
        setRfis((current) => [...(current || []), newRFI])
        toast.success('RFI created successfully')
      }
      
      onSuccess()
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to save RFI')
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rfi ? 'Edit' : 'Create'} RFI</DialogTitle>
          <DialogDescription>
            Request for Information - Submit questions or clarifications
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="number">RFI Number *</Label>
              <Input 
                id="number" 
                {...register('number', { required: true })} 
                className="font-mono"
                placeholder="RFI-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submittedBy">Submitted By *</Label>
              <Input 
                id="submittedBy" 
                {...register('submittedBy', { required: true })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input 
              id="subject" 
              {...register('subject', { required: true })} 
              placeholder="Brief description of the question"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Textarea 
              id="question" 
              {...register('question', { required: true })} 
              rows={4}
              placeholder="Detailed question or clarification needed..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as RFI['status'])}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as RFI['priority'])}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="submittedDate">Date Submitted</Label>
              <Input id="submittedDate" type="date" {...register('submittedDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answeredDate">Date Answered</Label>
              <Input id="answeredDate" type="date" {...register('answeredDate')} />
            </div>
          </div>

          {watch('status') !== 'open' && (
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea 
                id="answer" 
                {...register('answer')} 
                rows={4}
                placeholder="Response to the RFI..."
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : rfi ? 'Update' : 'Create'} RFI
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
