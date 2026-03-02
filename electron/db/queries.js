const { eq, and, isNull, desc, sql } = require('drizzle-orm');
const { getDatabase } = require('./init');
const { projects, rfis, equipment, cost_codes, audit_log } = require('../../packages/db/schema');
const { v4: uuidv4 } = require('uuid');

function logAudit(entityType, entityId, action, projectId = null, payload = null, userId = null) {
  const db = getDatabase();
  try {
    const auditEntry = {
      id: uuidv4(),
      entity_type: entityType,
      entity_id: entityId,
      action,
      project_id: projectId,
      payload_json: payload ? JSON.stringify(payload) : null,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    db.insert(audit_log).values(auditEntry).run();
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

async function createRFI(data) {
  const db = getDatabase();
  
  if (!data.rfi_number) {
    const maxRfi = db
      .select({ maxNum: sql`MAX(${rfis.rfi_number})` })
      .from(rfis)
      .where(and(
        eq(rfis.project_id, data.project_id),
        isNull(rfis.deleted_at)
      ))
      .get();
    
    data.rfi_number = (maxRfi?.maxNum || 0) + 1;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const rfi = {
    id,
    ...data,
    created_at: now,
    updated_at: now,
  };
  
  db.insert(rfis).values(rfi).run();
  logAudit('rfi', id, 'create', data.project_id, rfi, data.created_by);
  
  return { success: true, data: rfi };
}

async function listRFIs(projectId, options = {}) {
  const db = getDatabase();
  const { status, limit = 100, offset = 0 } = options;
  
  let query = db
    .select()
    .from(rfis)
    .where(and(
      eq(rfis.project_id, projectId),
      isNull(rfis.deleted_at),
      status ? eq(rfis.status, status) : undefined
    ))
    .orderBy(desc(rfis.created_at))
    .limit(limit)
    .offset(offset);
  
  const results = query.all();
  return { success: true, data: results };
}

async function updateRFI(id, data) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(rfis).where(eq(rfis.id, id)).get();
  if (!existing) {
    return { success: false, error: 'RFI not found' };
  }
  
  db.update(rfis)
    .set({ ...data, updated_at: now })
    .where(eq(rfis.id, id))
    .run();
  
  logAudit('rfi', id, 'update', existing.project_id, data, data.updated_by);
  
  return { success: true };
}

async function deleteRFI(id, userId = null) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(rfis).where(eq(rfis.id, id)).get();
  if (!existing) {
    return { success: false, error: 'RFI not found' };
  }
  
  db.update(rfis)
    .set({ deleted_at: now })
    .where(eq(rfis.id, id))
    .run();
  
  logAudit('rfi', id, 'delete', existing.project_id, null, userId);
  
  return { success: true };
}

async function createEquipment(data) {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const equipmentItem = {
    id,
    ...data,
    created_at: now,
    updated_at: now,
  };
  
  db.insert(equipment).values(equipmentItem).run();
  logAudit('equipment', id, 'create', data.project_id, equipmentItem, data.created_by);
  
  return { success: true, data: equipmentItem };
}

async function listEquipment(projectId, options = {}) {
  const db = getDatabase();
  const { status, type, limit = 100, offset = 0 } = options;
  
  let query = db
    .select()
    .from(equipment)
    .where(and(
      eq(equipment.project_id, projectId),
      isNull(equipment.deleted_at),
      status ? eq(equipment.status, status) : undefined,
      type ? eq(equipment.type, type) : undefined
    ))
    .orderBy(desc(equipment.created_at))
    .limit(limit)
    .offset(offset);
  
  const results = query.all();
  return { success: true, data: results };
}

async function updateEquipment(id, data) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(equipment).where(eq(equipment.id, id)).get();
  if (!existing) {
    return { success: false, error: 'Equipment not found' };
  }
  
  db.update(equipment)
    .set({ ...data, updated_at: now })
    .where(eq(equipment.id, id))
    .run();
  
  logAudit('equipment', id, 'update', existing.project_id, data, data.updated_by);
  
  return { success: true };
}

async function deleteEquipment(id, userId = null) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(equipment).where(eq(equipment.id, id)).get();
  if (!existing) {
    return { success: false, error: 'Equipment not found' };
  }
  
  db.update(equipment)
    .set({ deleted_at: now })
    .where(eq(equipment.id, id))
    .run();
  
  logAudit('equipment', id, 'delete', existing.project_id, null, userId);
  
  return { success: true };
}

