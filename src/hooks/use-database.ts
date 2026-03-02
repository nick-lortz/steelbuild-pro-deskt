import { useState, useEffect, useCallback } from 'react';
import type { RFI, Equipment, CostCode, DashboardCounts, DBResult, PMAInsight, Task } from '@/types/electron';

const isDesktop = typeof window !== 'undefined' && window.SBP?.db;

const fallbackDB = {
  init: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createRFI: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listRFIs: async () => ({ success: false, data: [] as RFI[] }),
  updateRFI: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteRFI: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createEquipment: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listEquipment: async () => ({ success: false, data: [] as Equipment[] }),
  updateEquipment: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteEquipment: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createCostCode: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listCostCodes: async () => ({ success: false, data: [] as CostCode[] }),
  updateCostCode: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteCostCode: async () => ({ success: false, error: 'Not running in desktop mode' }),
  getDashboardCounts: async () => ({ success: false, data: { rfi_count: 0, equipment_count: 0, cost_code_count: 0, total_budget: 0, total_actual: 0 } }),
  listPMAInsights: async () => ({ success: false, data: [] as PMAInsight[] }),
  generatePMAInsights: async () => ({ success: false, data: [] as PMAInsight[] }),
  resolvePMAInsight: async () => ({ success: false, error: 'Not running in desktop mode' }),
  dismissPMAInsight: async () => ({ success: false, error: 'Not running in desktop mode' }),
};

export function useDatabase() {
  const db = isDesktop ? window.SBP!.db : fallbackDB;
  
  return {
    isDesktop,
    db,
  };
}

export function useRFIs(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRFIs = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setRfis([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listRFIs(projectId);
      if (result.success && result.data) {
        setRfis(result.data);
      } else {
        setError(result.error || 'Failed to load RFIs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RFIs');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadRFIs();
  }, [loadRFIs]);

  const createRFI = useCallback(async (data: Partial<RFI>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createRFI({ ...data, project_id: projectId });
    if (result.success) {
      await loadRFIs();
    }
    return result;
  }, [projectId, db, loadRFIs]);

  const updateRFI = useCallback(async (id: string, data: Partial<RFI>) => {
    const result = await db.updateRFI(id, data);
    if (result.success) {
      await loadRFIs();
    }
    return result;
  }, [db, loadRFIs]);

  const deleteRFI = useCallback(async (id: string) => {
    const result = await db.deleteRFI(id);
    if (result.success) {
      await loadRFIs();
    }
    return result;
  }, [db, loadRFIs]);

  return {
    rfis,
    loading,
    error,
    createRFI,
    updateRFI,
    deleteRFI,
    reload: loadRFIs,
  };
}

export function useEquipment(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEquipment = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setEquipment([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listEquipment(projectId);
      if (result.success && result.data) {
        setEquipment(result.data);
      } else {
        setError(result.error || 'Failed to load equipment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const createEquipment = useCallback(async (data: Partial<Equipment>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createEquipment({ ...data, project_id: projectId });
    if (result.success) {
      await loadEquipment();
    }
    return result;
  }, [projectId, db, loadEquipment]);

  const updateEquipment = useCallback(async (id: string, data: Partial<Equipment>) => {
    const result = await db.updateEquipment(id, data);
    if (result.success) {
      await loadEquipment();
    }
    return result;
  }, [db, loadEquipment]);

  const deleteEquipment = useCallback(async (id: string) => {
    const result = await db.deleteEquipment(id);
    if (result.success) {
      await loadEquipment();
    }
    return result;
  }, [db, loadEquipment]);

  return {
    equipment,
    loading,
    error,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    reload: loadEquipment,
  };
}

export function useCostCodes(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCostCodes = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setCostCodes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listCostCodes(projectId);
      if (result.success && result.data) {
        setCostCodes(result.data);
      } else {
        setError(result.error || 'Failed to load cost codes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cost codes');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadCostCodes();
  }, [loadCostCodes]);

  const createCostCode = useCallback(async (data: Partial<CostCode>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createCostCode({ ...data, project_id: projectId });
    if (result.success) {
      await loadCostCodes();
    }
    return result;
  }, [projectId, db, loadCostCodes]);

  const updateCostCode = useCallback(async (id: string, data: Partial<CostCode>) => {
    const result = await db.updateCostCode(id, data);
    if (result.success) {
      await loadCostCodes();
    }
    return result;
  }, [db, loadCostCodes]);

  const deleteCostCode = useCallback(async (id: string) => {
    const result = await db.deleteCostCode(id);
    if (result.success) {
      await loadCostCodes();
    }
    return result;
  }, [db, loadCostCodes]);

  return {
    costCodes,
    loading,
    error,
    createCostCode,
    updateCostCode,
    deleteCostCode,
    reload: loadCostCodes,
  };
}

export function useDashboardCounts(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [counts, setCounts] = useState<DashboardCounts>({
    rfi_count: 0,
    equipment_count: 0,
    cost_code_count: 0,
    total_budget: 0,
    total_actual: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setCounts({
        rfi_count: 0,
        equipment_count: 0,
        cost_code_count: 0,
        total_budget: 0,
        total_actual: 0,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.getDashboardCounts(projectId);
      if (result.success && result.data) {
        setCounts(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard counts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard counts');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  return {
    counts,
    loading,
    error,
    reload: loadCounts,
  };
}

export function usePMAInsights(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [insights, setInsights] = useState<PMAInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setInsights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listPMAInsights(projectId);
      if (result.success && result.data) {
        setInsights(result.data);
      } else {
        setError(result.error || 'Failed to load insights');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const generateInsights = useCallback(async () => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.generatePMAInsights(projectId);
    if (result.success) {
      await loadInsights();
    }
    return result;
  }, [projectId, db, loadInsights]);

  const resolveInsight = useCallback(async (id: string, userId: string) => {
    const result = await db.resolvePMAInsight(id, userId);
    if (result.success) {
      await loadInsights();
    }
    return result;
  }, [db, loadInsights]);

  const dismissInsight = useCallback(async (id: string, userId: string, reason: string) => {
    const result = await db.dismissPMAInsight(id, userId, reason);
    if (result.success) {
      await loadInsights();
    }
    return result;
  }, [db, loadInsights]);

  return {
    insights,
    loading,
    error,
    generateInsights,
    resolveInsight,
    dismissInsight,
    reload: loadInsights,
  };
}
