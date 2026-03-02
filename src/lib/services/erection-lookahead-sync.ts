import { db } from '@/lib/db'
import { toast } from 'sonner'

export interface ErectionScheduleChange {
  taskId: string
  taskName: string
  originalDate: string
  newDate: string
  daysDelta: number
  linkedFabBatches: string[]
}

export interface FabricationPriority {
  batchId: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  reason: string
  dueDate: string
  linkedTasks: string[]
}

export class ErectionLookAheadSync {
  async syncScheduleChanges(projectId: string, changes: ErectionScheduleChange[]): Promise<void> {
    for (const change of changes) {
      if (Math.abs(change.daysDelta) >= 2) {
        await this.updateFabricationPriorities(change)
        await this.notifyShopForeman(projectId, change)
      }
    }
  }
  
  private async updateFabricationPriorities(change: ErectionScheduleChange): Promise<void> {
    const task = await db.tasks.get(change.taskId)
    if (!task) return
    
    const fabBatches = await db.fabricationBatches
      .where('linkedTaskIds')
      .equals(change.taskId)
      .toArray()
    
    for (const batch of fabBatches) {
      const newPriority = this.calculatePriority(change.daysDelta, change.newDate)
      
      await db.fabricationBatches.update(batch.id, {
        priority: newPriority.level,
        priorityReason: newPriority.reason,
        updatedAt: new Date().toISOString()
      })
      
      await this.createPriorityAlert(batch.id, newPriority, change)
    }
  }
  
  private calculatePriority(daysDelta: number, newDate: string): { level: FabricationPriority['priority'], reason: string } {
    const daysUntilDue = Math.floor((new Date(newDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    if (daysDelta < -5 || daysUntilDue < 7) {
      return {
        level: 'critical',
        reason: `Erection moved up by ${Math.abs(daysDelta)} days. Critical rush needed.`
      }
    }
    
    if (daysDelta < -2 || daysUntilDue < 14) {
      return {
        level: 'high',
        reason: `Erection date advanced by ${Math.abs(daysDelta)} days. Expedite fabrication.`
      }
    }
    
    if (daysDelta > 5) {
      return {
        level: 'low',
        reason: `Erection delayed by ${daysDelta} days. Can reduce priority.`
      }
    }
    
    return {
      level: 'normal',
      reason: 'Schedule change within acceptable range'
    }
  }
  
  private async createPriorityAlert(batchId: string, priority: { level: string, reason: string }, change: ErectionScheduleChange): Promise<void> {
    await db.alerts.add({
      id: `alert-fab-${batchId}-${Date.now()}`,
      projectId: (await db.fabricationBatches.get(batchId))?.projectId || '',
      type: 'fabrication_priority_change',
      severity: priority.level === 'critical' ? 'critical' : priority.level === 'high' ? 'high' : 'medium',
      title: `Fabrication Priority Updated: ${change.taskName}`,
      message: priority.reason,
      entityType: 'fabrication_batch',
      entityId: batchId,
      status: 'unread',
      createdAt: new Date().toISOString(),
      metadata: {
        taskId: change.taskId,
        originalDate: change.originalDate,
        newDate: change.newDate,
        daysDelta: change.daysDelta
      }
    })
  }
  
  private async notifyShopForeman(projectId: string, change: ErectionScheduleChange): Promise<void> {
    const project = await db.projects.get(projectId)
    if (!project) return
    
    const notification = {
      id: `notif-${Date.now()}`,
      projectId,
      userId: 'shop-foreman',
      type: 'schedule_priority_change',
      title: 'Erection Schedule Updated - Action Required',
      message: `${change.taskName} moved ${Math.abs(change.daysDelta)} days ${change.daysDelta < 0 ? 'earlier' : 'later'}. Fabrication priorities updated.`,
      link: `/projects/${projectId}/fab-tracking`,
      read: false,
      createdAt: new Date().toISOString()
    }
    
    await db.notifications.add(notification)
    
    toast.warning('Schedule Change Detected', {
      description: `Fabrication priorities updated for ${change.taskName}`,
      action: {
        label: 'View',
        onClick: () => window.location.href = notification.link
      }
    })
  }
  
  async detectCriticalPathImpact(projectId: string): Promise<Array<{ taskId: string, impact: string }>> {
    const tasks = await db.tasks.where('projectId').equals(projectId).toArray()
    const criticalTasks = tasks.filter(t => t.isCriticalPath)
    
    const impacts = []
    
    for (const task of criticalTasks) {
      const detailing = await db.detailings
        .where('linkedTaskIds')
        .equals(task.id)
        .toArray()
      
      const behindSchedule = detailing.filter(d => {
        if (!d.targetDate) return false
        const daysUntil = Math.floor((new Date(d.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return daysUntil < 14 && d.status !== 'complete'
      })
      
      if (behindSchedule.length > 0) {
        impacts.push({
          taskId: task.id,
          impact: `Detailing for ${task.name} is behind with ${behindSchedule.length} items incomplete and ${Math.floor((new Date(task.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days until erection`
        })
      }
    }
    
    return impacts
  }
}

export const erectionLookAheadSync = new ErectionLookAheadSync()
