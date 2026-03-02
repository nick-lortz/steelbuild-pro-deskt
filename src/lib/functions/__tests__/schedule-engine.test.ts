import { describe, it, expect } from 'vitest'
import {
  buildDependencyGraph,
  detectCircularDependencies,
  topologicalSort,
  calculateBusinessDays,
  addBusinessDays,
  findCriticalPath,
  computeSchedule,
  generateLookahead,
} from '../schedule-engine'
import type { Task } from '../../types'

describe('Schedule Engine', () => {
  describe('buildDependencyGraph', () => {
    it('should build a dependency graph from tasks', () => {
      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Task 1',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          projectId: 'proj1',
          name: 'Task 2',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-06',
          endDate: '2024-01-10',
          dependencies: ['1'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
      ]

      const graph = buildDependencyGraph(tasks)
      expect(graph.size).toBe(2)
      expect(graph.get('2')?.has('1')).toBe(true)
    })
  })

  describe('detectCircularDependencies', () => {
    it('should detect circular dependencies', () => {
      const graph = new Map<string, Set<string>>()
      graph.set('1', new Set(['2']))
      graph.set('2', new Set(['3']))
      graph.set('3', new Set(['1']))

      const cycles = detectCircularDependencies(graph)
      expect(cycles.length).toBeGreaterThan(0)
    })

    it('should not detect cycles in acyclic graph', () => {
      const graph = new Map<string, Set<string>>()
      graph.set('1', new Set())
      graph.set('2', new Set(['1']))
      graph.set('3', new Set(['2']))

      const cycles = detectCircularDependencies(graph)
      expect(cycles.length).toBe(0)
    })
  })

  describe('topologicalSort', () => {
    it('should return tasks in topological order', () => {
      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Task 1',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          projectId: 'proj1',
          name: 'Task 2',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-06',
          endDate: '2024-01-10',
          dependencies: ['1'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
        {
          id: '3',
          projectId: 'proj1',
          name: 'Task 3',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-11',
          endDate: '2024-01-15',
          dependencies: ['2'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
      ]

      const order = topologicalSort(tasks)
      expect(order).toEqual(['1', '2', '3'])
    })
  })

  describe('calculateBusinessDays', () => {
    it('should calculate business days excluding weekends', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-05')
      const days = calculateBusinessDays(start, end)
      expect(days).toBe(5)
    })

    it('should exclude weekend days', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-07')
      const days = calculateBusinessDays(start, end)
      expect(days).toBe(5)
    })
  })

  describe('addBusinessDays', () => {
    it('should add business days to a date', () => {
      const start = new Date('2024-01-01')
      const result = addBusinessDays(start, 5)
      expect(result.getDate()).toBeGreaterThan(start.getDate())
    })

    it('should skip weekends when adding business days', () => {
      const start = new Date('2024-01-05')
      const result = addBusinessDays(start, 1)
      const dayOfWeek = result.getDay()
      expect(dayOfWeek).not.toBe(0)
      expect(dayOfWeek).not.toBe(6)
    })
  })

  describe('findCriticalPath', () => {
    it('should identify critical path tasks', () => {
      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Task 1',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          projectId: 'proj1',
          name: 'Task 2',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-06',
          endDate: '2024-01-10',
          dependencies: ['1'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
      ]

      const criticalPath = findCriticalPath(tasks)
      expect(criticalPath.length).toBeGreaterThan(0)
    })
  })

  describe('computeSchedule', () => {
    it('should compute full schedule with critical path and floats', () => {
      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Foundation',
          status: 'not-started',
          priority: 'high',
          startDate: '2024-01-01',
          endDate: '2024-01-10',
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          projectId: 'proj1',
          name: 'Steel Erection',
          status: 'not-started',
          priority: 'high',
          startDate: '2024-01-11',
          endDate: '2024-01-20',
          dependencies: ['1'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
        {
          id: '3',
          projectId: 'proj1',
          name: 'Final Inspection',
          status: 'not-started',
          priority: 'high',
          startDate: '2024-01-21',
          endDate: '2024-01-25',
          dependencies: ['2'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
      ]

      const result = computeSchedule(tasks)
      expect(result.tasks.length).toBe(3)
      expect(result.criticalPath.length).toBeGreaterThan(0)
      expect(result.topologicalOrder).toEqual(['1', '2', '3'])
      expect(result.longestPath).toBeGreaterThan(0)
      expect(result.scheduleHealth).toBeGreaterThanOrEqual(0)
      expect(result.scheduleHealth).toBeLessThanOrEqual(100)
    })

    it('should detect invalid date ranges', () => {
      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Invalid Task',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-10',
          endDate: '2024-01-05',
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
      ]

      const result = computeSchedule(tasks)
      expect(result.conflicts.length).toBeGreaterThan(0)
      expect(result.conflicts[0].type).toBe('invalid-date')
    })

    it('should detect constraint violations', () => {
      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Task 1',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-01',
          endDate: '2024-01-10',
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          projectId: 'proj1',
          name: 'Task 2',
          status: 'not-started',
          priority: 'medium',
          startDate: '2024-01-05',
          endDate: '2024-01-15',
          dependencies: ['1'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: '2024-01-01',
        },
      ]

      const result = computeSchedule(tasks)
      const constraintViolations = result.conflicts.filter(c => c.type === 'constraint-violation')
      expect(constraintViolations.length).toBeGreaterThan(0)
    })
  })

  describe('generateLookahead', () => {
    it('should generate 2-week lookahead window', () => {
      const now = new Date()
      const future = new Date()
      future.setDate(future.getDate() + 10)

      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Upcoming Task',
          status: 'not-started',
          priority: 'high',
          startDate: future.toISOString().split('T')[0],
          endDate: new Date(future.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: now.toISOString(),
        },
      ]

      const lookahead = generateLookahead(tasks, 2)
      expect(lookahead.tasks.length).toBeGreaterThan(0)
      expect(lookahead.tasks[0].task.id).toBe('1')
      expect(lookahead.tasks[0].readiness).toBeDefined()
    })

    it('should identify blocked tasks', () => {
      const now = new Date()
      const future = new Date()
      future.setDate(future.getDate() + 5)

      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Predecessor',
          status: 'in-progress',
          priority: 'high',
          startDate: now.toISOString().split('T')[0],
          endDate: future.toISOString().split('T')[0],
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: now.toISOString(),
        },
        {
          id: '2',
          projectId: 'proj1',
          name: 'Dependent Task',
          status: 'not-started',
          priority: 'high',
          startDate: future.toISOString().split('T')[0],
          endDate: new Date(future.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dependencies: ['1'],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: now.toISOString(),
        },
      ]

      const lookahead = generateLookahead(tasks, 2)
      const dependentTask = lookahead.tasks.find(t => t.task.id === '2')
      expect(dependentTask).toBeDefined()
      expect(dependentTask?.readiness).toBe('blocked')
      expect(dependentTask?.predecessorsComplete).toBe(false)
    })

    it('should identify ready tasks', () => {
      const now = new Date()
      const future = new Date()
      future.setDate(future.getDate() + 5)

      const tasks: Task[] = [
        {
          id: '1',
          projectId: 'proj1',
          name: 'Ready Task',
          status: 'not-started',
          priority: 'high',
          startDate: future.toISOString().split('T')[0],
          endDate: new Date(future.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dependencies: [],
          percentComplete: 0,
          isCriticalPath: false,
          createdAt: now.toISOString(),
        },
      ]

      const lookahead = generateLookahead(tasks, 2)
      const readyTask = lookahead.tasks.find(t => t.task.id === '1')
      expect(readyTask).toBeDefined()
      expect(readyTask?.readiness).toBe('ready')
      expect(readyTask?.predecessorsComplete).toBe(true)
    })
  })
})
