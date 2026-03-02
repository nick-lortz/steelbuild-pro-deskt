export interface Project {
  id: string
  name: string
  number: string
  client: string
  location: string
  status: 'planning' | 'active' | 'onhold' | 'completed'
  startDate: string
  endDate?: string
  contractValue: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CostCode {
  id: string
  code: string
  name: string
  category: 'labor' | 'material' | 'equipment' | 'subcontractor' | 'other'
  projectId?: string
  budgetAmount?: number
  actualAmount?: number
  createdAt: string
}

export interface ChangeOrder {
  id: string
  projectId: string
  number: string
  title: string
  description?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  requestedBy: string
  requestedDate: string
  approvedDate?: string
  lineItems: ChangeOrderLineItem[]
  total: number
  createdAt: string
}

export interface ChangeOrderLineItem {
  id: string
  changeOrderId: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

export interface Contract {
  id: string
  projectId: string
  contractNumber: string
  title: string
  contractType: 'lump-sum' | 'unit-price' | 'cost-plus' | 'time-and-materials'
  value: number
  signedDate: string
  startDate: string
  completionDate?: string
  retainage: number
  terms?: string
  createdAt: string
}

export interface DrawingSet {
  id: string
  projectId: string
  setNumber: string
  title: string
  discipline: 'structural' | 'architectural' | 'mechanical' | 'electrical' | 'shop'
  sheets: DrawingSheet[]
  createdAt: string
}

export interface DrawingSheet {
  id: string
  setId: string
  sheetNumber: string
  title: string
  currentRevision?: string
  revisions: DrawingRevision[]
  createdAt: string
}

export interface DrawingRevision {
  id: string
  sheetId: string
  revision: string
  description: string
  date: string
  isCurrent: boolean
  uploadedBy: string
}

export interface Equipment {
  id: string
  name: string
  type: 'crane' | 'welder' | 'lift' | 'tool' | 'vehicle' | 'other'
  model?: string
  serialNumber?: string
  status: 'available' | 'in-use' | 'maintenance' | 'retired'
  location?: string
  assignedProjectId?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  createdAt: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  category: 'safety' | 'quality' | 'pre-erection' | 'inspection' | 'other'
  items: ChecklistTemplateItem[]
  createdAt: string
}

export interface ChecklistTemplateItem {
  id: string
  text: string
  order: number
  required: boolean
}

export interface Checklist {
  id: string
  projectId: string
  templateId: string
  templateName: string
  assignedTo?: string
  dueDate?: string
  completedDate?: string
  items: ChecklistItem[]
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  completedBy?: string
  completedDate?: string
  notes?: string
  order: number
}