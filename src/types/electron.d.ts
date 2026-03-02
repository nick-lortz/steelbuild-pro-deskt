export interface RFI {
  id: string;
  project_id: string;
  rfi_number: number;
  subject: string;
  question: string;
  status: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
  response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface Equipment {
  id: string;
  project_id: string;
  name: string;
  type: string;
  asset_tag?: string;
  status: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface CostCode {
  id: string;
  project_id: string;
  code: string;
  description: string;
  budget_amount: number;
  actual_amount: number;
  status: string;
  category?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  baseline_start_date?: string;
  baseline_end_date?: string;
  status: string;
  percent_complete: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface PMAInsight {
  id: string;
  project_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  details: string;
  entity_refs: Array<{
    entity_type: string;
    entity_id: string;
    label: string;
    link: string;
  }>;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  dismissed_at?: string;
  dismissed_by?: string;
  dismiss_reason?: string;
}

export interface DashboardCounts {
  rfi_count: number;
  equipment_count: number;
  cost_code_count: number;
  total_budget: number;
  total_actual: number;
}

export interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SBPDB {
  init: () => Promise<DBResult<{ path: string }>>;
  createRFI: (data: Partial<RFI>) => Promise<DBResult<RFI>>;
  listRFIs: (projectId: string, options?: { status?: string; limit?: number; offset?: number }) => Promise<DBResult<RFI[]>>;
  updateRFI: (id: string, data: Partial<RFI>) => Promise<DBResult>;
  deleteRFI: (id: string, userId?: string) => Promise<DBResult>;
  createEquipment: (data: Partial<Equipment>) => Promise<DBResult<Equipment>>;
  listEquipment: (projectId: string, options?: { status?: string; type?: string; limit?: number; offset?: number }) => Promise<DBResult<Equipment[]>>;
  updateEquipment: (id: string, data: Partial<Equipment>) => Promise<DBResult>;
  deleteEquipment: (id: string, userId?: string) => Promise<DBResult>;
  createCostCode: (data: Partial<CostCode>) => Promise<DBResult<CostCode>>;
  listCostCodes: (projectId: string, options?: { status?: string; limit?: number; offset?: number }) => Promise<DBResult<CostCode[]>>;
  updateCostCode: (id: string, data: Partial<CostCode>) => Promise<DBResult>;
  deleteCostCode: (id: string, userId?: string) => Promise<DBResult>;
  getDashboardCounts: (projectId: string) => Promise<DBResult<DashboardCounts>>;
  createTask: (data: Partial<Task>) => Promise<DBResult<Task>>;
  listTasks: (projectId: string, options?: { status?: string; limit?: number; offset?: number }) => Promise<DBResult<Task[]>>;
  updateTask: (id: string, data: Partial<Task>) => Promise<DBResult>;
  deleteTask: (id: string, userId?: string) => Promise<DBResult>;
  createPMAInsight: (data: Partial<PMAInsight>) => Promise<DBResult<PMAInsight>>;
  listPMAInsights: (projectId: string, options?: { status?: string; limit?: number; offset?: number }) => Promise<DBResult<PMAInsight[]>>;
  updatePMAInsight: (id: string, data: Partial<PMAInsight>) => Promise<DBResult>;
  resolvePMAInsight: (id: string, userId: string) => Promise<DBResult>;
  dismissPMAInsight: (id: string, userId: string, reason: string) => Promise<DBResult>;
  generatePMAInsights: (projectId: string) => Promise<DBResult<PMAInsight[]>>;
}

declare global {
  interface Window {
    SBP?: {
      db: SBPDB;
    };
  }
}

export {};
