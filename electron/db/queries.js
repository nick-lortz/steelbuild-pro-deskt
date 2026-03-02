const { eq, and, isNull, desc, sql } = require('drizzle-orm');
const { getDatabase, getSQLiteDB } = require('./init');
const { projects, rfis, equipment, cost_codes, audit_log, drawing_sets, drawing_sheets, notifications } = require('../../packages/db/schema');
const { v4: uuidv4 } = require('uuid');

const STATUS_SEQUENCE = ['IFA', 'BFA', 'OFS', 'BFS', 'FFF'];

function canTransitionStatus(currentStatus, newStatus) {
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
  const newIndex = STATUS_SEQUENCE.indexOf(newStatus);
  
  if (currentIndex === -1 || newIndex === -1) {
    return { allowed: false, error: 'Invalid status' };
  }
  
  if (newIndex === currentIndex + 1) {
    return { allowed: true };
  }
  
  if (newIndex <= currentIndex) {
    return { allowed: false, error: 'Cannot move backwards in status sequence' };
  }
  
  return { allowed: false, error: `Cannot skip from ${currentStatus} to ${newStatus}. Next valid status is ${STATUS_SEQUENCE[currentIndex + 1]}` };
}

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

async function createTask(data) {
  const sqliteDb = getSQLiteDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const task = {
    id,
    project_id: data.project_id,
    name: data.name,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    baseline_start_date: data.baseline_start_date || null,
    baseline_end_date: data.baseline_end_date || null,
    status: data.status || 'not-started',
    percent_complete: data.percent_complete || 0,
    created_at: now,
    updated_at: now,
    created_by: data.created_by || null,
  };
  
  sqliteDb.prepare(`
    INSERT INTO tasks (id, project_id, name, start_date, end_date, baseline_start_date, baseline_end_date, status, percent_complete, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    task.id,
    task.project_id,
    task.name,
    task.start_date,
    task.end_date,
    task.baseline_start_date,
    task.baseline_end_date,
    task.status,
    task.percent_complete,
    task.created_at,
    task.updated_at,
    task.created_by
  );
  
  logAudit('task', id, 'create', data.project_id, task, data.created_by);
  
  return { success: true, data: task };
}

async function listTasks(projectId, options = {}) {
  const sqliteDb = getSQLiteDB();
  const { status, limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT * FROM tasks 
    WHERE project_id = ? AND deleted_at IS NULL
    ${status ? 'AND status = ?' : ''}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const params = status 
    ? [projectId, status, limit, offset]
    : [projectId, limit, offset];
  
  const results = sqliteDb.prepare(query).all(...params);
  return { success: true, data: results };
}

async function updateTask(id, data) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Task not found' };
  }
  
  const updateFields = [];
  const values = [];
  
  if (data.name !== undefined) {
    updateFields.push('name = ?');
    values.push(data.name);
  }
  if (data.start_date !== undefined) {
    updateFields.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    updateFields.push('end_date = ?');
    values.push(data.end_date);
  }
  if (data.baseline_start_date !== undefined) {
    updateFields.push('baseline_start_date = ?');
    values.push(data.baseline_start_date);
  }
  if (data.baseline_end_date !== undefined) {
    updateFields.push('baseline_end_date = ?');
    values.push(data.baseline_end_date);
  }
  if (data.status !== undefined) {
    updateFields.push('status = ?');
    values.push(data.status);
  }
  if (data.percent_complete !== undefined) {
    updateFields.push('percent_complete = ?');
    values.push(data.percent_complete);
  }
  
  updateFields.push('updated_at = ?');
  values.push(now);
  
  if (data.updated_by !== undefined) {
    updateFields.push('updated_by = ?');
    values.push(data.updated_by);
  }
  
  values.push(id);
  
  sqliteDb.prepare(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
  logAudit('task', id, 'update', existing.project_id, data, data.updated_by);
  
  return { success: true };
}

async function deleteTask(id, userId = null) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Task not found' };
  }
  
  sqliteDb.prepare('UPDATE tasks SET deleted_at = ? WHERE id = ?').run(now, id);
  logAudit('task', id, 'delete', existing.project_id, null, userId);
  
  return { success: true };
}

async function createPMAInsight(data) {
  const sqliteDb = getSQLiteDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const insight = {
    id,
    project_id: data.project_id,
    severity: data.severity,
    type: data.type,
    title: data.title,
    details: data.details,
    entity_refs_json: data.entity_refs ? JSON.stringify(data.entity_refs) : null,
    status: 'open',
    created_at: now,
    updated_at: now,
  };
  
  sqliteDb.prepare(`
    INSERT INTO pma_insights (id, project_id, severity, type, title, details, entity_refs_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    insight.id,
    insight.project_id,
    insight.severity,
    insight.type,
    insight.title,
    insight.details,
    insight.entity_refs_json,
    insight.status,
    insight.created_at,
    insight.updated_at
  );
  
  logAudit('pma_insight', id, 'create', data.project_id, insight);
  
  return { success: true, data: { ...insight, entity_refs: data.entity_refs || [] } };
}

async function listPMAInsights(projectId, options = {}) {
  const sqliteDb = getSQLiteDB();
  const { status, limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT * FROM pma_insights 
    WHERE project_id = ?
    ${status ? 'AND status = ?' : ''}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const params = status 
    ? [projectId, status, limit, offset]
    : [projectId, limit, offset];
  
  const results = sqliteDb.prepare(query).all(...params);
  
  return { 
    success: true, 
    data: results.map(r => ({
      ...r,
      entity_refs: r.entity_refs_json ? JSON.parse(r.entity_refs_json) : []
    }))
  };
}

async function updatePMAInsight(id, data) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM pma_insights WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Insight not found' };
  }
  
  const updateFields = [];
  const values = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  updateFields.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  sqliteDb.prepare(`UPDATE pma_insights SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
  logAudit('pma_insight', id, 'update', existing.project_id, data);
  
  return { success: true };
}

async function resolvePMAInsight(id, userId) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM pma_insights WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Insight not found' };
  }
  
  sqliteDb.prepare(`
    UPDATE pma_insights 
    SET status = 'resolved', resolved_at = ?, resolved_by = ?, updated_at = ?
    WHERE id = ?
  `).run(now, userId, now, id);
  
  logAudit('pma_insight', id, 'resolve', existing.project_id, { userId });
  
  return { success: true };
}

async function dismissPMAInsight(id, userId, reason) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM pma_insights WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Insight not found' };
  }
  
  sqliteDb.prepare(`
    UPDATE pma_insights 
    SET status = 'dismissed', dismissed_at = ?, dismissed_by = ?, dismiss_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(now, userId, reason, now, id);
  
  logAudit('pma_insight', id, 'dismiss', existing.project_id, { userId, reason });
  
  return { success: true };
}

async function generatePMAInsights(projectId) {
  const sqliteDb = getSQLiteDB();
  const insights = [];
  const now = new Date();
  
  const agingRFIs = sqliteDb.prepare(`
    SELECT * FROM rfis 
    WHERE project_id = ? 
      AND status != 'closed' 
      AND deleted_at IS NULL
      AND julianday('now') - julianday(created_at) > 3
  `).all(projectId);
  
  for (const rfi of agingRFIs) {
    const ageInDays = Math.floor((now - new Date(rfi.created_at)) / (1000 * 60 * 60 * 24));
    const severity = ageInDays > 7 ? 'high' : 'medium';
    
    const insight = {
      project_id: projectId,
      severity,
      type: 'aging-rfi',
      title: `RFI #${rfi.rfi_number} is ${ageInDays} days old`,
      details: `RFI "${rfi.subject}" has been open for ${ageInDays} days without closure.`,
      entity_refs: [
        {
          entity_type: 'rfi',
          entity_id: rfi.id,
          label: `RFI #${rfi.rfi_number}`,
          link: `/projects/${projectId}/rfis?rfi=${rfi.id}`
        }
      ]
    };
    
    const existing = sqliteDb.prepare(`
      SELECT id FROM pma_insights 
      WHERE project_id = ? 
        AND type = 'aging-rfi' 
        AND entity_refs_json LIKE ?
        AND status = 'open'
    `).get(projectId, `%"entity_id":"${rfi.id}"%`);
    
    if (!existing) {
      const result = await createPMAInsight(insight);
      if (result.success) {
        insights.push(result.data);
      }
    }
  }
  
  const slippingTasks = sqliteDb.prepare(`
    SELECT * FROM tasks 
    WHERE project_id = ? 
      AND status != 'completed'
      AND baseline_end_date IS NOT NULL
      AND end_date IS NOT NULL
      AND deleted_at IS NULL
      AND julianday(end_date) > julianday(baseline_end_date)
  `).all(projectId);
  
  for (const task of slippingTasks) {
    const baselineEnd = new Date(task.baseline_end_date);
    const currentEnd = new Date(task.end_date);
    const deltaDays = Math.floor((currentEnd - baselineEnd) / (1000 * 60 * 60 * 24));
    const severity = deltaDays > 7 ? 'high' : 'medium';
    
    const insight = {
      project_id: projectId,
      severity,
      type: 'schedule-slippage',
      title: `Task "${task.name}" is ${deltaDays} days behind baseline`,
      details: `Task end date (${task.end_date}) is ${deltaDays} days later than baseline (${task.baseline_end_date}).`,
      entity_refs: [
        {
          entity_type: 'task',
          entity_id: task.id,
          label: task.name,
          link: `/projects/${projectId}/schedule?task=${task.id}`
        }
      ]
    };
    
    const existing = sqliteDb.prepare(`
      SELECT id FROM pma_insights 
      WHERE project_id = ? 
        AND type = 'schedule-slippage' 
        AND entity_refs_json LIKE ?
        AND status = 'open'
    `).get(projectId, `%"entity_id":"${task.id}"%`);
    
    if (!existing) {
      const result = await createPMAInsight(insight);
      if (result.success) {
        insights.push(result.data);
      }
    }
  }
  
  const overBudgetCostCodes = sqliteDb.prepare(`
    SELECT * FROM cost_codes 
    WHERE project_id = ? 
      AND deleted_at IS NULL
      AND actual_amount > budget_amount
      AND budget_amount > 0
  `).all(projectId);
  
  for (const costCode of overBudgetCostCodes) {
    const overage = costCode.actual_amount - costCode.budget_amount;
    const percentageOver = ((overage / costCode.budget_amount) * 100).toFixed(1);
    const severity = percentageOver > 20 ? 'high' : percentageOver > 10 ? 'medium' : 'low';
    
    const insight = {
      project_id: projectId,
      severity,
      type: 'budget-overage',
      title: `Cost Code ${costCode.code} is over budget by ${percentageOver}%`,
      details: `Cost code "${costCode.description}" has actual costs of $${costCode.actual_amount.toFixed(2)} vs budgeted $${costCode.budget_amount.toFixed(2)} (overage: $${overage.toFixed(2)}).`,
      entity_refs: [
        {
          entity_type: 'cost_code',
          entity_id: costCode.id,
          label: `Cost Code ${costCode.code}`,
          link: `/projects/${projectId}/cost-codes?code=${costCode.id}`
        }
      ]
    };
    
    const existing = sqliteDb.prepare(`
      SELECT id FROM pma_insights 
      WHERE project_id = ? 
        AND type = 'budget-overage' 
        AND entity_refs_json LIKE ?
        AND status = 'open'
    `).get(projectId, `%"entity_id":"${costCode.id}"%`);
    
    if (!existing) {
      const result = await createPMAInsight(insight);
      if (result.success) {
        insights.push(result.data);
      }
    }
  }
  
  const budgetVarianceWithTasks = sqliteDb.prepare(`
    SELECT cc.*, t.percent_complete 
    FROM cost_codes cc
    LEFT JOIN tasks t ON cc.cost_code_id = t.id
    WHERE cc.project_id = ? 
      AND cc.deleted_at IS NULL
      AND cc.budget_amount > 0
      AND cc.actual_amount > (cc.budget_amount * 0.90)
      AND (t.percent_complete IS NULL OR t.percent_complete < 90)
  `).all(projectId);
  
  for (const item of budgetVarianceWithTasks) {
    const percentUsed = ((item.actual_amount / item.budget_amount) * 100).toFixed(1);
    const taskProgress = item.percent_complete || 0;
    
    const insight = {
      project_id: projectId,
      severity: 'high',
      type: 'budget-variance-early',
      title: `Cost Code ${item.code} is ${percentUsed}% spent but only ${taskProgress}% complete`,
      details: `This cost code has consumed ${percentUsed}% of budget ($${item.actual_amount.toFixed(2)} / $${item.budget_amount.toFixed(2)}) while associated work is only ${taskProgress}% complete. This indicates potential budget overrun risk.`,
      entity_refs: [
        {
          entity_type: 'cost_code',
          entity_id: item.id,
          label: `Cost Code ${item.code}`,
          link: `/projects/${projectId}/cost-codes?code=${item.id}`
        }
      ]
    };
    
    const existing = sqliteDb.prepare(`
      SELECT id FROM pma_insights 
      WHERE project_id = ? 
        AND type = 'budget-variance-early' 
        AND entity_refs_json LIKE ?
        AND status = 'open'
    `).get(projectId, `%"entity_id":"${item.id}"%`);
    
    if (!existing) {
      const result = await createPMAInsight(insight);
      if (result.success) {
        insights.push(result.data);
      }
    }
  }
  
  return { success: true, data: insights };
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

async function createNotification(data) {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const notification = {
    id,
    project_id: data.project_id,
    type: data.type,
    message: data.message,
    entity_refs_json: data.entity_refs ? JSON.stringify(data.entity_refs) : null,
    user_id: data.user_id || null,
    created_at: now,
  };
  
  db.insert(notifications).values(notification).run();
  
  return { success: true, data: notification };
}

async function listNotifications(projectId, options = {}) {
  const db = getDatabase();
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  
  let query = db
    .select()
    .from(notifications)
    .where(and(
      eq(notifications.project_id, projectId),
      unreadOnly ? isNull(notifications.read_at) : undefined
    ))
    .orderBy(desc(notifications.created_at))
    .limit(limit)
    .offset(offset);
  
  const results = query.all();
  
  return { 
    success: true, 
    data: results.map(n => ({
      ...n,
      entity_refs: n.entity_refs_json ? JSON.parse(n.entity_refs_json) : []
    }))
  };
}

async function markNotificationRead(id) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  db.update(notifications)
    .set({ read_at: now })
    .where(eq(notifications.id, id))
    .run();
  
  return { success: true };
}

async function createDrawingSet(data) {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const drawingSet = {
    id,
    project_id: data.project_id,
    name: data.name,
    status: data.status || 'IFA',
    discipline: data.discipline || null,
    set_number: data.set_number || null,
    created_at: now,
    updated_at: now,
    created_by: data.created_by || null,
  };
  
  db.insert(drawing_sets).values(drawingSet).run();
  logAudit('drawing_set', id, 'create', data.project_id, drawingSet, data.created_by);
  
  await createNotification({
    project_id: data.project_id,
    type: 'drawing-set-created',
    message: `Drawing set "${data.name}" created with status ${drawingSet.status}`,
    entity_refs: [
      {
        entity_type: 'drawing_set',
        entity_id: id,
        label: data.name,
      }
    ]
  });
  
  return { success: true, data: drawingSet };
}

async function listDrawingSets(projectId, options = {}) {
  const db = getDatabase();
  const { status, limit = 100, offset = 0 } = options;
  
  let query = db
    .select()
    .from(drawing_sets)
    .where(and(
      eq(drawing_sets.project_id, projectId),
      isNull(drawing_sets.deleted_at),
      status ? eq(drawing_sets.status, status) : undefined
    ))
    .orderBy(desc(drawing_sets.created_at))
    .limit(limit)
    .offset(offset);
  
  const results = query.all();
  return { success: true, data: results };
}

async function updateDrawingSetStatus(id, newStatus, userId = null) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(drawing_sets).where(eq(drawing_sets.id, id)).get();
  if (!existing) {
    return { success: false, error: 'Drawing set not found' };
  }
  
  const transition = canTransitionStatus(existing.status, newStatus);
  if (!transition.allowed) {
    return { success: false, error: transition.error };
  }
  
  db.update(drawing_sets)
    .set({ status: newStatus, updated_at: now, updated_by: userId })
    .where(eq(drawing_sets.id, id))
    .run();
  
  logAudit('drawing_set', id, 'status-change', existing.project_id, { from: existing.status, to: newStatus }, userId);
  
  const statusMessages = {
    'BFA': 'ready for fabricator review',
    'OFS': 'out for signature',
    'BFS': 'back from signature',
    'FFF': 'fully approved for fabrication'
  };
  
  await createNotification({
    project_id: existing.project_id,
    type: 'drawing-status-change',
    message: `Drawing set "${existing.name}" moved to ${newStatus} — ${statusMessages[newStatus] || 'status updated'}`,
    entity_refs: [
      {
        entity_type: 'drawing_set',
        entity_id: id,
        label: existing.name,
      }
    ]
  });
  
  return { success: true };
}

