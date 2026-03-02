import { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  className?: string
  headerClassName?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  emptyState?: ReactNode
  rowClassName?: (item: T) => string
  onRowClick?: (item: T) => void
  stickyHeader?: boolean
  striped?: boolean
  compact?: boolean
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  emptyState,
  rowClassName,
  onRowClick,
  stickyHeader = false,
  striped = false,
  compact = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="border border-border/50 rounded-lg bg-gradient-to-b from-card/50 to-card backdrop-blur-sm">
        <div className="flex items-center justify-center py-16">
          {emptyState || (
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', stickyHeader && 'max-h-[600px] overflow-auto')}>
      <Table>
        <TableHeader className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.headerClassName,
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              className={cn(
                rowClassName?.(item),
                onRowClick && 'cursor-pointer',
                striped && index % 2 === 1 && 'bg-muted/20',
                compact ? 'h-12' : 'h-14'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    column.className,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    compact && 'py-2'
                  )}
                >
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
