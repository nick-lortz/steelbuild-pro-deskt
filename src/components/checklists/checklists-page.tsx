import { ListChecks } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'

export function ChecklistsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Checklists</h2>
        <p className="text-muted-foreground">Manage safety inspections and QA/QC checklists</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ListChecks size={64} weight="duotone" className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Checklists module</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Create and manage safety inspections, pre-erection checklists, and QA/QC procedures
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
