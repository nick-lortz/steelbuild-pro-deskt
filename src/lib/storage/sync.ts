import { offlineCache } from './db'
import { checkNetworkConnection } from '@/hooks/use-online-status'

export interface SyncOptions {
  cacheKey: string
  fetchFn: () => Promise<any>
  cacheFn: (data: any) => Promise<void>
  getCachedFn: () => Promise<any>
  forceRefresh?: boolean
}

export interface SyncResult<T> {
  data: T | null
  isFromCache: boolean
  lastSyncAt?: string
  error?: string
}

export async function syncData<T>(options: SyncOptions): Promise<SyncResult<T>> {
  const { cacheKey, fetchFn, cacheFn, getCachedFn, forceRefresh } = options

  const isOnline = await checkNetworkConnection()

  if (!isOnline) {
    const cachedData = await getCachedFn()
    const syncMeta = await offlineCache.getSyncMetadata(cacheKey)
    
    return {
      data: cachedData,
      isFromCache: true,
      lastSyncAt: syncMeta?.lastSyncAt,
    }
  }

  try {
    const freshData = await fetchFn()
    
    await cacheFn(freshData)
    await offlineCache.setSyncMetadata(cacheKey, 'success')
    
    return {
      data: freshData,
      isFromCache: false,
      lastSyncAt: new Date().toISOString(),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await offlineCache.setSyncMetadata(cacheKey, 'failed', errorMessage)
    
    const cachedData = await getCachedFn()
    const syncMeta = await offlineCache.getSyncMetadata(cacheKey)
    
    return {
      data: cachedData,
      isFromCache: true,
      lastSyncAt: syncMeta?.lastSyncAt,
      error: errorMessage,
    }
  }
}

export async function syncDashboard(projectId?: string): Promise<SyncResult<any>> {
  return syncData({
    cacheKey: `dashboard-${projectId || 'global'}`,
    fetchFn: async () => {
      return {}
    },
    cacheFn: async (data) => {
      await offlineCache.cacheDashboard(projectId, data)
    },
    getCachedFn: async () => {
      const cached = await offlineCache.getDashboard(projectId)
      return cached?.data
    },
  })
}

export async function syncProjects(): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: 'projects',
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheProjects(data)
    },
    getCachedFn: async () => {
      return await offlineCache.getProjects()
    },
  })
}

export async function syncRFIs(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `rfis-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheRFIs(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getRFIs(projectId)
    },
  })
}

export async function syncCostCodes(projectId?: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `costCodes-${projectId || 'global'}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheCostCodes(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getCostCodes(projectId)
    },
  })
}

export async function syncEquipment(projectId?: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `equipment-${projectId || 'global'}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheEquipment(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getEquipment(projectId)
    },
  })
}

export async function syncChangeOrders(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `changeOrders-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheChangeOrders(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getChangeOrders(projectId)
    },
  })
}

export async function syncContracts(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `contracts-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheContracts(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getContracts(projectId)
    },
  })
}

export async function syncDrawings(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `drawings-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheDrawings(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getDrawings(projectId)
    },
  })
}

export async function syncDeliveries(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `deliveries-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheDeliveries(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getDeliveries(projectId)
    },
  })
}

export async function syncTasks(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `tasks-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheTasks(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getTasks(projectId)
    },
  })
}

export async function syncLabor(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `labor-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheLabor(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getLabor(projectId)
    },
  })
}

export async function syncWorkPackages(projectId: string): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: `workPackages-${projectId}`,
    fetchFn: async () => {
      return []
    },
    cacheFn: async (data) => {
      await offlineCache.cacheWorkPackages(projectId, data)
    },
    getCachedFn: async () => {
      return await offlineCache.getWorkPackages(projectId)
    },
  })
}
