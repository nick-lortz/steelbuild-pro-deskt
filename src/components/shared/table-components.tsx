import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  icon?: ReactNode
  className?: string
}

export function StatusBadge({ status, variant = 'default', icon, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant={variant} 
      className={cn(
        'gap-1.5 font-medium px-2.5 py-0.5',
        'shadow-sm',
        className
      )}
    >
      {icon}
      <span className="capitalize">{status}</span>
    </Badge>
  )
}

interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'critical'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PriorityIndicator({ priority, showLabel = false, size = 'md' }: PriorityIndicatorProps) {
  const colors = {
    low: 'bg-secondary',
    medium: 'bg-primary',
    high: 'bg-accent',
    critical: 'bg-destructive',
  }
  
  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn('rounded-full shadow-sm', colors[priority], sizes[size])} />
      {showLabel && <span className="text-sm capitalize">{priority}</span>}
    </div>
  )
}

interface MetricCellProps {
  value: number
  total?: number
  format?: 'currency' | 'percentage' | 'number'
  showProgress?: boolean
  className?: string
}

export function MetricCell({ value, total, format = 'number', showProgress = false, className }: MetricCellProps) {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toLocaleString()
    }
  }

  const percentage = total ? (value / total) * 100 : 0

  return (
    <div className={cn('space-y-1', className)}>
      <div className="font-medium tabular-nums">{formatValue()}</div>
      {showProgress && total && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                percentage >= 100 ? 'bg-success' : 'bg-accent'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}

interface VarianceCellProps {
  budgeted: number
  actual: number
  format?: 'currency' | 'percentage' | 'number'
  className?: string
}

export function VarianceCell({ budgeted, actual, format = 'currency', className }: VarianceCellProps) {
  const variance = budgeted - actual
  const isPositive = variance >= 0
  
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${Math.abs(val).toLocaleString()}`
      case 'percentage':
        return `${Math.abs(val).toFixed(1)}%`
      default:
        return Math.abs(val).toLocaleString()
    }
  }

  return (
    <div className={cn('text-right font-medium tabular-nums', className)}>
      <div className={cn(
        'inline-flex items-center gap-1',
        isPositive ? 'text-success' : 'text-destructive'
      )}>
        <span>{isPositive ? '+' : '-'}</span>
        <span>{formatValue(variance)}</span>
      </div>
    </div>
  )
}

interface TableHeaderGroupProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function TableHeaderGroup({ title, subtitle, actions, className }: TableHeaderGroupProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