async function deleteDrawingSet(id, userId = null) {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const existing = db.select().from(drawing_sets).where(eq(drawing_sets.id, id)).get();
  if (!existing) {
    return { success: false, error: 'Drawing set not found' };
  }
  
  db.update(drawing_sets)
    .set({ deleted_at: now })
    .where(eq(drawing_sets.id, id))
    .run();
  
  logAudit('drawing_set', id, 'delete', existing.project_id, null, userId);
  
  return { success: true };
}

async function createDrawingSheet(data) {
  const sqliteDb = getSQLiteDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const drawingSheet = {
    id,
    set_id: data.set_id,
    sheet_no: data.sheet_no,
    title: data.title,
    status: data.status || 'IFA',
    file_key: data.file_key || null,
    created_at: now,
    updated_at: now,
    created_by: data.created_by || null,
  };
  
  sqliteDb.prepare(`
    INSERT INTO drawing_sheets (id, set_id, sheet_no, title, status, file_key, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    drawingSheet.id,
    drawingSheet.set_id,
    drawingSheet.sheet_no,
    drawingSheet.title,
    drawingSheet.status,
    drawingSheet.file_key,
    drawingSheet.created_at,
    drawingSheet.updated_at,
    drawingSheet.created_by
  );
  
  const set = sqliteDb.prepare('SELECT project_id, name FROM drawing_sets WHERE id = ?').get(data.set_id);
  if (set) {
    logAudit('drawing_sheet', id, 'create', set.project_id, drawingSheet, data.created_by);
  }
  
  return { success: true, data: drawingSheet };
}

async function listDrawingSheets(setId, options = {}) {
  const sqliteDb = getSQLiteDB();
  const { status, limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT * FROM drawing_sheets 
    WHERE set_id = ? AND deleted_at IS NULL
    ${status ? 'AND status = ?' : ''}
    ORDER BY sheet_no
    LIMIT ? OFFSET ?
  `;
  
  const params = status 
    ? [setId, status, limit, offset]
    : [setId, limit, offset];
  
  const results = sqliteDb.prepare(query).all(...params);
  return { success: true, data: results };
}

async function updateDrawingSheetStatus(id, newStatus, userId = null) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM drawing_sheets WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Drawing sheet not found' };
  }
  
  const transition = canTransitionStatus(existing.status, newStatus);
  if (!transition.allowed) {
    return { success: false, error: transition.error };
  }
  
  sqliteDb.prepare(`
    UPDATE drawing_sheets 
    SET status = ?, updated_at = ?, updated_by = ?
    WHERE id = ?
  `).run(newStatus, now, userId, id);
  
  const set = sqliteDb.prepare('SELECT project_id, name FROM drawing_sets WHERE id = ?').get(existing.set_id);
  if (set) {
    logAudit('drawing_sheet', id, 'status-change', set.project_id, { from: existing.status, to: newStatus }, userId);
    
    await createNotification({
      project_id: set.project_id,
      type: 'drawing-status-change',
      message: `Drawing sheet ${existing.sheet_no} (${existing.title}) moved to ${newStatus}`,
      entity_refs: [
        {
          entity_type: 'drawing_sheet',
          entity_id: id,
          label: existing.sheet_no,
        }
      ]
    });
  }
  
  return { success: true };
}

