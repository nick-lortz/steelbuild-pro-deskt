import type {
  Project,
  CostCode,
  ChangeOrder,
  ChangeOrderLineItem,
  Contract,
  DrawingSet,
  DrawingSheet,
  DrawingRevision,
  Equipment,
  ChecklistTemplate,
  Checklist,
  RFI,
  EquipmentLog,
  Task,
} from './types'

const KV_KEYS = {
  PROJECTS: 'projects',
  COST_CODES: 'costCodes',
  CHANGE_ORDERS: 'changeOrders',
  CONTRACTS: 'contracts',
  DRAWING_SETS: 'drawingSets',
  EQUIPMENT: 'equipment',
  CHECKLIST_TEMPLATES: 'checklistTemplates',
  CHECKLISTS: 'checklists',
  RFIS: 'rfis',
  EQUIPMENT_LOGS: 'equipmentLogs',
  TASKS: 'tasks',
}

export const projectsDb = {
  async getAll(): Promise<Project[]> {
    const projects = await spark.kv.get<Project[]>(KV_KEYS.PROJECTS)
    return projects || []
  },

  async getById(id: string): Promise<Project | undefined> {
    const projects = await this.getAll()
    return projects.find((p) => p.id === id)
  },

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const projects = await this.getAll()
    const now = new Date().toISOString()
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await spark.kv.set(KV_KEYS.PROJECTS, [...projects, newProject])
    return newProject
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const projects = await this.getAll()
    const index = projects.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Project not found')
    
    const updated = {
      ...projects[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    projects[index] = updated
    await spark.kv.set(KV_KEYS.PROJECTS, projects)
    return updated
  },

  async delete(id: string): Promise<void> {
    const projects = await this.getAll()
    await spark.kv.set(
      KV_KEYS.PROJECTS,
      projects.filter((p) => p.id !== id)
    )
  },
}

export const costCodesDb = {
  async getAll(): Promise<CostCode[]> {
    const codes = await spark.kv.get<CostCode[]>(KV_KEYS.COST_CODES)
    return codes || []
  },

  async getByProject(projectId?: string): Promise<CostCode[]> {
    const codes = await this.getAll()
    return projectId
      ? codes.filter((c) => c.projectId === projectId || !c.projectId)
      : codes.filter((c) => !c.projectId)
  },

  async create(code: Omit<CostCode, 'id' | 'createdAt'>): Promise<CostCode> {
    const codes = await this.getAll()
    const newCode: CostCode = {
      ...code,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.COST_CODES, [...codes, newCode])
    return newCode
  },

  async update(id: string, updates: Partial<CostCode>): Promise<CostCode> {
    const codes = await this.getAll()
    const index = codes.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Cost code not found')
    
    const updated = { ...codes[index], ...updates, id }
    codes[index] = updated
    await spark.kv.set(KV_KEYS.COST_CODES, codes)
    return updated
  },

  async delete(id: string): Promise<void> {
    const codes = await this.getAll()
    await spark.kv.set(
      KV_KEYS.COST_CODES,
      codes.filter((c) => c.id !== id)
    )
  },
}

export const changeOrdersDb = {
  async getAll(): Promise<ChangeOrder[]> {
    const orders = await spark.kv.get<ChangeOrder[]>(KV_KEYS.CHANGE_ORDERS)
    return orders || []
  },

  async getByProject(projectId: string): Promise<ChangeOrder[]> {
    const orders = await this.getAll()
    return orders.filter((o) => o.projectId === projectId)
  },

  async create(order: Omit<ChangeOrder, 'id' | 'createdAt'>): Promise<ChangeOrder> {
    const orders = await this.getAll()
    const newOrder: ChangeOrder = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.CHANGE_ORDERS, [...orders, newOrder])
    return newOrder
  },

  async update(id: string, updates: Partial<ChangeOrder>): Promise<ChangeOrder> {
    const orders = await this.getAll()
    const index = orders.findIndex((o) => o.id === id)
    if (index === -1) throw new Error('Change order not found')
    
    const updated = { ...orders[index], ...updates, id }
    orders[index] = updated
    await spark.kv.set(KV_KEYS.CHANGE_ORDERS, orders)
    return updated
  },

  async delete(id: string): Promise<void> {
    const orders = await this.getAll()
    await spark.kv.set(
      KV_KEYS.CHANGE_ORDERS,
      orders.filter((o) => o.id !== id)
    )
  },
}

