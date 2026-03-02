import { useState, useEffect } from 'react'
import { Plus, Crane } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { equipmentDb } from '@/lib/db'
import type { Equipment } from '@/lib/types'
import { EquipmentFormDialog } from './equipment-form-dialog'

export function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadEquipment = async () => {
    try {
      const data = await equipmentDb.getAll()
      setEquipment(data)
    } catch (error) {
      console.error('Failed to load equipment:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEquipment()
  }, [])

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'in-use':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'retired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading equipment...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipment</h2>
          <p className="text-muted-foreground">Manage your cranes, welders, and other equipment</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={18} />
          Add Equipment
        </Button>
      </div>

      {equipment.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Crane size={64} weight="duotone" className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No equipment yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Add your equipment inventory to track availability and maintenance
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus size={18} />
              Add First Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="capitalize">{item.type}</TableCell>
                  <TableCell>{item.model || '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{item.serialNumber || '—'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>{item.location || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <EquipmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          loadEquipment()
        }}
      />
    </div>
  )
}