async function deleteDrawingSheet(id, userId = null) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM drawing_sheets WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Drawing sheet not found' };
  }
  
  sqliteDb.prepare('UPDATE drawing_sheets SET deleted_at = ? WHERE id = ?').run(now, id);
  
  const set = sqliteDb.prepare('SELECT project_id FROM drawing_sets WHERE id = ?').get(existing.set_id);
  if (set) {
    logAudit('drawing_sheet', id, 'delete', set.project_id, null, userId);
  }
  
  return { success: true };
}

async function createChangeOrder(data) {
  const sqliteDb = getSQLiteDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const changeOrder = {
    id,
    project_id: data.project_id,
    number: data.number,
    title: data.title,
    description: data.description || null,
    status: data.status || 'draft',
    requested_by: data.requested_by,
    requested_date: data.requested_date || now,
    approved_date: data.approved_date || null,
    line_items_json: data.line_items ? JSON.stringify(data.line_items) : '[]',
    total: data.total || 0,
    created_at: now,
    updated_at: now,
    created_by: data.created_by || null,
  };
  
  sqliteDb.prepare(`
    INSERT INTO change_orders (id, project_id, number, title, description, status, requested_by, requested_date, approved_date, line_items_json, total, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    changeOrder.id,
    changeOrder.project_id,
    changeOrder.number,
    changeOrder.title,
    changeOrder.description,
    changeOrder.status,
    changeOrder.requested_by,
    changeOrder.requested_date,
    changeOrder.approved_date,
    changeOrder.line_items_json,
    changeOrder.total,
    changeOrder.created_at,
    changeOrder.updated_at,
    changeOrder.created_by
  );
  
  logAudit('change_order', id, 'create', data.project_id, changeOrder, data.created_by);
  
  return { success: true, data: { ...changeOrder, line_items: data.line_items || [] } };
}

async function listChangeOrders(projectId, options = {}) {
  const sqliteDb = getSQLiteDB();
  const { status, limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT * FROM change_orders 
    WHERE project_id = ? AND deleted_at IS NULL
    ${status ? 'AND status = ?' : ''}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const params = status 
    ? [projectId, status, limit, offset]
    : [projectId, limit, offset];
  
  const results = sqliteDb.prepare(query).all(...params);
  
  return { 
    success: true, 
    data: results.map(co => ({
      ...co,
      line_items: co.line_items_json ? JSON.parse(co.line_items_json) : []
    }))
  };
}

async function updateChangeOrder(id, data) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM change_orders WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Change order not found' };
  }
  
  const updateFields = [];
  const values = [];
  
  if (data.title !== undefined) {
    updateFields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updateFields.push('description = ?');
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updateFields.push('status = ?');
    values.push(data.status);
    if (data.status === 'approved' && !existing.approved_date) {
      updateFields.push('approved_date = ?');
      values.push(now);
    }
  }
  if (data.line_items !== undefined) {
    updateFields.push('line_items_json = ?');
    values.push(JSON.stringify(data.line_items));
    const total = data.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
    updateFields.push('total = ?');
    values.push(total);
  }
  
  updateFields.push('updated_at = ?');
  values.push(now);
  
  if (data.updated_by !== undefined) {
    updateFields.push('updated_by = ?');
    values.push(data.updated_by);
  }
  
  values.push(id);
  
  sqliteDb.prepare(`UPDATE change_orders SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
  logAudit('change_order', id, 'update', existing.project_id, data, data.updated_by);
  
  if (data.status === 'approved' && existing.status !== 'approved') {
    await recalculateProjectBudget(existing.project_id);
  }
  
  return { success: true };
}

async function deleteChangeOrder(id, userId = null) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM change_orders WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Change order not found' };
  }
  
  sqliteDb.prepare('UPDATE change_orders SET deleted_at = ? WHERE id = ?').run(now, id);
  logAudit('change_order', id, 'delete', existing.project_id, null, userId);
  
  if (existing.status === 'approved') {
    await recalculateProjectBudget(existing.project_id);
  }
  
  return { success: true };
}

