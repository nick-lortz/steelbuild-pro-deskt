import { useState } from 'react'
import { CheckCircle, Pencil, Save, X } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export interface FieldProgressEntry {
  id: string
  projectId: string
  costCodeId?: string
  activityName: string
  percentComplete: number
  previousPercentComplete: number
  updatedBy: string
  updatedAt: string
  notes?: string
  photos?: string[]
  verifiedBy?: string
  verifiedAt?: string
}

interface FieldProgressTrackerProps {
  projectId: string
  activities: Array<{
    id: string
    name: string
    costCodeId?: string
    percentComplete: number
  }>
  onProgressUpdate: (activityId: string, percentComplete: number, notes?: string) => Promise<void>
}

export function FieldProgressTracker({ projectId, activities, onProgressUpdate }: FieldProgressTrackerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleStartEdit = (activity: typeof activities[0]) => {
    setEditingId(activity.id)
    setEditValue(activity.percentComplete)
    setEditNotes('')
  }

  const handleSave = async (activityId: string) => {
    if (editValue < 0 || editValue > 100) {
      toast.error('Progress must be between 0 and 100%')
      return
    }

    setSaving(true)
    try {
      await onProgressUpdate(activityId, editValue, editNotes || undefined)
      setEditingId(null)
      setEditValue(0)
      setEditNotes('')
      toast.success('Progress updated successfully')
    } catch (error) {
      console.error('Failed to update progress:', error)
      toast.error('Failed to update progress')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue(0)
    setEditNotes('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Field Progress</h3>
          <p className="text-sm text-muted-foreground">
            Track work completion to automatically update SOV billing
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {activities.filter(a => a.percentComplete === 100).length} / {activities.length} Complete
        </Badge>
      </div>

      <div className="grid gap-3">
        {activities.map(activity => {
          const isEditing = editingId === activity.id
          const displayValue = isEditing ? editValue : activity.percentComplete

          return (
            <Card key={activity.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{activity.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {activity.costCodeId && `Cost Code: ${activity.costCodeId}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.percentComplete === 100 && (
                      <CheckCircle size={20} weight="fill" className="text-green-600" />
                    )}
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(activity)}
                      >
                        <Pencil size={16} />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSave(activity.id)}
                          disabled={saving}
                        >
                          <Save size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          <X size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isEditing ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Progress value={displayValue} className="flex-1" />
                      <span className="text-sm font-medium w-12 text-right">{displayValue}%</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`progress-${activity.id}`}>
                        Percent Complete
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id={`progress-${activity.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={editValue}
                          onChange={e => setEditValue(parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                        <Progress value={editValue} className="flex-1" />
                        <span className="text-sm font-medium w-12 text-right">{editValue}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${activity.id}`}>
                        Notes (optional)
                      </Label>
                      <Textarea
                        id={`notes-${activity.id}`}
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Add notes about this progress update..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