export const contractsDb = {
  async getAll(): Promise<Contract[]> {
    const contracts = await spark.kv.get<Contract[]>(KV_KEYS.CONTRACTS)
    return contracts || []
  },

  async getByProject(projectId: string): Promise<Contract[]> {
    const contracts = await this.getAll()
    return contracts.filter((c) => c.projectId === projectId)
  },

  async create(contract: Omit<Contract, 'id' | 'createdAt'>): Promise<Contract> {
    const contracts = await this.getAll()
    const newContract: Contract = {
      ...contract,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.CONTRACTS, [...contracts, newContract])
    return newContract
  },

  async update(id: string, updates: Partial<Contract>): Promise<Contract> {
    const contracts = await this.getAll()
    const index = contracts.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Contract not found')
    
    const updated = { ...contracts[index], ...updates, id }
    contracts[index] = updated
    await spark.kv.set(KV_KEYS.CONTRACTS, contracts)
    return updated
  },

  async delete(id: string): Promise<void> {
    const contracts = await this.getAll()
    await spark.kv.set(
      KV_KEYS.CONTRACTS,
      contracts.filter((c) => c.id !== id)
    )
  },
}

export const drawingSetsDb = {
  async getAll(): Promise<DrawingSet[]> {
    const sets = await spark.kv.get<DrawingSet[]>(KV_KEYS.DRAWING_SETS)
    return sets || []
  },

  async getByProject(projectId: string): Promise<DrawingSet[]> {
    const sets = await this.getAll()
    return sets.filter((s) => s.projectId === projectId)
  },

  async create(set: Omit<DrawingSet, 'id' | 'createdAt'>): Promise<DrawingSet> {
    const sets = await this.getAll()
    const newSet: DrawingSet = {
      ...set,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.DRAWING_SETS, [...sets, newSet])
    return newSet
  },

  async update(id: string, updates: Partial<DrawingSet>): Promise<DrawingSet> {
    const sets = await this.getAll()
    const index = sets.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('Drawing set not found')
    
    const updated = { ...sets[index], ...updates, id }
    sets[index] = updated
    await spark.kv.set(KV_KEYS.DRAWING_SETS, sets)
    return updated
  },

  async delete(id: string): Promise<void> {
    const sets = await this.getAll()
    await spark.kv.set(
      KV_KEYS.DRAWING_SETS,
      sets.filter((s) => s.id !== id)
    )
  },
}

export const equipmentDb = {
  async getAll(): Promise<Equipment[]> {
    const equipment = await spark.kv.get<Equipment[]>(KV_KEYS.EQUIPMENT)
    return equipment || []
  },

  async create(item: Omit<Equipment, 'id' | 'createdAt'>): Promise<Equipment> {
    const equipment = await this.getAll()
    const newItem: Equipment = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.EQUIPMENT, [...equipment, newItem])
    return newItem
  },

  async update(id: string, updates: Partial<Equipment>): Promise<Equipment> {
    const equipment = await this.getAll()
    const index = equipment.findIndex((e) => e.id === id)
    if (index === -1) throw new Error('Equipment not found')
    
    const updated = { ...equipment[index], ...updates, id }
    equipment[index] = updated
    await spark.kv.set(KV_KEYS.EQUIPMENT, equipment)
    return updated
  },

  async delete(id: string): Promise<void> {
    const equipment = await this.getAll()
    await spark.kv.set(
      KV_KEYS.EQUIPMENT,
      equipment.filter((e) => e.id !== id)
    )
  },
}

export const checklistTemplatesDb = {
  async getAll(): Promise<ChecklistTemplate[]> {
    const templates = await spark.kv.get<ChecklistTemplate[]>(KV_KEYS.CHECKLIST_TEMPLATES)
    return templates || []
  },

  async create(template: Omit<ChecklistTemplate, 'id' | 'createdAt'>): Promise<ChecklistTemplate> {
    const templates = await this.getAll()
    const newTemplate: ChecklistTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.CHECKLIST_TEMPLATES, [...templates, newTemplate])
    return newTemplate
  },

  async update(id: string, updates: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> {
    const templates = await this.getAll()
    const index = templates.findIndex((t) => t.id === id)
    if (index === -1) throw new Error('Template not found')
    
    const updated = { ...templates[index], ...updates, id }
    templates[index] = updated
    await spark.kv.set(KV_KEYS.CHECKLIST_TEMPLATES, templates)
    return updated
  },

  async delete(id: string): Promise<void> {
    const templates = await this.getAll()
    await spark.kv.set(
      KV_KEYS.CHECKLIST_TEMPLATES,
      templates.filter((t) => t.id !== id)
    )
  },
}

export const checklistsDb = {
  async getAll(): Promise<Checklist[]> {
    const checklists = await spark.kv.get<Checklist[]>(KV_KEYS.CHECKLISTS)
    return checklists || []
  },

  async getByProject(projectId: string): Promise<Checklist[]> {
    const checklists = await this.getAll()
    return checklists.filter((c) => c.projectId === projectId)
  },

  async create(checklist: Omit<Checklist, 'id' | 'createdAt'>): Promise<Checklist> {
    const checklists = await this.getAll()
    const newChecklist: Checklist = {
      ...checklist,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.CHECKLISTS, [...checklists, newChecklist])
    return newChecklist
  },

  async update(id: string, updates: Partial<Checklist>): Promise<Checklist> {
    const checklists = await this.getAll()
    const index = checklists.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Checklist not found')
    
    const updated = { ...checklists[index], ...updates, id }
    checklists[index] = updated
    await spark.kv.set(KV_KEYS.CHECKLISTS, checklists)
    return updated
  },

  async delete(id: string): Promise<void> {
    const checklists = await this.getAll()
    await spark.kv.set(
      KV_KEYS.CHECKLISTS,
      checklists.filter((c) => c.id !== id)
    )
  },
}

