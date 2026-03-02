import { useOnlineStatus } from '@/hooks/use-online-status'
import { offlineCache } from '@/lib/storage/db'
import { WifiSlash, Wifi, Clock } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    async function getLastSyncTime() {
      const allMeta = await offlineCache.getAllSyncMetadata()
      if (allMeta.length > 0) {
        const latest = allMeta.reduce((latest, current) => {
          return new Date(current.lastSyncAt) > new Date(latest.lastSyncAt) ? current : latest
        })
        setLastSync(latest.lastSyncAt)
      }
    }

    getLastSyncTime()
    const interval = setInterval(getLastSyncTime, 30000)

    return () => clearInterval(interval)
  }, [isOnline])

  if (isOnline && !lastSync) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <Badge variant="destructive" className="gap-1.5">
                <WifiSlash weight="fill" className="w-3.5 h-3.5" />
                Offline
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <Wifi weight="fill" className="w-3.5 h-3.5" />
                Online
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-1">
            <div className="font-medium">
              {isOnline ? 'Connected' : 'Offline Mode'}
            </div>
            {lastSync && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last sync: {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
              </div>
            )}
            {!isOnline && (
              <div className="text-xs text-muted-foreground mt-1">
                Showing cached data. Changes will sync when online.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
