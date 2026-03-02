import { useState, useEffect, useCallback } from 'react';
import type { RFI, Equipment, CostCode, DashboardCounts, DBResult, PMAInsight, Task, ChangeOrder, Contract } from '@/types/electron';

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
  recalculateProjectTotals: async () => ({ success: false, data: { totalContractValue: 0, totalBudget: 0, totalActual: 0, margin: 0 } }),
  listPMAInsights: async () => ({ success: false, data: [] as PMAInsight[] }),
  generatePMAInsights: async () => ({ success: false, data: [] as PMAInsight[] }),
  resolvePMAInsight: async () => ({ success: false, error: 'Not running in desktop mode' }),
  dismissPMAInsight: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createChangeOrder: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listChangeOrders: async () => ({ success: false, data: [] as ChangeOrder[] }),
  updateChangeOrder: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteChangeOrder: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createContract: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listContracts: async () => ({ success: false, data: [] as Contract[] }),
  updateContract: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteContract: async () => ({ success: false, error: 'Not running in desktop mode' }),
  calculateAutomatedSOV: async () => ({ success: false, data: [] }),
  recalculateProjectBudget: async () => ({ success: false, error: 'Not running in desktop mode' }),
  getProjectFinancialSummary: async () => ({ success: false, error: 'Not running in desktop mode' }),
  updateProjectContractValue: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createDrawingSet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listDrawingSets: async () => ({ success: false, data: [] }),
  updateDrawingSetStatus: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteDrawingSet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createDrawingSheet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listDrawingSheets: async () => ({ success: false, data: [] }),
  updateDrawingSheetStatus: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteDrawingSheet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  setUserPreference: async () => ({ success: false, error: 'Not running in desktop mode' }),
  getUserPreference: async () => ({ success: false, data: null }),
  getAllUserPreferences: async () => ({ success: false, data: {} }),
  deleteUserPreference: async () => ({ success: false, error: 'Not running in desktop mode' }),
  computePortfolioMarginAtRisk: async () => ({ success: false, data: [] }),
  updateProject: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listProjects: async () => ({ success: false, data: [] }),
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

export function useChangeOrders(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChangeOrders = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setChangeOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listChangeOrders(projectId);
      if (result.success && result.data) {
        setChangeOrders(result.data);
      } else {
        setError(result.error || 'Failed to load change orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load change orders');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadChangeOrders();
  }, [loadChangeOrders]);

  const createChangeOrder = useCallback(async (data: Partial<ChangeOrder>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createChangeOrder({ ...data, project_id: projectId });
    if (result.success) {
      await loadChangeOrders();
    }
    return result;
  }, [projectId, db, loadChangeOrders]);

  const updateChangeOrder = useCallback(async (id: string, data: Partial<ChangeOrder>) => {
    const result = await db.updateChangeOrder(id, data);
    if (result.success) {
      await loadChangeOrders();
    }
    return result;
  }, [db, loadChangeOrders]);

  const deleteChangeOrder = useCallback(async (id: string, userId?: string) => {
    const result = await db.deleteChangeOrder(id, userId);
    if (result.success) {
      await loadChangeOrders();
    }
    return result;
  }, [db, loadChangeOrders]);

  return {
    changeOrders,
    loading,
    error,
    createChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
    reload: loadChangeOrders,
  };
}

export function useContracts(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setContracts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listContracts(projectId);
      if (result.success && result.data) {
        setContracts(result.data);
      } else {
        setError(result.error || 'Failed to load contracts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const createContract = useCallback(async (data: Partial<Contract>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createContract({ ...data, project_id: projectId });
    if (result.success) {
      await loadContracts();
    }
    return result;
  }, [projectId, db, loadContracts]);

  const updateContract = useCallback(async (id: string, data: Partial<Contract>) => {
    const result = await db.updateContract(id, data);
    if (result.success) {
      await loadContracts();
    }
    return result;
  }, [db, loadContracts]);

  const deleteContract = useCallback(async (id: string, userId?: string) => {
    const result = await db.deleteContract(id, userId);
    if (result.success) {
      await loadContracts();
    }
    return result;
  }, [db, loadContracts]);

  return {
    contracts,
    loading,
    error,
    createContract,
    updateContract,
    deleteContract,
    reload: loadContracts,
  };
}