export const rfisDb = {
  async getAll(): Promise<RFI[]> {
    const rfis = await spark.kv.get<RFI[]>(KV_KEYS.RFIS)
    return rfis || []
  },

  async getByProject(projectId: string): Promise<RFI[]> {
    const rfis = await this.getAll()
    return rfis.filter((r) => r.projectId === projectId)
  },

  async getById(id: string): Promise<RFI | undefined> {
    const rfis = await this.getAll()
    return rfis.find((r) => r.id === id)
  },

  async create(rfi: Omit<RFI, 'id' | 'createdAt'>): Promise<RFI> {
    const rfis = await this.getAll()
    
    const existingRFI = rfis.find(
      (r) => r.projectId === rfi.projectId && r.number === rfi.number
    )
    if (existingRFI) {
      throw new Error(`RFI number ${rfi.number} already exists for this project`)
    }

    const newRFI: RFI = {
      ...rfi,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.RFIS, [...rfis, newRFI])
    return newRFI
  },

  async update(id: string, updates: Partial<RFI>): Promise<RFI> {
    const rfis = await this.getAll()
    const index = rfis.findIndex((r) => r.id === id)
    if (index === -1) throw new Error('RFI not found')
    
    const updated = { ...rfis[index], ...updates, id }
    rfis[index] = updated
    await spark.kv.set(KV_KEYS.RFIS, rfis)
    return updated
  },

  async delete(id: string): Promise<void> {
    const rfis = await this.getAll()
    await spark.kv.set(
      KV_KEYS.RFIS,
      rfis.filter((r) => r.id !== id)
    )
  },
}

export const equipmentLogsDb = {
  async getAll(): Promise<EquipmentLog[]> {
    const logs = await spark.kv.get<EquipmentLog[]>(KV_KEYS.EQUIPMENT_LOGS)
    return logs || []
  },

  async getByEquipment(equipmentId: string): Promise<EquipmentLog[]> {
    const logs = await this.getAll()
    return logs.filter((l) => l.equipmentId === equipmentId)
  },

  async getByProject(projectId: string): Promise<EquipmentLog[]> {
    const logs = await this.getAll()
    return logs.filter((l) => l.projectId === projectId)
  },

  async create(log: Omit<EquipmentLog, 'id' | 'createdAt'>): Promise<EquipmentLog> {
    const logs = await this.getAll()
    const newLog: EquipmentLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.EQUIPMENT_LOGS, [...logs, newLog])
    return newLog
  },

  async update(id: string, updates: Partial<EquipmentLog>): Promise<EquipmentLog> {
    const logs = await this.getAll()
    const index = logs.findIndex((l) => l.id === id)
    if (index === -1) throw new Error('Equipment log not found')
    
    const updated = { ...logs[index], ...updates, id }
    logs[index] = updated
    await spark.kv.set(KV_KEYS.EQUIPMENT_LOGS, logs)
    return updated
  },

  async delete(id: string): Promise<void> {
    const logs = await this.getAll()
    await spark.kv.set(
      KV_KEYS.EQUIPMENT_LOGS,
      logs.filter((l) => l.id !== id)
    )
  },
}

export const tasksDb = {
  async getAll(): Promise<Task[]> {
    const tasks = await spark.kv.get<Task[]>(KV_KEYS.TASKS)
    return tasks || []
  },

  async getByProject(projectId: string): Promise<Task[]> {
    const tasks = await this.getAll()
    return tasks.filter((t) => t.projectId === projectId)
  },

  async getById(id: string): Promise<Task | undefined> {
    const tasks = await this.getAll()
    return tasks.find((t) => t.id === id)
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const tasks = await this.getAll()
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await spark.kv.set(KV_KEYS.TASKS, [...tasks, newTask])
    return newTask
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = await this.getAll()
    const index = tasks.findIndex((t) => t.id === id)
    if (index === -1) throw new Error('Task not found')
    
    const updated = { ...tasks[index], ...updates, id }
    tasks[index] = updated
    await spark.kv.set(KV_KEYS.TASKS, tasks)
    return updated
  },

  async delete(id: string): Promise<void> {
    const tasks = await this.getAll()
    await spark.kv.set(
      KV_KEYS.TASKS,
      tasks.filter((t) => t.id !== id)
    )
  },
}

export const db = {
  projects: projectsDb,
  costCodes: costCodesDb,
  changeOrders: changeOrdersDb,
  contracts: contractsDb,
  drawingSets: drawingSetsDb,
  equipment: equipmentDb,
  checklistTemplates: checklistTemplatesDb,
  checklists: checklistsDb,
  rfis: rfisDb,
  equipmentLogs: equipmentLogsDb,
  tasks: tasksDb,
}
