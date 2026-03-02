import type {
  Project,
  ProjectMember,
  RFI,
  Task,
  Document,
  DrawingSheet,
  DrawingRevision,
  Budget,
  CostCode,
  ChangeOrder,
} from './types'
import type { SOVItem } from './entities'

export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message)
    this.name = 'BusinessRuleError'
  }
}

export interface ProjectAccessContext {
  userId: string
  projectId: string
  isAdmin?: boolean
}

export const businessRules: {
  uniqueness: {
    validateProjectNumber: (projectNumber: string, excludeId?: string) => Promise<void>
    validateRFINumber: (projectId: string, rfiNumber: string, excludeId?: string) => Promise<void>
    validateProjectRFICombination: (projectId: string, rfiNumber: string, excludeId?: string) => Promise<void>
  }
  authorization: {
    checkProjectAccess: (userId: string, projectId: string, isAdmin?: boolean) => Promise<ProjectMember>
    checkReadAccess: (ctx: ProjectAccessContext) => Promise<void>
    checkWriteAccess: (ctx: ProjectAccessContext) => Promise<void>
    checkAdminAccess: (ctx: ProjectAccessContext) => Promise<void>
    checkDocumentAccess: (ctx: ProjectAccessContext, documentId: string) => Promise<void>
  }
  scheduling: {
    calculateBusinessDays: (startDate: Date, endDate: Date, holidays?: Date[]) => number
    addBusinessDays: (startDate: Date, businessDays: number, holidays?: Date[]) => Date
    validateDependencies: (tasks: Task[]) => { valid: boolean; errors: string[] }
    calculateCriticalPath: (tasks: Task[]) => string[]
    validateTaskDates: (task: Task) => void
  }
  financial: {
    safeDivide: (numerator: number, denominator: number, defaultValue?: number) => number
    calculateVariance: (budgeted: number, actual: number) => number
    calculateVariancePercentage: (budgeted: number, actual: number) => number
    validateBudgetRollup: (budgets: Budget[], costCodes: CostCode[]) => { valid: boolean; errors: string[] }
    validateSOVBudgetConsistency: (sovItems: SOVItem[], budgets: Budget[]) => { valid: boolean; errors: string[] }
    calculateProjectMargin: (revenue: number, costs: number) => { margin: number; marginPercent: number }
    validateChangeOrderTotal: (co: ChangeOrder) => void
  }
  drawings: {
    validateDrawingRevision: (sheetId: string, revision: DrawingRevision, existingRevisions: DrawingRevision[]) => Promise<void>
    getCurrentRevision: (sheet: DrawingSheet) => DrawingRevision | undefined
    markRevisionAsCurrent: (sheet: DrawingSheet, revisionId: string) => Promise<DrawingSheet>
    detectDrawingConflicts: (sheets: DrawingSheet[]) => Array<{ sheet1: DrawingSheet; sheet2: DrawingSheet; reason: string }>
    flagScopeChanges: (oldRevision: DrawingRevision, newRevision: DrawingRevision) => boolean
  }
  pma: {
    generateDailyBrief: (projectId: string) => Promise<string>
    detectScheduleRisks: (tasks: Task[]) => {
      criticalPathCount: number
      overdueTasks: Task[]
      atRiskTasks: Task[]
      topRisks: string[]
    }
    detectCostRisks: (budgets: Budget[]) => {
      overBudgetCodes: Budget[]
      topRisks: string[]
    }
    detectRFIAgingRisks: (rfis: RFI[]) => {
      agingRFIs: RFI[]
      overdueRFIs: RFI[]
      topRisks: string[]
    }
    generateActionableRecommendations: (
      projectId: string,
      risks: {
        schedule: ReturnType<typeof businessRules.pma.detectScheduleRisks>
        cost: ReturnType<typeof businessRules.pma.detectCostRisks>
        rfi: ReturnType<typeof businessRules.pma.detectRFIAgingRisks>
      }
    ) => Promise<Array<{ action: string; link: string; priority: 'high' | 'medium' | 'low' }>>
  }
} = {
  uniqueness: {
    async validateProjectNumber(
      projectNumber: string,
      excludeId?: string
    ): Promise<void> {
      const projects = await spark.kv.get<Project[]>('projects')
      if (!projects) return

      const duplicate = projects.find(
        (p) =>
          p.number === projectNumber &&
          !p.deletedAt &&
          p.id !== excludeId
      )

      if (duplicate) {
        throw new BusinessRuleError(
          `Project number ${projectNumber} already exists`,
          'DUPLICATE_PROJECT_NUMBER',
          'number'
        )
      }
    },

    async validateRFINumber(
      projectId: string,
      rfiNumber: string,
      excludeId?: string
    ): Promise<void> {
      const rfis = await spark.kv.get<RFI[]>(`project:${projectId}:rfis`)
      if (!rfis) return

      const duplicate = rfis.find(
        (r) => r.number === rfiNumber && r.id !== excludeId
      )

      if (duplicate) {
        throw new BusinessRuleError(
          `RFI number ${rfiNumber} already exists in this project`,
          'DUPLICATE_RFI_NUMBER',
          'number'
        )
      }
    },

    async validateProjectRFICombination(
      projectId: string,
      rfiNumber: string,
      excludeId?: string
    ): Promise<void> {
      await this.validateRFINumber(projectId, rfiNumber, excludeId)
    },
  },

  authorization: {
    async checkProjectAccess(
      userId: string,
      projectId: string,
      isAdmin?: boolean
    ): Promise<ProjectMember> {
      if (isAdmin) {
        const project = await spark.kv.get<Project[]>('projects')
        const found = project?.find((p) => p.id === projectId && !p.deletedAt)
        if (!found) {
          throw new BusinessRuleError(
            'Project not found',
            'PROJECT_NOT_FOUND'
          )
        }
        return {
          id: 'admin',
          projectId,
          userId,
          userName: 'Admin',
          email: '',
          role: 'admin',
          permissions: [],
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
      }

      const members = await spark.kv.get<ProjectMember[]>(
        `project:${projectId}:members`
      )

      const member = members?.find((m) => m.userId === userId)

      if (!member) {
        throw new BusinessRuleError(
          'User does not have access to this project',
          'ACCESS_DENIED'
        )
      }

      return member
    },

    async checkReadAccess(ctx: ProjectAccessContext): Promise<void> {
      await this.checkProjectAccess(ctx.userId, ctx.projectId, ctx.isAdmin)
    },

    async checkWriteAccess(ctx: ProjectAccessContext): Promise<void> {
      const member = await this.checkProjectAccess(
        ctx.userId,
        ctx.projectId,
        ctx.isAdmin
      )

      if (member.role === 'viewer') {
        throw new BusinessRuleError(
          'Viewers cannot modify project data',
          'INSUFFICIENT_PERMISSIONS'
        )
      }
    },

    async checkAdminAccess(ctx: ProjectAccessContext): Promise<void> {
      const member = await this.checkProjectAccess(
        ctx.userId,
        ctx.projectId,
        ctx.isAdmin
      )

      if (!['owner', 'admin'].includes(member.role)) {
        throw new BusinessRuleError(
          'Admin access required for this operation',
          'INSUFFICIENT_PERMISSIONS'
        )
      }
    },

    async checkDocumentAccess(
      ctx: ProjectAccessContext,
      documentId: string
    ): Promise<void> {
      await this.checkReadAccess(ctx)

      const documents = await spark.kv.get<Document[]>(
        `project:${ctx.projectId}:documents`
      )
      const doc = documents?.find((d) => d.id === documentId)

      if (!doc) {
        throw new BusinessRuleError(
          'Document not found or access denied',
          'DOCUMENT_NOT_FOUND'
        )
      }
    },
  },

  scheduling: {
    calculateBusinessDays(
      startDate: Date,
      endDate: Date,
      holidays: Date[] = []
    ): number {
      let count = 0
      const current = new Date(startDate)
      const end = new Date(endDate)

      while (current <= end) {
        const dayOfWeek = current.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const isHoliday = holidays.some(
          (h) => h.toDateString() === current.toDateString()
        )

        if (!isWeekend && !isHoliday) {
          count++
        }

        current.setDate(current.getDate() + 1)
      }

      return count
    },

    addBusinessDays(
      startDate: Date,
      businessDays: number,
      holidays: Date[] = []
    ): Date {
      const result = new Date(startDate)
      let daysAdded = 0

      while (daysAdded < businessDays) {
        result.setDate(result.getDate() + 1)
        const dayOfWeek = result.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const isHoliday = holidays.some(
          (h) => h.toDateString() === result.toDateString()
        )

        if (!isWeekend && !isHoliday) {
          daysAdded++
        }
      }

      return result
    },

    validateDependencies(tasks: Task[]): { valid: boolean; errors: string[] } {
      const errors: string[] = []
      const taskMap = new Map(tasks.map((t) => [t.id, t]))

      for (const task of tasks) {
        for (const depId of task.dependencies) {
          const depTask = taskMap.get(depId)

          if (!depTask) {
            errors.push(
              `Task "${task.name}" depends on non-existent task ${depId}`
            )
            continue
          }

          const taskStart = new Date(task.startDate)
          const depEnd = new Date(depTask.endDate)

          if (taskStart < depEnd) {
            errors.push(
              `Task "${task.name}" cannot start before dependency "${depTask.name}" completes`
            )
          }
        }
      }

      return { valid: errors.length === 0, errors }
    },

    calculateCriticalPath(tasks: Task[]): string[] {
      const taskMap = new Map(tasks.map((t) => [t.id, t]))
      const visited = new Set<string>()
      const criticalTasks = new Set<string>()

      const calculateSlack = (task: Task): number => {
        const successors = tasks.filter((t) => t.dependencies.includes(task.id))

        if (successors.length === 0) {
          return 0
        }

        const minSuccessorStart = Math.min(
          ...successors.map((t) => new Date(t.startDate).getTime())
        )
        const taskEnd = new Date(task.endDate).getTime()

        return minSuccessorStart - taskEnd
      }

      const findCriticalPath = (taskId: string): number => {
        if (visited.has(taskId)) return 0

        visited.add(taskId)
        const task = taskMap.get(taskId)
        if (!task) return 0

        const slack = calculateSlack(task)

        if (slack === 0) {
          criticalTasks.add(taskId)
        }

        const taskDuration =
          new Date(task.endDate).getTime() - new Date(task.startDate).getTime()

        let maxPath = taskDuration

        for (const depId of task.dependencies) {
          const depPath = findCriticalPath(depId)
          maxPath = Math.max(maxPath, taskDuration + depPath)
        }

        return maxPath
      }

      const endTasks = tasks.filter((t) =>
        tasks.every((other) => !other.dependencies.includes(t.id))
      )

      for (const task of endTasks) {
        findCriticalPath(task.id)
      }

      return Array.from(criticalTasks)
    },

    validateTaskDates(task: Task): void {
      const start = new Date(task.startDate)
      const end = new Date(task.endDate)

      if (isNaN(start.getTime())) {
        throw new BusinessRuleError(
          'Invalid start date',
          'INVALID_START_DATE',
          'startDate'
        )
      }

      if (isNaN(end.getTime())) {
        throw new BusinessRuleError(
          'Invalid end date',
          'INVALID_END_DATE',
          'endDate'
        )
      }

      if (start > end) {
        throw new BusinessRuleError(
          'Start date must be before end date',
          'INVALID_DATE_RANGE'
        )
      }
    },
  },

  financial: {
    safeDivide(numerator: number, denominator: number, defaultValue = 0): number {
      if (denominator === 0 || !isFinite(denominator)) {
        return defaultValue
      }
      const result = numerator / denominator
      return isFinite(result) ? result : defaultValue
    },

    calculateVariance(budgeted: number, actual: number): number {
      return budgeted - actual
    },

    calculateVariancePercentage(budgeted: number, actual: number): number {
      return this.safeDivide((budgeted - actual) * 100, budgeted, 0)
    },

    validateBudgetRollup(
      budgets: Budget[],
      costCodes: CostCode[]
    ): { valid: boolean; errors: string[] } {
      const errors: string[] = []
      const costCodeMap = new Map(costCodes.map((c) => [c.id, c]))

      for (const budget of budgets) {
        const costCode = costCodeMap.get(budget.costCodeId)

        if (!costCode) {
          errors.push(
            `Budget references non-existent cost code: ${budget.costCodeId}`
          )
          continue
        }

        const variance = this.calculateVariance(
          budget.budgetedAmount,
          budget.actualAmount
        )

        if (Math.abs(variance - budget.variance) > 0.01) {
          errors.push(
            `Budget variance mismatch for cost code ${costCode.code}: expected ${variance}, got ${budget.variance}`
          )
        }

        const totalCommitted = budget.committedAmount + budget.actualAmount

        if (totalCommitted > budget.budgetedAmount * 1.1) {
          errors.push(
            `Cost code ${costCode.code} is over budget: committed+actual=${totalCommitted}, budgeted=${budget.budgetedAmount}`
          )
        }
      }

      return { valid: errors.length === 0, errors }
    },

    validateSOVBudgetConsistency(
      sovItems: SOVItem[],
      budgets: Budget[]
    ): { valid: boolean; errors: string[] } {
      const errors: string[] = []

      const sovTotal = sovItems.reduce(
        (sum, item) => sum + item.scheduledValue,
        0
      )
      const budgetTotal = budgets.reduce(
        (sum, budget) => sum + budget.budgetedAmount,
        0
      )

      if (Math.abs(sovTotal - budgetTotal) > 0.01) {
        errors.push(
          `SOV total (${sovTotal}) does not match budget total (${budgetTotal})`
        )
      }

      for (const item of sovItems) {
        if (item.totalCompleted < 0 || item.totalCompleted > item.scheduledValue) {
          errors.push(
            `SOV item ${item.itemNumber} has invalid completion: ${item.totalCompleted} (scheduled: ${item.scheduledValue})`
          )
        }

        const balance = item.scheduledValue - item.totalCompleted

        if (Math.abs(balance - item.balance) > 0.01) {
          errors.push(
            `SOV item ${item.itemNumber} balance mismatch: expected ${balance}, got ${item.balance}`
          )
        }
      }

      return { valid: errors.length === 0, errors }
    },

    calculateProjectMargin(
      revenue: number,
      costs: number
    ): { margin: number; marginPercent: number } {
      const margin = revenue - costs
      const marginPercent = this.safeDivide(margin * 100, revenue, 0)

      return { margin, marginPercent }
    },

    validateChangeOrderTotal(co: ChangeOrder): void {
      const calculatedTotal = co.lineItems.reduce(
        (sum, item) => sum + item.total,
        0
      )

      if (Math.abs(calculatedTotal - co.total) > 0.01) {
        throw new BusinessRuleError(
          `Change order total mismatch: line items sum to ${calculatedTotal}, but total is ${co.total}`,
          'CO_TOTAL_MISMATCH'
        )
      }
    },
  },

  drawings: {
    async validateDrawingRevision(
      sheetId: string,
      revision: DrawingRevision,
      existingRevisions: DrawingRevision[]
    ): Promise<void> {
      const duplicate = existingRevisions.find(
        (r) => r.revision === revision.revision && r.id !== revision.id
      )

      if (duplicate) {
        throw new BusinessRuleError(
          `Revision ${revision.revision} already exists for this sheet`,
          'DUPLICATE_REVISION'
        )
      }

      if (revision.isCurrent) {
        const currentCount = existingRevisions.filter(
          (r) => r.isCurrent && r.id !== revision.id
        ).length

        if (currentCount > 0) {
          throw new BusinessRuleError(
            'Another revision is already marked as current',
            'MULTIPLE_CURRENT_REVISIONS'
          )
        }
      }
    },

    getCurrentRevision(sheet: DrawingSheet): DrawingRevision | undefined {
      return sheet.revisions.find((r) => r.isCurrent)
    },

    async markRevisionAsCurrent(
      sheet: DrawingSheet,
      revisionId: string
    ): Promise<DrawingSheet> {
      const updatedRevisions = sheet.revisions.map((r) => ({
        ...r,
        isCurrent: r.id === revisionId,
      }))

      return {
        ...sheet,
        revisions: updatedRevisions,
        currentRevision: updatedRevisions.find((r) => r.isCurrent)?.revision,
      }
    },

    detectDrawingConflicts(
      sheets: DrawingSheet[]
    ): Array<{ sheet1: DrawingSheet; sheet2: DrawingSheet; reason: string }> {
      const conflicts: Array<{
        sheet1: DrawingSheet
        sheet2: DrawingSheet
        reason: string
      }> = []

      for (let i = 0; i < sheets.length; i++) {
        for (let j = i + 1; j < sheets.length; j++) {
          const sheet1 = sheets[i]
          const sheet2 = sheets[j]

          const rev1 = this.getCurrentRevision(sheet1)
          const rev2 = this.getCurrentRevision(sheet2)

          if (!rev1 || !rev2) continue

          const date1 = new Date(rev1.date)
          const date2 = new Date(rev2.date)
          const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)

          if (daysDiff > 90) {
            conflicts.push({
              sheet1,
              sheet2,
              reason: `Large revision date gap: ${Math.floor(daysDiff)} days`,
            })
          }
        }
      }

      return conflicts
    },

    flagScopeChanges(
      oldRevision: DrawingRevision,
      newRevision: DrawingRevision
    ): boolean {
      const scopeKeywords = [
        'added',
        'removed',
        'relocated',
        'revised',
        'deleted',
        'new',
        'modified',
      ]

      const description = newRevision.description.toLowerCase()

      return scopeKeywords.some((keyword) => description.includes(keyword))
    },
  },

  pma: {
    async generateDailyBrief(projectId: string): Promise<string> {
      const project = await spark.kv.get<Project[]>('projects')
      const currentProject = project?.find((p) => p.id === projectId && !p.deletedAt)

      if (!currentProject) {
        throw new BusinessRuleError('Project not found', 'PROJECT_NOT_FOUND')
      }

      const [tasks, rfis, budgets] = await Promise.all([
        spark.kv.get<Task[]>(`project:${projectId}:tasks`),
        spark.kv.get<RFI[]>(`project:${projectId}:rfis`),
        spark.kv.get<Budget[]>(`project:${projectId}:budgets`),
      ])

      const scheduleRisks = this.detectScheduleRisks(tasks || [])
      const costRisks = this.detectCostRisks(budgets || [])
      const rfiRisks = this.detectRFIAgingRisks(rfis || [])

      const prompt = spark.llmPrompt`You are the Project Management Assistant for ${currentProject.name}.

Generate a concise daily brief covering:

SCHEDULE STATUS:
- Tasks: ${tasks?.length || 0} total
- Critical path tasks: ${scheduleRisks.criticalPathCount}
- Overdue tasks: ${scheduleRisks.overdueTasks.length}
- At-risk tasks: ${scheduleRisks.atRiskTasks.length}

COST STATUS:
- Total budget: $${budgets?.reduce((sum, b) => sum + b.budgetedAmount, 0) || 0}
- Total actual: $${budgets?.reduce((sum, b) => sum + b.actualAmount, 0) || 0}
- Over-budget cost codes: ${costRisks.overBudgetCodes.length}

RFI STATUS:
- Open RFIs: ${rfis?.filter((r) => r.status !== 'closed').length || 0}
- Aging RFIs (>14 days): ${rfiRisks.agingRFIs.length}
- Overdue RFIs: ${rfiRisks.overdueRFIs.length}

TOP RISKS:
${[...scheduleRisks.topRisks, ...costRisks.topRisks, ...rfiRisks.topRisks].slice(0, 5).join('\n')}

Generate 3-5 actionable recommendations with specific links to the app sections that need attention.
Format each recommendation as: "Action: [description] - Link: /projects/${projectId}/[section]"`

      return await spark.llm(prompt)
    },

    detectScheduleRisks(tasks: Task[]): {
      criticalPathCount: number
      overdueTasks: Task[]
      atRiskTasks: Task[]
      topRisks: string[]
    } {
      const now = new Date()
      const criticalPathCount = tasks.filter((t) => t.isCriticalPath).length

      const overdueTasks = tasks.filter((t) => {
        return (
          t.status !== 'completed' && new Date(t.endDate) < now
        )
      })

      const atRiskTasks = tasks.filter((t) => {
        if (t.status === 'completed') return false
        const endDate = new Date(t.endDate)
        const daysUntilDue =
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return daysUntilDue <= 7 && daysUntilDue > 0 && t.percentComplete < 50
      })

      const topRisks: string[] = []

      if (overdueTasks.length > 0) {
        topRisks.push(
          `🔴 ${overdueTasks.length} overdue task(s) - immediate attention required`
        )
      }

      if (atRiskTasks.length > 0) {
        topRisks.push(
          `⚠️ ${atRiskTasks.length} at-risk task(s) - behind schedule with <7 days remaining`
        )
      }

      const blockedTasks = tasks.filter((t) => t.status === 'blocked')
      if (blockedTasks.length > 0) {
        topRisks.push(
          `🚧 ${blockedTasks.length} blocked task(s) - resolve dependencies`
        )
      }

      return { criticalPathCount, overdueTasks, atRiskTasks, topRisks }
    },

    detectCostRisks(budgets: Budget[]): {
      overBudgetCodes: Budget[]
      topRisks: string[]
    } {
      const overBudgetCodes = budgets.filter((b) => {
        const total = b.actualAmount + b.committedAmount
        return total > b.budgetedAmount
      })

      const topRisks: string[] = []

      if (overBudgetCodes.length > 0) {
        const totalOverage = overBudgetCodes.reduce(
          (sum, b) =>
            sum +
            (b.actualAmount + b.committedAmount - b.budgetedAmount),
          0
        )
        topRisks.push(
          `💰 ${overBudgetCodes.length} over-budget cost code(s) - $${totalOverage.toFixed(2)} total overage`
        )
      }

      const nearBudgetCodes = budgets.filter((b) => {
        const total = b.actualAmount + b.committedAmount
        const usage = businessRules.financial.safeDivide(total, b.budgetedAmount, 0)
        return usage >= 0.9 && usage <= 1.0
      })

      if (nearBudgetCodes.length > 0) {
        topRisks.push(
          `⚠️ ${nearBudgetCodes.length} cost code(s) at >90% budget utilization`
        )
      }

      return { overBudgetCodes, topRisks }
    },

    detectRFIAgingRisks(rfis: RFI[]): {
      agingRFIs: RFI[]
      overdueRFIs: RFI[]
      topRisks: string[]
    } {
      const now = new Date()
      const openRFIs = rfis.filter((r) => r.status !== 'closed')

      const agingRFIs = openRFIs.filter((r) => {
        const submitted = new Date(r.submittedDate)
        const ageInDays =
          (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
        return ageInDays > 14
      })

      const overdueRFIs = openRFIs.filter((r) => {
        if (!r.dueDate) return false
        return new Date(r.dueDate) < now
      })

      const topRisks: string[] = []

      if (overdueRFIs.length > 0) {
        topRisks.push(
          `📋 ${overdueRFIs.length} overdue RFI(s) - response required`
        )
      }

      if (agingRFIs.length > 0) {
        topRisks.push(
          `⏰ ${agingRFIs.length} aging RFI(s) (>14 days) - follow up needed`
        )
      }

      return { agingRFIs, overdueRFIs, topRisks }
    },

    async generateActionableRecommendations(
      projectId: string,
      risks: {
        schedule: ReturnType<typeof businessRules.pma.detectScheduleRisks>
        cost: ReturnType<typeof businessRules.pma.detectCostRisks>
        rfi: ReturnType<typeof businessRules.pma.detectRFIAgingRisks>
      }
    ): Promise<Array<{ action: string; link: string; priority: 'high' | 'medium' | 'low' }>> {
      const recommendations: Array<{
        action: string
        link: string
        priority: 'high' | 'medium' | 'low'
      }> = []

      if (risks.schedule.overdueTasks.length > 0) {
        recommendations.push({
          action: `Review ${risks.schedule.overdueTasks.length} overdue task(s) and update schedule`,
          link: `/projects/${projectId}/schedule`,
          priority: 'high',
        })
      }

      if (risks.cost.overBudgetCodes.length > 0) {
        recommendations.push({
          action: `Analyze ${risks.cost.overBudgetCodes.length} over-budget cost code(s) and adjust forecast`,
          link: `/projects/${projectId}/financials`,
          priority: 'high',
        })
      }

      if (risks.rfi.overdueRFIs.length > 0) {
        recommendations.push({
          action: `Follow up on ${risks.rfi.overdueRFIs.length} overdue RFI response(s)`,
          link: `/projects/${projectId}/rfis`,
          priority: 'high',
        })
      }

      if (risks.schedule.atRiskTasks.length > 0) {
        recommendations.push({
          action: `Monitor ${risks.schedule.atRiskTasks.length} at-risk task(s) and consider acceleration`,
          link: `/projects/${projectId}/schedule`,
          priority: 'medium',
        })
      }

      if (risks.rfi.agingRFIs.length > 0) {
        recommendations.push({
          action: `Review ${risks.rfi.agingRFIs.length} aging RFI(s) and escalate if needed`,
          link: `/projects/${projectId}/rfis`,
          priority: 'medium',
        })
      }

      return recommendations
    },
  },
}

export default businessRules
