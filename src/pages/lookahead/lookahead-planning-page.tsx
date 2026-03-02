import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, CalendarBlank, Wrench, Users, Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { LookAheadPlan } from '@/lib/types'

export function LookAheadPlanningPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [plans, setPlans] = useKV<LookAheadPlan[]>('lookahead-plans', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const projectPlans = plans.filter(p => p.projectId === projectId).sort((a, b) => 
    new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  )

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const weekStart = new Date(formData.get('weekStart') as string)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const newPlan: LookAheadPlan = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      weekNumber: getWeekNumber(weekStart),
      year: weekStart.getFullYear(),
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      status: 'draft',
      plannedActivities: [],
      constraints: (formData.get('constraints') as string).split('\n').filter(Boolean),
      materialRequirements: [],
      equipmentNeeds: [],
      laborRequirements: [],
      safetyConsiderations: (formData.get('safetyConsiderations') as string).split('\n').filter(Boolean),
      weatherForecast: formData.get('weatherForecast') as string,
      notes: formData.get('notes') as string,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setPlans(current => [...current, newPlan])
    toast.success('Look-ahead plan created')
    setIsDialogOpen(false)
    e.currentTarget.reset()
  }

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const updateStatus = (id: string, status: LookAheadPlan['status']) => {
    setPlans(current => current.map(p =>
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
    ))
    toast.success('Status updated')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Look-Ahead Planning</h1>
          <p className="text-muted-foreground">Weekly planning and coordination</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Look-Ahead Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weekStart">Week Start Date *</Label>
                <Input id="weekStart" name="weekStart" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints (one per line)</Label>
                <Textarea
                  id="constraints"
                  name="constraints"
                  placeholder="Equipment availability&#10;Material delivery dates&#10;Weather concerns"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="safetyConsiderations">Safety Considerations (one per line)</Label>
                <Textarea
                  id="safetyConsiderations"
                  name="safetyConsiderations"
                  placeholder="Fall protection required&#10;Crane operations&#10;Hot work permits"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weatherForecast">Weather Forecast</Label>
                <Input
                  id="weatherForecast"
                  name="weatherForecast"
                  placeholder="Mostly sunny, 65-75°F"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional planning notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Plan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projectPlans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarBlank className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No look-ahead plans</h3>
            <p className="text-muted-foreground">Create your first weekly plan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarBlank size={24} />
                      Week {plan.weekNumber}, {plan.year}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(plan.weekStart).toLocaleDateString()} - {new Date(plan.weekEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                      plan.status === 'published' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {plan.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(plan.id, 
                        plan.status === 'draft' ? 'published' :
                        plan.status === 'published' ? 'completed' :
                        'draft'
                      )}
                    >
                      {plan.status === 'draft' ? 'Publish' :
                       plan.status === 'published' ? 'Complete' :
                       'Reopen'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.weatherForecast && (
                  <div>
                    <h4 className="font-semibold mb-1">Weather Forecast</h4>
                    <p className="text-sm text-muted-foreground">{plan.weatherForecast}</p>
                  </div>
                )}
                
                {plan.constraints.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Constraints</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {plan.constraints.map((constraint, i) => (
                        <li key={i} className="text-sm">{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.safetyConsiderations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-700">Safety Considerations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {plan.safetyConsiderations.map((safety, i) => (
                        <li key={i} className="text-sm">{safety}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.notes && (
                  <div>
                    <h4 className="font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{plan.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="text-muted-foreground" />
                    <span>{plan.materialRequirements.length} Materials</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="text-muted-foreground" />
                    <span>{plan.equipmentNeeds.length} Equipment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="text-muted-foreground" />
                    <span>{plan.laborRequirements.length} Labor</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
