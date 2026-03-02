import { useState, useEffect } from 'react'
import { Plus, CurrencyDollar } from '@phosphor-icons/react'
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
import { costCodesDb } from '@/lib/db'
import type { CostCode } from '@/lib/types'
import { CostCodeFormDialog } from './cost-code-form-dialog'

export function CostCodesPage() {
  const [costCodes, setCostCodes] = useState<CostCode[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadCostCodes = async () => {
    try {
      const data = await costCodesDb.getAll()
      setCostCodes(data)
    } catch (error) {
      console.error('Failed to load cost codes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCostCodes()
  }, [])

  const getCategoryColor = (category: CostCode['category']) => {
    switch (category) {
      case 'labor':
        return 'bg-blue-100 text-blue-800'
      case 'material':
        return 'bg-green-100 text-green-800'
      case 'equipment':
        return 'bg-purple-100 text-purple-800'
      case 'subcontractor':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading cost codes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cost Codes</h2>
          <p className="text-muted-foreground">Manage your job cost codes and categories</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={18} />
          New Cost Code
        </Button>
      </div>

      {costCodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CurrencyDollar size={64} weight="duotone" className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cost codes yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create cost codes to track labor, materials, equipment, and other project expenses
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus size={18} />
              Create First Cost Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-medium">{code.code}</TableCell>
                  <TableCell>{code.name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(code.category)}>{code.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {code.budgetAmount ? `$${code.budgetAmount.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {code.actualAmount ? `$${code.actualAmount.toLocaleString()}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CostCodeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          loadCostCodes()
        }}
      />
    </div>
  )
}