export function useAutomatedSOV(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [sovItems, setSOVItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateSOV = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setSOVItems([]);
      return { success: false, error: 'No project selected or not in desktop mode' };
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.calculateAutomatedSOV(projectId);
      if (result.success && result.data) {
        setSOVItems(result.data);
      } else {
        setError(result.error || 'Failed to calculate SOV');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to calculate SOV';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  return {
    sovItems,
    loading,
    error,
    calculateSOV,
  };
}

export function useDrawingSets(projectId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [drawingSets, setDrawingSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDrawingSets = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setDrawingSets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listDrawingSets(projectId);
      if (result.success && result.data) {
        setDrawingSets(result.data);
      } else {
        setError(result.error || 'Failed to load drawing sets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drawing sets');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadDrawingSets();
  }, [loadDrawingSets]);

  const createDrawingSet = useCallback(async (data: any) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createDrawingSet({ ...data, project_id: projectId });
    if (result.success) {
      await loadDrawingSets();
    }
    return result;
  }, [projectId, db, loadDrawingSets]);

  const updateDrawingSetStatus = useCallback(async (id: string, newStatus: string, userId?: string) => {
    const result = await db.updateDrawingSetStatus(id, newStatus, userId);
    if (result.success) {
      await loadDrawingSets();
    }
    return result;
  }, [db, loadDrawingSets]);

  const deleteDrawingSet = useCallback(async (id: string, userId?: string) => {
    const result = await db.deleteDrawingSet(id, userId);
    if (result.success) {
      await loadDrawingSets();
    }
    return result;
  }, [db, loadDrawingSets]);

  return {
    drawingSets,
    loading,
    error,
    createDrawingSet,
    updateDrawingSetStatus,
    deleteDrawingSet,
    reload: loadDrawingSets,
  };
}

export function useDrawingSheets(setId: string | undefined) {
  const { db, isDesktop } = useDatabase();
  const [drawingSheets, setDrawingSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDrawingSheets = useCallback(async () => {
    if (!setId || !isDesktop) {
      setDrawingSheets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listDrawingSheets(setId);
      if (result.success && result.data) {
        setDrawingSheets(result.data);
      } else {
        setError(result.error || 'Failed to load drawing sheets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drawing sheets');
    } finally {
      setLoading(false);
    }
  }, [setId, db, isDesktop]);

  useEffect(() => {
    loadDrawingSheets();
  }, [loadDrawingSheets]);

  const createDrawingSheet = useCallback(async (data: any) => {
    if (!setId) return { success: false, error: 'No set selected' };
    
    const result = await db.createDrawingSheet({ ...data, set_id: setId });
    if (result.success) {
      await loadDrawingSheets();
    }
    return result;
  }, [setId, db, loadDrawingSheets]);

  const updateDrawingSheetStatus = useCallback(async (id: string, newStatus: string, userId?: string) => {
    const result = await db.updateDrawingSheetStatus(id, newStatus, userId);
    if (result.success) {
      await loadDrawingSheets();
    }
    return result;
  }, [db, loadDrawingSheets]);

  const deleteDrawingSheet = useCallback(async (id: string, userId?: string) => {
    const result = await db.deleteDrawingSheet(id, userId);
    if (result.success) {
      await loadDrawingSheets();
    }
    return result;
  }, [db, loadDrawingSheets]);

  return {
    drawingSheets,
    loading,
    error,
    createDrawingSheet,
    updateDrawingSheetStatus,
    deleteDrawingSheet,
    reload: loadDrawingSheets,
  };
}
