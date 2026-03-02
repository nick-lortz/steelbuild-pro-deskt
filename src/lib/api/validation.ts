/**
 * Input Validation
 * Validates every endpoint input using Zod schemas
 */

import { z } from 'zod'
import { throwValidationError } from './error-handler'

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throwValidationError(
        firstError.message,
        firstError.path.join('.'),
        { errors: error.errors }
      )
    }
    throw error
  }
}

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export const sortSchema = z.object({
  sortBy: z.string(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const projectSchema = z.object({
  project_number: z.string().min(1, 'Project number is required'),
  name: z.string().min(1, 'Name is required'),
  client: z.string().min(1, 'Client is required'),
  location: z.string().min(1, 'Location is required'),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  contract_value: z.number().min(0),
  description: z.string().nullable().optional(),
  manager_id: z.string(),
})

export const projectUpdateSchema = projectSchema.partial()

export const memberSchema = z.object({
  user_id: z.string().min(1),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
  permissions: z.array(z.string()).default([]),
})

export const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().nullable().optional(),
  status: z.enum(['not-started', 'in-progress', 'completed', 'blocked']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  duration: z.number().min(0),
  assigned_to: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  wbs: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).default(0),
  baseline_start: z.string().datetime().nullable().optional(),
  baseline_end: z.string().datetime().nullable().optional(),
})

export const taskUpdateSchema = taskSchema.partial()

export const rfiSchema = z.object({
  rfi_number: z.string().min(1, 'RFI number is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['draft', 'submitted', 'in-review', 'answered', 'closed']),
  submitted_by: z.string(),
  assigned_to: z.string().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  cost_impact: z.number().nullable().optional(),
  schedule_impact: z.number().nullable().optional(),
  drawing_refs: z.array(z.string()).default([]),
  spec_refs: z.array(z.string()).default([]),
})

export const rfiUpdateSchema = rfiSchema.partial()

export const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.string(),
  category: z.string().nullable().optional(),
  storage_key: z.string().min(1, 'Storage key is required'),
  file_size: z.number().min(0),
  mime_type: z.string(),
  tags: z.array(z.string()).default([]),
  version: z.string().default('1.0'),
  uploaded_by: z.string(),
})

export const drawingSetSchema = z.object({
  name: z.string().min(1, 'Drawing set name is required'),
  discipline: z.string(),
  status: z.enum(['draft', 'issued', 'approved', 'superseded']),
  issue_date: z.string().datetime().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const drawingSheetSchema = z.object({
  drawing_set_id: z.string().min(1),
  sheet_number: z.string().min(1, 'Sheet number is required'),
  title: z.string().min(1, 'Title is required'),
  discipline: z.string(),
  scale: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const drawingRevisionSchema = z.object({
  drawing_sheet_id: z.string().min(1),
  revision: z.string().min(1, 'Revision is required'),
  issue_date: z.string().datetime(),
  description: z.string().nullable().optional(),
  storage_key: z.string().min(1, 'Storage key is required'),
  file_size: z.number().min(0),
  issued_by: z.string(),
})

export const costCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.string(),
  type: z.enum(['labor', 'material', 'equipment', 'subcontractor', 'other']),
  budget: z.number().min(0).default(0),
  description: z.string().nullable().optional(),
})

export const expenseSchema = z.object({
  cost_code_id: z.string().min(1),
  description: z.string().min(1, 'Description is required'),
  amount: z.number(),
  date: z.string().datetime(),
  category: z.string(),
  vendor: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  approved: z.boolean().default(false),
  approved_by: z.string().nullable().optional(),
})

export const changeOrderSchema = z.object({
  co_number: z.string().min(1, 'Change order number is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'implemented']),
  requested_by: z.string(),
  approved_by: z.string().nullable().optional(),
  request_date: z.string().datetime(),
  approval_date: z.string().datetime().nullable().optional(),
  reason: z.string().nullable().optional(),
})

export const changeOrderLineItemSchema = z.object({
  change_order_id: z.string().min(1),
  cost_code_id: z.string().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0),
  unit: z.string(),
  unit_cost: z.number(),
  total_cost: z.number(),
  notes: z.string().nullable().optional(),
})

export const contractSchema = z.object({
  contract_number: z.string().min(1, 'Contract number is required'),
  title: z.string().min(1, 'Title is required'),
  type: z.string(),
  vendor: z.string().min(1, 'Vendor is required'),
  status: z.enum(['draft', 'active', 'completed', 'terminated']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().nullable().optional(),
  value: z.number().min(0),
  description: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
})

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  type: z.string(),
  model: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  status: z.enum(['available', 'in-use', 'maintenance', 'retired']),
  acquisition_date: z.string().datetime().nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  location: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
})

export const laborCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  code: z.string().min(1, 'Code is required'),
  rate: z.number().min(0),
  unit: z.string().default('hour'),
  description: z.string().nullable().optional(),
})

export const laborEntrySchema = z.object({
  category_id: z.string().min(1),
  worker_name: z.string().min(1, 'Worker name is required'),
  date: z.string().datetime(),
  hours: z.number().min(0),
  cost_code_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const deliverySchema = z.object({
  delivery_number: z.string().min(1, 'Delivery number is required'),
  description: z.string().min(1, 'Description is required'),
  vendor: z.string(),
  scheduled_date: z.string().datetime(),
  actual_date: z.string().datetime().nullable().optional(),
  status: z.enum(['scheduled', 'in-transit', 'delivered', 'delayed', 'cancelled']),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(0),
    unit: z.string(),
  })).default([]),
  notes: z.string().nullable().optional(),
})
