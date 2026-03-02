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

export interface DrawingSet {
  id: string;
  project_id: string;
  name: string;
  status: 'IFA' | 'BFA' | 'OFS' | 'BFS' | 'FFF';
  discipline?: string;
  set_number?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface DrawingSheet {
  id: string;
  set_id: string;
  sheet_no: string;
  title: string;
  status: 'IFA' | 'BFA' | 'OFS' | 'BFS' | 'FFF';
  file_key?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface Notification {
  id: string;
  project_id: string;
  type: string;
  message: string;
  entity_refs: Array<{
    entity_type: string;
    entity_id: string;
    label: string;
  }>;
  created_at: string;
  read_at?: string;
  user_id?: string;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  number: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  requested_by: string;
  requested_date: string;
  approved_date?: string;
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    cost_code_id?: string;
  }>;
  total: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface Contract {
  id: string;
  project_id: string;
  contract_number: string;
  title: string;
  contract_type: 'lump-sum' | 'unit-price' | 'cost-plus' | 'time-and-materials';
  value: number;
  signed_date: string;
  start_date: string;
  completion_date?: string;
  retainage: number;
  terms?: string;
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

export interface ProjectFinancialSummary {
  original_contract_value: number;
  current_contract_value: number;
  approved_change_order_total: number;
  pending_change_order_total: number;
  potential_contract_value: number;
  total_budget: number;
  total_actual: number;
  approved_change_orders: Array<{
    id: string;
    number: string;
    title: string;
    total: number;
    approved_date: string;
  }>;
  pending_change_orders: Array<{
    id: string;
    number: string;
    title: string;
    total: number;
    requested_date: string;
  }>;
}

export interface BudgetRecalculationResult {
  original_value: number;
  change_order_total: number;
  new_contract_value: number;
}

export interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FileUploadData {
  fileName: string;
  fileBuffer: ArrayBuffer;
  projectId: string;
}

export interface FileUploadResult {
  fileKey: string;
  filePath: string;
  fileName: string;
  originalName: string;
  size: number;
}

export interface FileDownloadResult {
  buffer: number[];
  fileName: string;
  mimeType: string;
}

export interface SBPFile {
  uploadDrawing: (fileData: FileUploadData) => Promise<DBResult<FileUploadResult>>;
  downloadDrawing: (fileKey: string) => Promise<DBResult<FileDownloadResult>>;
  deleteDrawing: (fileKey: string) => Promise<DBResult>;
  openDrawing: (fileKey: string) => Promise<DBResult>;
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
  createNotification: (data: Partial<Notification>) => Promise<DBResult<Notification>>;
  listNotifications: (projectId: string, options?: { unreadOnly?: boolean; limit?: number; offset?: number }) => Promise<DBResult<Notification[]>>;
  markNotificationRead: (id: string) => Promise<DBResult>;
  createDrawingSet: (data: Partial<DrawingSet>) => Promise<DBResult<DrawingSet>>;
  listDrawingSets: (projectId: string, options?: { status?: string; limit?: number; offset?: number }) => Promise<DBResult<DrawingSet[]>>;
  updateDrawingSetStatus: (id: string, newStatus: DrawingSet['status'], userId?: string) => Promise<DBResult>;
  deleteDrawingSet: (id: string, userId?: string) => Promise<DBResult>;
  createDrawingSheet: (data: Partial<DrawingSheet>) => Promise<DBResult<DrawingSheet>>;
  listDrawingSheets: (setId: string, options?: { status?: string; limit?: number; offset?: number }) => Promise<DBResult<DrawingSheet[]>>;
  updateDrawingSheetStatus: (id: string, newStatus: DrawingSheet['status'], userId?: string) => Promise<DBResult>;
  deleteDrawingSheet: (id: string, userId?: string) => Promise<DBResult>;
  createChangeOrder: (data: Partial<ChangeOrder>) => Promise<DBResult<ChangeOrder>>;
  listChangeOrders: (projectId: string, options?: { status?: string; limit?: number; offset?: number }) => Promise<DBResult<ChangeOrder[]>>;
  updateChangeOrder: (id: string, data: Partial<ChangeOrder>) => Promise<DBResult>;
  deleteChangeOrder: (id: string, userId?: string) => Promise<DBResult>;
  createContract: (data: Partial<Contract>) => Promise<DBResult<Contract>>;
  listContracts: (projectId: string, options?: { limit?: number; offset?: number }) => Promise<DBResult<Contract[]>>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<DBResult>;
  deleteContract: (id: string, userId?: string) => Promise<DBResult>;
  calculateAutomatedSOV: (projectId: string) => Promise<DBResult<any>>;
  recalculateProjectBudget: (projectId: string) => Promise<DBResult<BudgetRecalculationResult>>;
  getProjectFinancialSummary: (projectId: string) => Promise<DBResult<ProjectFinancialSummary>>;
  updateProjectContractValue: (projectId: string, originalValue: number) => Promise<DBResult>;
}

declare global {
  interface Window {
    SBP?: {
      db: SBPDB;
      file: SBPFile;
    };
  }
}

export {};
