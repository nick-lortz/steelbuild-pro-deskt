import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/button'
import { FileText, ListChecks, CurrencyDollar, Calendar, Hammer, Package, Truck } from '@phosphor-icons/react'

interface EntityLinkProps {
  type: 'project' | 'rfi' | 'task' | 'drawing' | 'cost-code' | 'work-package' | 'submittal' | 'delivery' | 'change-order'
  id: string
  projectId?: string
  label: string
  className?: string
  showIcon?: boolean
}

export function EntityLink({ type, id, projectId, label, className = '', showIcon = true }: EntityLinkProps) {
  const getIcon = () => {
    switch (type) {
      case 'rfi': return <FileText className="w-4 h-4" />
      case 'task': return <ListChecks className="w-4 h-4" />
      case 'cost-code': return <CurrencyDollar className="w-4 h-4" />
      case 'drawing': return <FileText className="w-4 h-4" />
      case 'work-package': return <Package className="w-4 h-4" />
      case 'submittal': return <FileText className="w-4 h-4" />
      case 'delivery': return <Truck className="w-4 h-4" />
      case 'change-order': return <CurrencyDollar className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  const getPath = () => {
    if (type === 'project') return `/projects/${id}`
    if (!projectId) return '#'
    
    switch (type) {
      case 'rfi': return `/projects/${projectId}/rfis`
      case 'task': return `/projects/${projectId}/schedule`
      case 'drawing': return `/projects/${projectId}/drawings`
      case 'cost-code': return `/projects/${projectId}/cost-codes`
      case 'work-package': return `/projects/${projectId}/work-packages`
      case 'submittal': return `/projects/${projectId}/submittals`
      case 'delivery': return `/projects/${projectId}/deliveries`
      case 'change-order': return `/projects/${projectId}/change-orders`
      default: return `/projects/${projectId}`
    }
  }

  return (
    <Link
      to={getPath()}
      className={`inline-flex items-center gap-1.5 text-sm text-primary hover:underline ${className}`}
    >
      {showIcon && getIcon()}
      {label}
    </Link>
  )
}

interface EntityBadgeLinkProps extends EntityLinkProps {
  variant?: 'default' | 'secondary' | 'outline'
}

export function EntityBadgeLink({ variant = 'outline', ...props }: EntityBadgeLinkProps) {
  return (
    <Link to={props.type === 'project' ? `/projects/${props.id}` : '#'}>
      <Badge variant={variant} className="cursor-pointer hover:bg-accent">
        {props.showIcon && props.type !== 'project' && (
          <span className="mr-1.5">{/* Icon would go here */}</span>
        )}
        {props.label}
      </Badge>
    </Link>
  )
}
