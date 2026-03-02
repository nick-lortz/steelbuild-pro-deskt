import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MeetingsPage() {
  const { projectId } = useParams()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Project ID: {projectId}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Meetings content coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
