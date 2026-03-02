import Dexie, { type EntityTable } from 'dexie'

export interface CachedDashboard {
  id: string
  projectId?: string
  data: any
  cachedAt: string
}

export interface CachedProject {
  id: string
  data: any
  cachedAt: string
}

export interface CachedCounts {
  id: string
  projectId?: string
  counts: any
  cachedAt: string
}

export interface CachedRFI {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface CachedCostCode {
  id: string
  projectId?: string
  data: any
  cachedAt: string
}

export interface CachedEquipment {
  id: string
  projectId?: string
  data: any
  cachedAt: string
}

export interface CachedChangeOrder {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface CachedContract {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface CachedDrawing {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface CachedDelivery {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface CachedTask {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface CachedLabor {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface CachedWorkPackage {
  id: string
  projectId: string
  data: any
  cachedAt: string
}

export interface SyncMetadata {
  key: string
  lastSyncAt: string
  syncStatus: 'success' | 'failed' | 'pending'
  errorMessage?: string
}

const db = new Dexie('SteelBuildProDB') as Dexie & {
  cachedDashboards: EntityTable<CachedDashboard, 'id'>
  cachedProjects: EntityTable<CachedProject, 'id'>
  cachedCounts: EntityTable<CachedCounts, 'id'>
  cachedRFIs: EntityTable<CachedRFI, 'id'>
  cachedCostCodes: EntityTable<CachedCostCode, 'id'>
  cachedEquipment: EntityTable<CachedEquipment, 'id'>
  cachedChangeOrders: EntityTable<CachedChangeOrder, 'id'>
  cachedContracts: EntityTable<CachedContract, 'id'>
  cachedDrawings: EntityTable<CachedDrawing, 'id'>
  cachedDeliveries: EntityTable<CachedDelivery, 'id'>
  cachedTasks: EntityTable<CachedTask, 'id'>
  cachedLabor: EntityTable<CachedLabor, 'id'>
  cachedWorkPackages: EntityTable<CachedWorkPackage, 'id'>
  syncMetadata: EntityTable<SyncMetadata, 'key'>
}

db.version(1).stores({
  cachedDashboards: 'id, projectId, cachedAt',
  cachedProjects: 'id, cachedAt',
  cachedCounts: 'id, projectId, cachedAt',
  cachedRFIs: 'id, projectId, cachedAt',
  cachedCostCodes: 'id, projectId, cachedAt',
  cachedEquipment: 'id, projectId, cachedAt',
  cachedChangeOrders: 'id, projectId, cachedAt',
  cachedContracts: 'id, projectId, cachedAt',
  cachedDrawings: 'id, projectId, cachedAt',
  cachedDeliveries: 'id, projectId, cachedAt',
  cachedTasks: 'id, projectId, cachedAt',
  cachedLabor: 'id, projectId, cachedAt',
  cachedWorkPackages: 'id, projectId, cachedAt',
  syncMetadata: 'key, lastSyncAt',
})

export { db }

export const offlineCache = {
  async cacheDashboard(projectId: string | undefined, data: any): Promise<void> {
    const id = projectId || 'global'
    await db.cachedDashboards.put({
      id,
      projectId,
      data,
      cachedAt: new Date().toISOString(),
    })
  },

  async getDashboard(projectId: string | undefined): Promise<CachedDashboard | undefined> {
    const id = projectId || 'global'
    return await db.cachedDashboards.get(id)
  },

  async cacheProjects(projects: any[]): Promise<void> {
    const cached = projects.map(project => ({
      id: project.id,
      data: project,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedProjects.bulkPut(cached)
  },

  async getProjects(): Promise<any[]> {
    const cached = await db.cachedProjects.toArray()
    return cached.map(c => c.data)
  },

  async cacheProject(project: any): Promise<void> {
    await db.cachedProjects.put({
      id: project.id,
      data: project,
      cachedAt: new Date().toISOString(),
    })
  },

  async getProject(id: string): Promise<any | undefined> {
    const cached = await db.cachedProjects.get(id)
    return cached?.data
  },

  async cacheCounts(projectId: string | undefined, counts: any): Promise<void> {
    const id = projectId || 'global'
    await db.cachedCounts.put({
      id,
      projectId,
      counts,
      cachedAt: new Date().toISOString(),
    })
  },

  async getCounts(projectId: string | undefined): Promise<any | undefined> {
    const id = projectId || 'global'
    const cached = await db.cachedCounts.get(id)
    return cached?.counts
  },

  async cacheRFIs(projectId: string, rfis: any[]): Promise<void> {
    const cached = rfis.map(rfi => ({
      id: rfi.id,
      projectId,
      data: rfi,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedRFIs.bulkPut(cached)
  },

  async getRFIs(projectId: string): Promise<any[]> {
    const cached = await db.cachedRFIs.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async cacheCostCodes(projectId: string | undefined, codes: any[]): Promise<void> {
    const cached = codes.map(code => ({
      id: code.id,
      projectId,
      data: code,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedCostCodes.bulkPut(cached)
  },

  async getCostCodes(projectId: string | undefined): Promise<any[]> {
    if (projectId) {
      const cached = await db.cachedCostCodes.where('projectId').equals(projectId).toArray()
      return cached.map(c => c.data)
    } else {
      const cached = await db.cachedCostCodes.where('projectId').equals(undefined as any).toArray()
      return cached.map(c => c.data)
    }
  },

  async cacheEquipment(projectId: string | undefined, equipment: any[]): Promise<void> {
    const cached = equipment.map(eq => ({
      id: eq.id,
      projectId,
      data: eq,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedEquipment.bulkPut(cached)
  },

  async getEquipment(projectId: string | undefined): Promise<any[]> {
    if (projectId) {
      const cached = await db.cachedEquipment.where('projectId').equals(projectId).toArray()
      return cached.map(c => c.data)
    } else {
      const cached = await db.cachedEquipment.toArray()
      return cached.map(c => c.data)
    }
  },

  async cacheChangeOrders(projectId: string, changeOrders: any[]): Promise<void> {
    const cached = changeOrders.map(co => ({
      id: co.id,
      projectId,
      data: co,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedChangeOrders.bulkPut(cached)
  },

  async getChangeOrders(projectId: string): Promise<any[]> {
    const cached = await db.cachedChangeOrders.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async cacheContracts(projectId: string, contracts: any[]): Promise<void> {
    const cached = contracts.map(contract => ({
      id: contract.id,
      projectId,
      data: contract,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedContracts.bulkPut(cached)
  },

  async getContracts(projectId: string): Promise<any[]> {
    const cached = await db.cachedContracts.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async cacheDrawings(projectId: string, drawings: any[]): Promise<void> {
    const cached = drawings.map(drawing => ({
      id: drawing.id,
      projectId,
      data: drawing,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedDrawings.bulkPut(cached)
  },

  async getDrawings(projectId: string): Promise<any[]> {
    const cached = await db.cachedDrawings.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async cacheDeliveries(projectId: string, deliveries: any[]): Promise<void> {
    const cached = deliveries.map(delivery => ({
      id: delivery.id,
      projectId,
      data: delivery,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedDeliveries.bulkPut(cached)
  },

  async getDeliveries(projectId: string): Promise<any[]> {
    const cached = await db.cachedDeliveries.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async cacheTasks(projectId: string, tasks: any[]): Promise<void> {
    const cached = tasks.map(task => ({
      id: task.id,
      projectId,
      data: task,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedTasks.bulkPut(cached)
  },

  async getTasks(projectId: string): Promise<any[]> {
    const cached = await db.cachedTasks.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async cacheLabor(projectId: string, labor: any[]): Promise<void> {
    const cached = labor.map(l => ({
      id: l.id,
      projectId,
      data: l,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedLabor.bulkPut(cached)
  },

  async getLabor(projectId: string): Promise<any[]> {
    const cached = await db.cachedLabor.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async cacheWorkPackages(projectId: string, packages: any[]): Promise<void> {
    const cached = packages.map(pkg => ({
      id: pkg.id,
      projectId,
      data: pkg,
      cachedAt: new Date().toISOString(),
    }))
    await db.cachedWorkPackages.bulkPut(cached)
  },

  async getWorkPackages(projectId: string): Promise<any[]> {
    const cached = await db.cachedWorkPackages.where('projectId').equals(projectId).toArray()
    return cached.map(c => c.data)
  },

  async setSyncMetadata(key: string, status: 'success' | 'failed' | 'pending', error?: string): Promise<void> {
    await db.syncMetadata.put({
      key,
      lastSyncAt: new Date().toISOString(),
      syncStatus: status,
      errorMessage: error,
    })
  },

  async getSyncMetadata(key: string): Promise<SyncMetadata | undefined> {
    return await db.syncMetadata.get(key)
  },

  async getAllSyncMetadata(): Promise<SyncMetadata[]> {
    return await db.syncMetadata.toArray()
  },

  async clearCache(): Promise<void> {
    await db.cachedDashboards.clear()
    await db.cachedProjects.clear()
    await db.cachedCounts.clear()
    await db.cachedRFIs.clear()
    await db.cachedCostCodes.clear()
    await db.cachedEquipment.clear()
    await db.cachedChangeOrders.clear()
    await db.cachedContracts.clear()
    await db.cachedDrawings.clear()
    await db.cachedDeliveries.clear()
    await db.cachedTasks.clear()
    await db.cachedLabor.clear()
    await db.cachedWorkPackages.clear()
    await db.syncMetadata.clear()
  },
}
