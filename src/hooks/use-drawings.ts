import { useState, useEffect, useCallback } from 'react';
import type { DrawingSet, DrawingSheet, Notification, DBResult } from '@/types/electron';

const isDesktop = typeof window !== 'undefined' && window.SBP?.db;

const fallbackDB = {
  createDrawingSet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listDrawingSets: async () => ({ success: false, data: [] as DrawingSet[] }),
  updateDrawingSetStatus: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteDrawingSet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  createDrawingSheet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listDrawingSheets: async () => ({ success: false, data: [] as DrawingSheet[] }),
  updateDrawingSheetStatus: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteDrawingSheet: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listNotifications: async () => ({ success: false, data: [] as Notification[] }),
  markNotificationRead: async () => ({ success: false, error: 'Not running in desktop mode' }),
};

export function useDrawingSets(projectId: string | undefined) {
  const db = isDesktop ? window.SBP!.db : fallbackDB;
  const [drawingSets, setDrawingSets] = useState<DrawingSet[]>([]);
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

  const createDrawingSet = useCallback(async (data: Partial<DrawingSet>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createDrawingSet({ ...data, project_id: projectId });
    if (result.success) {
      await loadDrawingSets();
    }
    return result;
  }, [projectId, db, loadDrawingSets]);

  const updateDrawingSetStatus = useCallback(async (id: string, newStatus: DrawingSet['status'], userId?: string) => {
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
  const db = isDesktop ? window.SBP!.db : fallbackDB;
  const [drawingSheets, setDrawingSheets] = useState<DrawingSheet[]>([]);
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

  const createDrawingSheet = useCallback(async (data: Partial<DrawingSheet>) => {
    if (!setId) return { success: false, error: 'No set selected' };
    
    const result = await db.createDrawingSheet({ ...data, set_id: setId });
    if (result.success) {
      await loadDrawingSheets();
    }
    return result;
  }, [setId, db, loadDrawingSheets]);

  const updateDrawingSheetStatus = useCallback(async (id: string, newStatus: DrawingSheet['status'], userId?: string) => {
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

export function useNotifications(projectId: string | undefined) {
  const db = isDesktop ? window.SBP!.db : fallbackDB;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listNotifications(projectId);
      if (result.success && result.data) {
        setNotifications(result.data);
      } else {
        setError(result.error || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const result = await db.markNotificationRead(id);
    if (result.success) {
      await loadNotifications();
    }
    return result;
  }, [db, loadNotifications]);

  return {
    notifications,
    loading,
    error,
    markAsRead,
    reload: loadNotifications,
  };
}