async function createContract(data) {
  const sqliteDb = getSQLiteDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const contract = {
    id,
    project_id: data.project_id,
    contract_number: data.contract_number,
    title: data.title,
    contract_type: data.contract_type || 'lump-sum',
    value: data.value || 0,
    signed_date: data.signed_date || now,
    start_date: data.start_date || now,
    completion_date: data.completion_date || null,
    retainage: data.retainage || 10,
    terms: data.terms || null,
    created_at: now,
    updated_at: now,
    created_by: data.created_by || null,
  };
  
  sqliteDb.prepare(`
    INSERT INTO contracts (id, project_id, contract_number, title, contract_type, value, signed_date, start_date, completion_date, retainage, terms, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    contract.id,
    contract.project_id,
    contract.contract_number,
    contract.title,
    contract.contract_type,
    contract.value,
    contract.signed_date,
    contract.start_date,
    contract.completion_date,
    contract.retainage,
    contract.terms,
    contract.created_at,
    contract.updated_at,
    contract.created_by
  );
  
  logAudit('contract', id, 'create', data.project_id, contract, data.created_by);
  
  return { success: true, data: contract };
}

async function listContracts(projectId, options = {}) {
  const sqliteDb = getSQLiteDB();
  const { limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT * FROM contracts 
    WHERE project_id = ? AND deleted_at IS NULL
    ORDER BY signed_date DESC
    LIMIT ? OFFSET ?
  `;
  
  const results = sqliteDb.prepare(query).all(projectId, limit, offset);
  return { success: true, data: results };
}

async function updateContract(id, data) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Contract not found' };
  }
  
  const updateFields = [];
  const values = [];
  
  const allowedFields = ['contract_number', 'title', 'contract_type', 'value', 'signed_date', 'start_date', 'completion_date', 'retainage', 'terms'];
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(data[field]);
    }
  });
  
  updateFields.push('updated_at = ?');
  values.push(now);
  
  if (data.updated_by !== undefined) {
    updateFields.push('updated_by = ?');
    values.push(data.updated_by);
  }
  
  values.push(id);
  
  sqliteDb.prepare(`UPDATE contracts SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
  logAudit('contract', id, 'update', existing.project_id, data, data.updated_by);
  
  return { success: true };
}

async function deleteContract(id, userId = null) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Contract not found' };
  }
  
  sqliteDb.prepare('UPDATE contracts SET deleted_at = ? WHERE id = ?').run(now, id);
  logAudit('contract', id, 'delete', existing.project_id, null, userId);
  
  return { success: true };
}

async function recalculateProjectBudget(projectId) {
  const sqliteDb = getSQLiteDB();
  
  const project = sqliteDb.prepare(`
    SELECT original_contract_value FROM projects WHERE id = ?
  `).get(projectId);
  
  if (!project) {
    return { success: false, error: 'Project not found' };
  }
  
  const approvedCOs = sqliteDb.prepare(`
    SELECT total FROM change_orders 
    WHERE project_id = ? AND status = 'approved' AND deleted_at IS NULL
  `).all(projectId);
  
  const coTotal = approvedCOs.reduce((sum, co) => sum + (co.total || 0), 0);
  
  const newContractValue = project.original_contract_value + coTotal;
  
  sqliteDb.prepare(`
    UPDATE projects 
    SET current_contract_value = ?, updated_at = ?
    WHERE id = ?
  `).run(newContractValue, new Date().toISOString(), projectId);
  
  const costCodes = sqliteDb.prepare(`
    SELECT id, budget_amount FROM cost_codes 
    WHERE project_id = ? AND deleted_at IS NULL
  `).all(projectId);
  
  for (const cc of costCodes) {
    const lineItems = sqliteDb.prepare(`
      SELECT SUM(json_extract(value, '$.total')) as co_impact
      FROM change_orders, json_each(change_orders.line_items_json)
      WHERE change_orders.project_id = ? 
        AND change_orders.status = 'approved'
        AND change_orders.deleted_at IS NULL
        AND json_extract(value, '$.cost_code_id') = ?
    `).get(projectId, cc.id);
    
    if (lineItems && lineItems.co_impact) {
      const newBudget = cc.budget_amount + lineItems.co_impact;
      sqliteDb.prepare('UPDATE cost_codes SET budget_amount = ? WHERE id = ?').run(newBudget, cc.id);
    }
  }
  
  logAudit('project', projectId, 'budget-recalculation', projectId, {
    original_value: project.original_contract_value,
    change_order_total: coTotal,
    new_contract_value: newContractValue
  });
  
  return { success: true, data: { original_value: project.original_contract_value, change_order_total: coTotal, new_contract_value: newContractValue } };
}

async function calculateAutomatedSOV(projectId) {
  const sqliteDb = getSQLiteDB();
  const db = getDatabase();
  
  const costCodes = db
    .select()
    .from(cost_codes)
    .where(and(
      eq(cost_codes.project_id, projectId),
      isNull(cost_codes.deleted_at)
    ))
    .all();
  
  const tasks = sqliteDb.prepare(`
    SELECT * FROM tasks 
    WHERE project_id = ? AND deleted_at IS NULL
  `).all(projectId);
  
  const sovItems = [];
  
  for (const cc of costCodes) {
    const relatedTasks = tasks.filter(t => t.cost_code_id === cc.id);
    
    let percentComplete = 0;
    if (relatedTasks.length > 0) {
      percentComplete = relatedTasks.reduce((sum, t) => sum + t.percent_complete, 0) / relatedTasks.length;
    }
    
    const budgetWithCOs = cc.budget_amount;
    const billableToDate = (budgetWithCOs * percentComplete) / 100;
    
    sovItems.push({
      cost_code_id: cc.id,
      cost_code: cc.code,
      description: cc.description,
      scheduled_value: budgetWithCOs,
      percent_complete: Math.round(percentComplete),
      completed_to_date: billableToDate,
      balance_to_finish: budgetWithCOs - billableToDate,
    });
  }
  
  return { success: true, data: sovItems };
}

async function getProjectFinancialSummary(projectId) {
  const sqliteDb = getSQLiteDB();
  
  const project = sqliteDb.prepare(`
    SELECT original_contract_value, current_contract_value 
    FROM projects WHERE id = ?
  `).get(projectId);
  
  if (!project) {
    return { success: false, error: 'Project not found' };
  }
  
  const approvedCOs = sqliteDb.prepare(`
    SELECT id, number, title, total, approved_date 
    FROM change_orders 
    WHERE project_id = ? AND status = 'approved' AND deleted_at IS NULL
    ORDER BY approved_date DESC
  `).all(projectId);
  
  const pendingCOs = sqliteDb.prepare(`
    SELECT id, number, title, total, requested_date 
    FROM change_orders 
    WHERE project_id = ? AND status IN ('draft', 'submitted', 'under-review') AND deleted_at IS NULL
    ORDER BY requested_date DESC
  `).all(projectId);
  
  const costCodeTotals = sqliteDb.prepare(`
    SELECT 
      SUM(budget_amount) as total_budget,
      SUM(actual_amount) as total_actual
    FROM cost_codes 
    WHERE project_id = ? AND deleted_at IS NULL
  `).get(projectId);
  
  const coTotal = approvedCOs.reduce((sum, co) => sum + (co.total || 0), 0);
  const pendingCoTotal = pendingCOs.reduce((sum, co) => sum + (co.total || 0), 0);
  
  return {
    success: true,
    data: {
      original_contract_value: project.original_contract_value || 0,
      current_contract_value: project.current_contract_value || 0,
      approved_change_order_total: coTotal,
      pending_change_order_total: pendingCoTotal,
      potential_contract_value: (project.current_contract_value || 0) + pendingCoTotal,
      total_budget: costCodeTotals?.total_budget || 0,
      total_actual: costCodeTotals?.total_actual || 0,
      approved_change_orders: approvedCOs,
      pending_change_orders: pendingCOs,
    }
  };
}

async function updateProjectContractValue(projectId, originalValue) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const project = sqliteDb.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    return { success: false, error: 'Project not found' };
  }
  
  sqliteDb.prepare(`
    UPDATE projects 
    SET original_contract_value = ?, updated_at = ?
    WHERE id = ?
  `).run(originalValue, now, projectId);
  
  await recalculateProjectBudget(projectId);
  
  logAudit('project', projectId, 'contract-value-update', projectId, { original_value: originalValue });
  
  return { success: true };
}

async function recalculateProjectTotals(projectId) {
  const sqliteDb = getSQLiteDB();
  const db = getDatabase();
  
  const project = sqliteDb.prepare(`
    SELECT original_contract_value, current_contract_value FROM projects WHERE id = ?
  `).get(projectId);
  
  if (!project) {
    return { success: false, error: 'Project not found' };
  }
  
  const approvedCOs = sqliteDb.prepare(`
    SELECT SUM(total) as co_total 
    FROM change_orders 
    WHERE project_id = ? AND status = 'approved' AND deleted_at IS NULL
  `).get(projectId);
  
  const coTotal = approvedCOs?.co_total || 0;
  
  const costCodeActuals = db
    .select({
      totalActual: sql`COALESCE(SUM(${cost_codes.actual_amount}), 0)`,
    })
    .from(cost_codes)
    .where(and(
      eq(cost_codes.project_id, projectId),
      isNull(cost_codes.deleted_at)
    ))
    .get();
  
  const totalActual = Number(costCodeActuals?.totalActual || 0);
  
  const newContractValue = (project.original_contract_value || 0) + coTotal;
  const marginAtRisk = newContractValue - totalActual;
  const marginPercent = newContractValue > 0 ? ((marginAtRisk / newContractValue) * 100) : 0;
  
  sqliteDb.prepare(`
    UPDATE projects 
    SET 
      current_contract_value = ?,
      total_actual_cost = ?,
      margin_at_risk = ?,
      margin_percent = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    newContractValue, 
    totalActual, 
    marginAtRisk, 
    marginPercent,
    new Date().toISOString(), 
    projectId
  );
  
  logAudit('project', projectId, 'totals-recalculation', projectId, {
    original_contract_value: project.original_contract_value,
    approved_co_total: coTotal,
    new_contract_value: newContractValue,
    total_actual_cost: totalActual,
    margin_at_risk: marginAtRisk,
    margin_percent: marginPercent
  });
  
  return { 
    success: true, 
    data: {
      original_contract_value: project.original_contract_value,
      approved_change_orders: coTotal,
      current_contract_value: newContractValue,
      total_actual_cost: totalActual,
      margin_at_risk: marginAtRisk,
      margin_percent: marginPercent
    }
  };
}

