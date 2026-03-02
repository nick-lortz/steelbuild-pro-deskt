import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { costCodesDb } from '@/lib/db'

interface CostCodeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CostCodeFormDialog({ open, onOpenChange, onSuccess }: CostCodeFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      code: '',
      name: '',
      category: 'labor' as const,
      budgetAmount: 0,
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await costCodesDb.create(data)
      toast.success('Cost code created successfully')
      onSuccess()
    } catch (error) {
      toast.error('Failed to create cost code')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Cost Code</DialogTitle>
          <DialogDescription>Add a new cost code for tracking project expenses</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Cost Code *</Label>
              <Input id="code" {...register('code', { required: true })} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                defaultValue={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetAmount">Budget Amount</Label>
            <Input
              id="budgetAmount"
              type="number"
              step="0.01"
              {...register('budgetAmount', { valueAsNumber: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Cost Code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
