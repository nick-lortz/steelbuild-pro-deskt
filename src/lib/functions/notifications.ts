import type { Project } from '../types'

export interface Notification {
  id: string
  userId: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export async function generateNotifications(projectId: string): Promise<Notification[]> {
  const notifications: Notification[]  = []

  const rfis = await spark.kv.get<any[]>('rfis')
  const projectRFIs = (rfis || []).filter((r) => r.projectId === projectId && r.status === 'open')

  const agingRFIs = projectRFIs.filter((r) => {
    const ageInDays = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return ageInDays > 7
  })

  if (agingRFIs.length > 0) {
    notifications.push({
      id: crypto.randomUUID(),
      userId: 'system',
      type: 'warning',
      title: 'Aging RFIs Detected',
      message: `${agingRFIs.length} RFI(s) have been open for more than 7 days`,
      link: `/projects/${projectId}/rfis`,
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  const tasks = await spark.kv.get<any[]>('tasks')
  const projectTasks = (tasks || []).filter((t) => t.projectId === projectId)
  
  const overdueTasks = projectTasks.filter((t) => {
    return t.status !== 'completed' && new Date(t.dueDate) < new Date()
  })

  if (overdueTasks.length > 0) {
    notifications.push({
      id: crypto.randomUUID(),
      userId: 'system',
      type: 'error',
      title: 'Overdue Tasks',
      message: `${overdueTasks.length} task(s) are past their due date`,
      link: `/projects/${projectId}/schedule`,
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  const workPackages = await spark.kv.get<any[]>('workPackages')
  const projectPackages = (workPackages || []).filter((wp) => wp.projectId === projectId)

  const blockedPackages = projectPackages.filter((wp) => wp.status === 'blocked')

  if (blockedPackages.length > 0) {
    notifications.push({
      id: crypto.randomUUID(),
      userId: 'system',
      type: 'warning',
      title: 'Blocked Work Packages',
      message: `${blockedPackages.length} work package(s) are currently blocked`,
      link: `/projects/${projectId}/work-packages`,
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  return notifications
}

export async function notifyDeliveryStatusChange(
  deliveryId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const allDeliveries = await spark.kv.get<any[]>('deliveries')
  const delivery = (allDeliveries || []).find((d) => d.id === deliveryId)

  if (!delivery) {
    return
  }

  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: 'system',
    type: newStatus === 'delivered' ? 'success' : 'info',
    title: 'Delivery Status Updated',
    message: `Delivery ${delivery.deliveryNumber || deliveryId} changed from ${oldStatus} to ${newStatus}`,
    link: `/projects/${delivery.projectId}/deliveries`,
    read: false,
    createdAt: new Date().toISOString(),
  }

  const existingNotifications = await spark.kv.get<Notification[]>('notifications') || []
  await spark.kv.set('notifications', [...existingNotifications, notification])

  if (newStatus === 'delivered') {
    const tasks = await spark.kv.get<any[]>('tasks')
    if (tasks && delivery.relatedTaskId) {
      const updatedTasks = tasks.map((t) =>
        t.id === delivery.relatedTaskId
          ? { ...t, deliveryReceived: true }
          : t
      )
      await spark.kv.set('tasks', updatedTasks)
    }
  }
}
