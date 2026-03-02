import { useState, useEffect, useCallback } from 'react';
import type { ProductionNote, ProductionNoteComment, DBResult } from '@/types/electron';

const isDesktop = typeof window !== 'undefined' && window.SBP?.db;

const fallbackDB = {
  createProductionNote: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listProductionNotes: async () => ({ success: false, data: [] as ProductionNote[] }),
  updateProductionNote: async () => ({ success: false, error: 'Not running in desktop mode' }),
  deleteProductionNote: async () => ({ success: false, error: 'Not running in desktop mode' }),
  restoreProductionNote: async () => ({ success: false, error: 'Not running in desktop mode' }),
  addProductionNoteComment: async () => ({ success: false, error: 'Not running in desktop mode' }),
  listProductionNoteComments: async () => ({ success: false, data: [] as ProductionNoteComment[] }),
  getProductionNoteKPIs: async () => ({ 
    success: false, 
    data: { 
      open_notes: 0, 
      past_due: 0, 
      high_critical: 0, 
      blockers: 0, 
      by_category: {} 
    } 
  }),
  convertProductionNoteToRFI: async () => ({ success: false, error: 'Not running in desktop mode' }),
};

export interface ProductionNoteFilters {
  status?: string;
  priority?: string;
  category?: string;
  discipline?: string;
  assignee?: string;
  search?: string;
}

export function useProductionNotes(projectId: string | undefined, filters?: ProductionNoteFilters) {
  const db = isDesktop ? window.SBP!.db : fallbackDB;
  const [notes, setNotes] = useState<ProductionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listProductionNotes(projectId, filters);
      if (result.success && result.data) {
        setNotes(result.data);
      } else {
        setError(result.error || 'Failed to load production notes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production notes');
    } finally {
      setLoading(false);
    }
  }, [projectId, filters, db, isDesktop]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const createNote = useCallback(async (data: Partial<ProductionNote>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    
    const result = await db.createProductionNote({ ...data, project_id: projectId });
    if (result.success) {
      await loadNotes();
    }
    return result;
  }, [projectId, db, loadNotes]);

  const updateNote = useCallback(async (id: string, data: Partial<ProductionNote>) => {
    const result = await db.updateProductionNote(id, data);
    if (result.success) {
      await loadNotes();
    }
    return result;
  }, [db, loadNotes]);

  const deleteNote = useCallback(async (id: string, userId?: string) => {
    const result = await db.deleteProductionNote(id, userId);
    if (result.success) {
      await loadNotes();
    }
    return result;
  }, [db, loadNotes]);

  const restoreNote = useCallback(async (id: string, userId?: string) => {
    const result = await db.restoreProductionNote(id, userId);
    if (result.success) {
      await loadNotes();
    }
    return result;
  }, [db, loadNotes]);

  const convertToRFI = useCallback(async (noteId: string, userId: string) => {
    const result = await db.convertProductionNoteToRFI(noteId, userId);
    return result;
  }, [db]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    convertToRFI,
    reload: loadNotes,
  };
}

export function useProductionNoteKPIs(projectId: string | undefined) {
  const db = isDesktop ? window.SBP!.db : fallbackDB;
  const [kpis, setKpis] = useState({
    open_notes: 0,
    past_due: 0,
    high_critical: 0,
    blockers: 0,
    by_category: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadKPIs = useCallback(async () => {
    if (!projectId || !isDesktop) {
      setKpis({
        open_notes: 0,
        past_due: 0,
        high_critical: 0,
        blockers: 0,
        by_category: {},
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.getProductionNoteKPIs(projectId);
      if (result.success && result.data) {
        setKpis(result.data);
      } else {
        setError(result.error || 'Failed to load KPIs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  }, [projectId, db, isDesktop]);

  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  return {
    kpis,
    loading,
    error,
    reload: loadKPIs,
  };
}

export function useProductionNoteComments(noteId: string | undefined) {
  const db = isDesktop ? window.SBP!.db : fallbackDB;
  const [comments, setComments] = useState<ProductionNoteComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!noteId || !isDesktop) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.listProductionNoteComments(noteId);
      if (result.success && result.data) {
        setComments(result.data);
      } else {
        setError(result.error || 'Failed to load comments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [noteId, db, isDesktop]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(async (body: string, userId: string, mentions?: string[]) => {
    if (!noteId) return { success: false, error: 'No note selected' };
    
    const result = await db.addProductionNoteComment(noteId, body, userId, mentions);
    if (result.success) {
      await loadComments();
    }
    return result;
  }, [noteId, db, loadComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    reload: loadComments,
  };
}