async function createCostCode(data) {
  const db = getDatabase();
  
  const existing = db
    .select()
    .from(cost_codes)
    .where(and(
      eq(cost_codes.project_id, data.project_id),
      eq(cost_codes.code, data.code),
      isNull(cost_codes.deleted_at)
    ))
    .get();
  
  if (existing) {
    return { success: false, error: 'Cost code already exists for this project' };
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const costCode = {
    id,
    ...data,
    created_at: now,
    updated_at: now,
  };
  
  db.insert(cost_codes).values(costCode).run();
  logAudit('cost_code', id, 'create', data.project_id, costCode, data.created_by);
  
  return { success: true, data: costCode };
}

async function listCostCodes(projectId, options = {}) {
  const db = getDatabase();
  const { status, limit = 100, offset = 0 } = options;
  
  let query = db
    .select()
    .from(cost_codes)
    .where(and(
      eq(cost_codes.project_id, projectId),
      isNull(cost_codes.deleted_at),
      status ? eq(cost_codes.status, status) : undefined
    ))
    .orderBy(cost_codes.code)
    .limit(limit)
    .offset(offset);
  
  const results = query.all();
  return { success: true, data: results };
}

async function updateCostCode(id, data) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(cost_codes).where(eq(cost_codes.id, id)).get();
  if (!existing) {
    return { success: false, error: 'Cost code not found' };
  }
  
  db.update(cost_codes)
    .set({ ...data, updated_at: now })
    .where(eq(cost_codes.id, id))
    .run();
  
  logAudit('cost_code', id, 'update', existing.project_id, data, data.updated_by);
  
  return { success: true };
}

async function deleteCostCode(id, userId = null) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(cost_codes).where(eq(cost_codes.id, id)).get();
  if (!existing) {
    return { success: false, error: 'Cost code not found' };
  }
  
  db.update(cost_codes)
    .set({ deleted_at: now })
    .where(eq(cost_codes.id, id))
    .run();
  
  logAudit('cost_code', id, 'delete', existing.project_id, null, userId);
  
  return { success: true };
}

async function getDashboardCounts(projectId) {
  const db = getDatabase();
  
  const rfiCount = db
    .select({ count: sql`COUNT(*)` })
    .from(rfis)
    .where(and(
      eq(rfis.project_id, projectId),
      isNull(rfis.deleted_at)
    ))
    .get();
  
  const equipmentCount = db
    .select({ count: sql`COUNT(*)` })
    .from(equipment)
    .where(and(
      eq(equipment.project_id, projectId),
      isNull(equipment.deleted_at)
    ))
    .get();
  
  const costCodeCount = db
    .select({ count: sql`COUNT(*)` })
    .from(cost_codes)
    .where(and(
      eq(cost_codes.project_id, projectId),
      isNull(cost_codes.deleted_at)
    ))
    .get();
  
  const costCodeTotals = db
    .select({
      totalBudget: sql`SUM(${cost_codes.budget_amount})`,
      totalActual: sql`SUM(${cost_codes.actual_amount})`,
    })
    .from(cost_codes)
    .where(and(
      eq(cost_codes.project_id, projectId),
      isNull(cost_codes.deleted_at)
    ))
    .get();
  
  return {
    success: true,
    data: {
      rfi_count: Number(rfiCount?.count || 0),
      equipment_count: Number(equipmentCount?.count || 0),
      cost_code_count: Number(costCodeCount?.count || 0),
      total_budget: Number(costCodeTotals?.totalBudget || 0),
      total_actual: Number(costCodeTotals?.totalActual || 0),
    }
  };
}

module.exports = {
  createRFI,
  listRFIs,
  updateRFI,
  deleteRFI,
  createEquipment,
  listEquipment,
  updateEquipment,
  deleteEquipment,
  createCostCode,
  listCostCodes,
  updateCostCode,
  deleteCostCode,
  getDashboardCounts,
};