async function setUserPreference(userId, key, value) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare(`
    SELECT id FROM user_preferences WHERE user_id = ? AND preference_key = ?
  `).get(userId, key);
  
  if (existing) {
    sqliteDb.prepare(`
      UPDATE user_preferences 
      SET preference_value = ?, updated_at = ?
      WHERE user_id = ? AND preference_key = ?
    `).run(value, now, userId, key);
  } else {
    const id = uuidv4();
    sqliteDb.prepare(`
      INSERT INTO user_preferences (id, user_id, preference_key, preference_value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, key, value, now, now);
  }
  
  return { success: true };
}

async function getUserPreference(userId, key) {
  const sqliteDb = getSQLiteDB();
  
  const result = sqliteDb.prepare(`
    SELECT preference_value FROM user_preferences 
    WHERE user_id = ? AND preference_key = ?
  `).get(userId, key);
  
  return { 
    success: true, 
    data: result ? result.preference_value : null 
  };
}

async function getAllUserPreferences(userId) {
  const sqliteDb = getSQLiteDB();
  
  const results = sqliteDb.prepare(`
    SELECT preference_key, preference_value 
    FROM user_preferences 
    WHERE user_id = ?
  `).all(userId);
  
  const preferences = {};
  results.forEach(row => {
    preferences[row.preference_key] = row.preference_value;
  });
  
  return { success: true, data: preferences };
}

async function deleteUserPreference(userId, key) {
  const sqliteDb = getSQLiteDB();
  
  sqliteDb.prepare(`
    DELETE FROM user_preferences 
    WHERE user_id = ? AND preference_key = ?
  `).run(userId, key);
  
  return { success: true };
}

async function computePortfolioMarginAtRisk(projectIds) {
  const sqliteDb = getSQLiteDB();
  
  if (!projectIds || projectIds.length === 0) {
    return { success: true, data: [] };
  }
  
  const placeholders = projectIds.map(() => '?').join(',');
  const projectsData = sqliteDb.prepare(`
    SELECT 
      id,
      project_number,
      name,
      status,
      original_contract_value,
      current_contract_value,
      total_actual_cost,
      margin_at_risk,
      margin_percent
    FROM projects 
    WHERE id IN (${placeholders}) AND deleted_at IS NULL
  `).all(...projectIds);
  
  const results = [];
  
  for (const project of projectsData) {
    const approvedCOs = sqliteDb.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as co_total
      FROM change_orders 
      WHERE project_id = ? AND status = 'approved' AND deleted_at IS NULL
    `).get(project.id);
    
    const openRFIs = sqliteDb.prepare(`
      SELECT COUNT(*) as count 
      FROM rfis 
      WHERE project_id = ? AND status != 'closed' AND deleted_at IS NULL
    `).get(project.id);
    
    const agingRFIs = sqliteDb.prepare(`
      SELECT COUNT(*) as count 
      FROM rfis 
      WHERE project_id = ? 
        AND status != 'closed' 
        AND deleted_at IS NULL
        AND julianday('now') - julianday(created_at) > 3
    `).get(project.id);
    
    const overBudgetCostCodes = sqliteDb.prepare(`
      SELECT COUNT(*) as count 
      FROM cost_codes 
      WHERE project_id = ? 
        AND deleted_at IS NULL
        AND actual_amount > budget_amount
        AND budget_amount > 0
    `).get(project.id);
    
    const slippingTasks = sqliteDb.prepare(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE project_id = ? 
        AND status != 'completed'
        AND baseline_end_date IS NOT NULL
        AND end_date IS NOT NULL
        AND deleted_at IS NULL
        AND julianday(end_date) > julianday(baseline_end_date)
    `).get(project.id);
    
    const totalRiskFlags = (agingRFIs?.count || 0) + (overBudgetCostCodes?.count || 0) + (slippingTasks?.count || 0);
    
    const contractValue = project.current_contract_value || 0;
    const actualCost = project.total_actual_cost || 0;
    const margin = contractValue - actualCost;
    const marginPercent = contractValue > 0 ? (margin / contractValue) * 100 : 0;
    
    let healthStatus = 'healthy';
    if (marginPercent < 5 || totalRiskFlags >= 3) {
      healthStatus = 'critical';
    } else if (marginPercent < 10 || totalRiskFlags >= 1) {
      healthStatus = 'warning';
    }
    
    results.push({
      project_id: project.id,
      project_number: project.project_number,
      project_name: project.name,
      status: project.status,
      contract_value: contractValue,
      actual_cost: actualCost,
      margin: margin,
      margin_percent: marginPercent,
      approved_change_orders: approvedCOs?.count || 0,
      change_order_total: approvedCOs?.co_total || 0,
      open_rfis: openRFIs?.count || 0,
      aging_rfis: agingRFIs?.count || 0,
      over_budget_cost_codes: overBudgetCostCodes?.count || 0,
      slipping_tasks: slippingTasks?.count || 0,
      total_risk_flags: totalRiskFlags,
      health_status: healthStatus
    });
  }
  
  results.sort((a, b) => {
    const statusOrder = { critical: 0, warning: 1, healthy: 2 };
    const statusDiff = statusOrder[a.health_status] - statusOrder[b.health_status];
    if (statusDiff !== 0) return statusDiff;
    return a.margin_percent - b.margin_percent;
  });
  
  return { success: true, data: results };
}

async function updateProject(id, data) {
  const sqliteDb = getSQLiteDB();
  const now = new Date().toISOString();
  
  const existing = sqliteDb.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) {
    return { success: false, error: 'Project not found' };
  }
  
  const updateFields = [];
  const values = [];
  
  const allowedFields = [
    'name', 'status', 'description', 'start_date', 'end_date', 
    'client_name', 'location', 'original_contract_value'
  ];
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(data[field]);
    }
  });
  
  updateFields.push('updated_at = ?');
  values.push(now);
  
  if (data.updated_by !== undefined) {
    updateFields.push('updated_by = ?');
    values.push(data.updated_by);
  }
  
  values.push(id);
  
  sqliteDb.prepare(`UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
  logAudit('project', id, 'update', id, data, data.updated_by);
  
  if (data.original_contract_value !== undefined) {
    await recalculateProjectBudget(id);
  }
  
  return { success: true };
}

async function listProjects(options = {}) {
  const sqliteDb = getSQLiteDB();
  const { status, limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT * FROM projects 
    WHERE deleted_at IS NULL
    ${status ? 'AND status = ?' : ''}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const params = status 
    ? [status, limit, offset]
    : [limit, offset];
  
  const results = sqliteDb.prepare(query).all(...params);
  return { success: true, data: results };
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
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  createPMAInsight,
  listPMAInsights,
  updatePMAInsight,
  resolvePMAInsight,
  dismissPMAInsight,
  generatePMAInsights,
  getDashboardCounts,
  createNotification,
  listNotifications,
  markNotificationRead,
  createDrawingSet,
  listDrawingSets,
  updateDrawingSetStatus,
  deleteDrawingSet,
  createDrawingSheet,
  listDrawingSheets,
  updateDrawingSheetStatus,
  deleteDrawingSheet,
  createChangeOrder,
  listChangeOrders,
  updateChangeOrder,
  deleteChangeOrder,
  createContract,
  listContracts,
  updateContract,
  deleteContract,
  calculateAutomatedSOV,
  recalculateProjectBudget,
  recalculateProjectTotals,
  getProjectFinancialSummary,
  updateProjectContractValue,
  setUserPreference,
  getUserPreference,
  getAllUserPreferences,
  deleteUserPreference,
  computePortfolioMarginAtRisk,
  updateProject,
  listProjects,
};
