import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EquipmentPage() {
  const { projectId } = useParams()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Project ID: {projectId}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Equipment content coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
