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
}

declare global {
  interface Window {
    SBP?: {
      db: SBPDB;
    };
  }
}

export {};
