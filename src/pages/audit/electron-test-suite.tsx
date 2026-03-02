import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Play, Database, Package, FileText, DollarSign, Blueprint, ChatCircle } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useDatabase } from '@/hooks/use-database'
import { useDrawingSets, useDrawingSheets } from '@/hooks/use-drawings'
import type { Equipment, CostCode, Contract, RFI, DrawingSet, DrawingSheet } from '@/types/electron'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'pass' | 'fail'
  message?: string
  details?: string
  duration?: number
}

interface TestSuite {
  name: string
  icon: React.ReactNode
  tests: TestResult[]
}

export function ElectronTestSuitePage() {
  const { db, isDesktop } = useDatabase()
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: 'RFI Persistence',
      icon: <ChatCircle className="h-5 w-5" />,
      tests: [
        { name: 'Create RFI', status: 'pending' },
        { name: 'Read RFI', status: 'pending' },
        { name: 'Update RFI', status: 'pending' },
        { name: 'Delete RFI', status: 'pending' },
        { name: 'RFI Auto-Numbering', status: 'pending' },
      ],
    },
    {
      name: 'Drawing Sets Persistence',
      icon: <Blueprint className="h-5 w-5" />,
      tests: [
        { name: 'Create Drawing Set', status: 'pending' },
        { name: 'Read Drawing Set', status: 'pending' },
        { name: 'Update Drawing Set Status', status: 'pending' },
        { name: 'Delete Drawing Set', status: 'pending' },
        { name: 'Drawing Set Status Workflow', status: 'pending' },
      ],
    },
    {
      name: 'Drawing Sheets Persistence',
      icon: <Blueprint className="h-5 w-5" />,
      tests: [
        { name: 'Create Drawing Sheet', status: 'pending' },
        { name: 'Read Drawing Sheets', status: 'pending' },
        { name: 'Update Sheet Status', status: 'pending' },
        { name: 'Delete Drawing Sheet', status: 'pending' },
        { name: 'Sheet Status Gates', status: 'pending' },
      ],
    },
    {
      name: 'Equipment Persistence',
      icon: <Package className="h-5 w-5" />,
      tests: [
        { name: 'Create Equipment', status: 'pending' },
        { name: 'Read Equipment', status: 'pending' },
        { name: 'Update Equipment', status: 'pending' },
        { name: 'Delete Equipment', status: 'pending' },
        { name: 'Equipment Status Changes', status: 'pending' },
      ],
    },
    {
      name: 'Cost Codes Persistence',
      icon: <DollarSign className="h-5 w-5" />,
      tests: [
        { name: 'Create Cost Code', status: 'pending' },
        { name: 'Read Cost Code', status: 'pending' },
        { name: 'Update Cost Code', status: 'pending' },
        { name: 'Delete Cost Code', status: 'pending' },
        { name: 'Budget Calculations', status: 'pending' },
      ],
    },
    {
      name: 'Contracts Persistence',
      icon: <FileText className="h-5 w-5" />,
      tests: [
        { name: 'Create Contract', status: 'pending' },
        { name: 'Read Contract', status: 'pending' },
        { name: 'Update Contract', status: 'pending' },
        { name: 'Delete Contract', status: 'pending' },
        { name: 'Contract Value Calculations', status: 'pending' },
      ],
    },
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [testProjectId, setTestProjectId] = useState<string>('')

  const updateTestStatus = (suiteIndex: number, testIndex: number, update: Partial<TestResult>) => {
    setTestSuites(prev => {
      const newSuites = [...prev]
      newSuites[suiteIndex].tests[testIndex] = {
        ...newSuites[suiteIndex].tests[testIndex],
        ...update,
      }
      return newSuites
    })
  }

  const runRFITests = async (projectId: string) => {
    const suiteIndex = 0
    let createdRFIId = ''

    updateTestStatus(suiteIndex, 0, { status: 'running' })
    const startTime = Date.now()
    
    try {
      const createResult = await db.createRFI({
        project_id: projectId,
        subject: 'Test RFI - Foundation Details',
        question: 'Please clarify the foundation anchoring requirements for column A1?',
        status: 'open',
        priority: 'high',
      })

      if (createResult.success && createResult.data) {
        createdRFIId = createResult.data.id
        updateTestStatus(suiteIndex, 0, {
          status: 'pass',
          message: 'RFI created successfully',
          details: `ID: ${createdRFIId}`,
          duration: Date.now() - startTime,
        })
      } else {
        throw new Error(createResult.error || 'Failed to create RFI')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 0, {
        status: 'fail',
        message: 'Failed to create RFI',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 1, { status: 'running' })
    const readStartTime = Date.now()
    
    try {
      const readResult = await db.listRFIs(projectId)

      if (readResult.success && readResult.data) {
        const found = readResult.data.find(r => r.id === createdRFIId)
        if (found && found.subject === 'Test RFI - Foundation Details') {
          updateTestStatus(suiteIndex, 1, {
            status: 'pass',
            message: 'RFI read successfully',
            details: `Found ${readResult.data.length} RFIs`,
            duration: Date.now() - readStartTime,
          })
        } else {
          throw new Error('RFI not found in list')
        }
      } else {
        throw new Error(readResult.error || 'Failed to read RFIs')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 1, {
        status: 'fail',
        message: 'Failed to read RFI',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - readStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 2, { status: 'running' })
    const updateStartTime = Date.now()
    
    try {
      const updateResult = await db.updateRFI(createdRFIId, {
        status: 'in-review',
        response: 'Engineering team is reviewing the foundation requirements.',
      })

      if (updateResult.success) {
        const verifyResult = await db.listRFIs(projectId)
        const updated = verifyResult.data?.find(r => r.id === createdRFIId)
        
        if (updated && updated.status === 'in-review') {
          updateTestStatus(suiteIndex, 2, {
            status: 'pass',
            message: 'RFI updated successfully',
            details: 'Status changed to in-review',
            duration: Date.now() - updateStartTime,
          })
        } else {
          throw new Error('Update not persisted')
        }
      } else {
        throw new Error(updateResult.error || 'Failed to update RFI')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 2, {
        status: 'fail',
        message: 'Failed to update RFI',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - updateStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 3, { status: 'running' })
    const deleteStartTime = Date.now()
    
    try {
      const deleteResult = await db.deleteRFI(createdRFIId)

      if (deleteResult.success) {
        const verifyResult = await db.listRFIs(projectId)
        const found = verifyResult.data?.find(r => r.id === createdRFIId)
        
        if (!found) {
          updateTestStatus(suiteIndex, 3, {
            status: 'pass',
            message: 'RFI deleted successfully',
            details: 'RFI removed from database',
            duration: Date.now() - deleteStartTime,
          })
        } else {
          throw new Error('RFI still exists after delete')
        }
      } else {
        throw new Error(deleteResult.error || 'Failed to delete RFI')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 3, {
        status: 'fail',
        message: 'Failed to delete RFI',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - deleteStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 4, { status: 'running' })
    const autoNumberStartTime = Date.now()
    
    try {
      const rfi1 = await db.createRFI({
        project_id: projectId,
        subject: 'Auto Number Test 1',
        question: 'Test question 1',
        status: 'open',
      })

      const rfi2 = await db.createRFI({
        project_id: projectId,
        subject: 'Auto Number Test 2',
        question: 'Test question 2',
        status: 'open',
      })

      if (!rfi1.success || !rfi2.success) {
        throw new Error('Failed to create test RFIs')
      }

      if (rfi1.data && rfi2.data) {
        const num1 = rfi1.data.rfi_number
        const num2 = rfi2.data.rfi_number
        
        if (num2 === num1 + 1) {
          updateTestStatus(suiteIndex, 4, {
            status: 'pass',
            message: 'Auto-numbering works correctly',
            details: `Sequential numbers: ${num1}, ${num2}`,
            duration: Date.now() - autoNumberStartTime,
          })
        } else {
          throw new Error(`Non-sequential numbers: ${num1}, ${num2}`)
        }

        await db.deleteRFI(rfi1.data.id)
        await db.deleteRFI(rfi2.data.id)
      } else {
        throw new Error('RFI data missing')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 4, {
        status: 'fail',
        message: 'Auto-numbering test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - autoNumberStartTime,
      })
    }
  }

  const runDrawingSetTests = async (projectId: string) => {
    const suiteIndex = 1
    let createdSetId = ''

    updateTestStatus(suiteIndex, 0, { status: 'running' })
    const startTime = Date.now()
    
    try {
      const createResult = await db.createDrawingSet({
        project_id: projectId,
        name: 'Test Drawing Set - Structural',
        status: 'IFA',
        discipline: 'Structural',
        set_number: 'S-100',
      })

      if (createResult.success && createResult.data) {
        createdSetId = createResult.data.id
        updateTestStatus(suiteIndex, 0, {
          status: 'pass',
          message: 'Drawing set created successfully',
          details: `Set: ${createResult.data.name}`,
          duration: Date.now() - startTime,
        })
      } else {
        throw new Error(createResult.error || 'Failed to create drawing set')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 0, {
        status: 'fail',
        message: 'Failed to create drawing set',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 1, { status: 'running' })
    const readStartTime = Date.now()
    
    try {
      const readResult = await db.listDrawingSets(projectId)

      if (readResult.success && readResult.data) {
        const found = readResult.data.find(d => d.id === createdSetId)
        if (found && found.name === 'Test Drawing Set - Structural') {
          updateTestStatus(suiteIndex, 1, {
            status: 'pass',
            message: 'Drawing set read successfully',
            details: `Found ${readResult.data.length} drawing sets`,
            duration: Date.now() - readStartTime,
          })
        } else {
          throw new Error('Drawing set not found in list')
        }
      } else {
        throw new Error(readResult.error || 'Failed to read drawing sets')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 1, {
        status: 'fail',
        message: 'Failed to read drawing set',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - readStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 2, { status: 'running' })
    const updateStartTime = Date.now()
    
    try {
      const updateResult = await db.updateDrawingSetStatus(createdSetId, 'BFA')

      if (updateResult.success) {
        const verifyResult = await db.listDrawingSets(projectId)
        const updated = verifyResult.data?.find(d => d.id === createdSetId)
        
        if (updated && updated.status === 'BFA') {
          updateTestStatus(suiteIndex, 2, {
            status: 'pass',
            message: 'Drawing set status updated',
            details: 'Status changed from IFA to BFA',
            duration: Date.now() - updateStartTime,
          })
        } else {
          throw new Error('Update not persisted')
        }
      } else {
        throw new Error(updateResult.error || 'Failed to update drawing set')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 2, {
        status: 'fail',
        message: 'Failed to update drawing set',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - updateStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 3, { status: 'running' })
    const deleteStartTime = Date.now()
    
    try {
      const deleteResult = await db.deleteDrawingSet(createdSetId)

      if (deleteResult.success) {
        const verifyResult = await db.listDrawingSets(projectId)
        const found = verifyResult.data?.find(d => d.id === createdSetId)
        
        if (!found) {
          updateTestStatus(suiteIndex, 3, {
            status: 'pass',
            message: 'Drawing set deleted successfully',
            details: 'Drawing set removed from database',
            duration: Date.now() - deleteStartTime,
          })
        } else {
          throw new Error('Drawing set still exists after delete')
        }
      } else {
        throw new Error(deleteResult.error || 'Failed to delete drawing set')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 3, {
        status: 'fail',
        message: 'Failed to delete drawing set',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - deleteStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 4, { status: 'running' })
    const workflowStartTime = Date.now()
    
    try {
      const statuses: Array<DrawingSet['status']> = ['IFA', 'BFA', 'OFS', 'BFS', 'FFF']
      const testSet = await db.createDrawingSet({
        project_id: projectId,
        name: 'Workflow Test Set',
        status: 'IFA',
      })

      if (!testSet.success || !testSet.data) {
        throw new Error('Failed to create test drawing set')
      }

      for (const status of statuses) {
        const updateRes = await db.updateDrawingSetStatus(testSet.data.id, status)
        if (!updateRes.success) {
          throw new Error(`Failed to update status to ${status}`)
        }

        const verifyRes = await db.listDrawingSets(projectId)
        const verified = verifyRes.data?.find(d => d.id === testSet.data!.id)
        if (!verified || verified.status !== status) {
          throw new Error(`Status change to ${status} not persisted`)
        }
      }

      await db.deleteDrawingSet(testSet.data.id)

      updateTestStatus(suiteIndex, 4, {
        status: 'pass',
        message: 'Status workflow gates work correctly',
        details: `Tested ${statuses.length} status transitions`,
        duration: Date.now() - workflowStartTime,
      })
    } catch (error) {
      updateTestStatus(suiteIndex, 4, {
        status: 'fail',
        message: 'Workflow test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - workflowStartTime,
      })
    }
  }

  const runDrawingSheetTests = async (projectId: string) => {
    const suiteIndex = 2
    let createdSetId = ''
    let createdSheetId = ''

    updateTestStatus(suiteIndex, 0, { status: 'running' })
    const startTime = Date.now()
    
    try {
      const setResult = await db.createDrawingSet({
        project_id: projectId,
        name: 'Sheet Test Set',
        status: 'IFA',
      })

      if (!setResult.success || !setResult.data) {
        throw new Error('Failed to create parent drawing set')
      }

      createdSetId = setResult.data.id

      const createResult = await db.createDrawingSheet({
        set_id: createdSetId,
        sheet_no: 'S-101',
        title: 'Test Sheet - Column Details',
        status: 'IFA',
      })

      if (createResult.success && createResult.data) {
        createdSheetId = createResult.data.id
        updateTestStatus(suiteIndex, 0, {
          status: 'pass',
          message: 'Drawing sheet created successfully',
          details: `Sheet: ${createResult.data.sheet_no}`,
          duration: Date.now() - startTime,
        })
      } else {
        throw new Error(createResult.error || 'Failed to create drawing sheet')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 0, {
        status: 'fail',
        message: 'Failed to create drawing sheet',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      if (createdSetId) await db.deleteDrawingSet(createdSetId)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 1, { status: 'running' })
    const readStartTime = Date.now()
    
    try {
      const readResult = await db.listDrawingSheets(createdSetId)

      if (readResult.success && readResult.data) {
        const found = readResult.data.find(s => s.id === createdSheetId)
        if (found && found.sheet_no === 'S-101') {
          updateTestStatus(suiteIndex, 1, {
            status: 'pass',
            message: 'Drawing sheet read successfully',
            details: `Found ${readResult.data.length} sheets in set`,
            duration: Date.now() - readStartTime,
          })
        } else {
          throw new Error('Drawing sheet not found in list')
        }
      } else {
        throw new Error(readResult.error || 'Failed to read drawing sheets')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 1, {
        status: 'fail',
        message: 'Failed to read drawing sheet',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - readStartTime,
      })
      await db.deleteDrawingSet(createdSetId)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 2, { status: 'running' })
    const updateStartTime = Date.now()
    
    try {
      const updateResult = await db.updateDrawingSheetStatus(createdSheetId, 'OFS')

      if (updateResult.success) {
        const verifyResult = await db.listDrawingSheets(createdSetId)
        const updated = verifyResult.data?.find(s => s.id === createdSheetId)
        
        if (updated && updated.status === 'OFS') {
          updateTestStatus(suiteIndex, 2, {
            status: 'pass',
            message: 'Sheet status updated successfully',
            details: 'Status changed from IFA to OFS',
            duration: Date.now() - updateStartTime,
          })
        } else {
          throw new Error('Update not persisted')
        }
      } else {
        throw new Error(updateResult.error || 'Failed to update sheet status')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 2, {
        status: 'fail',
        message: 'Failed to update sheet status',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - updateStartTime,
      })
      await db.deleteDrawingSet(createdSetId)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 3, { status: 'running' })
    const deleteStartTime = Date.now()
    
    try {
      const deleteResult = await db.deleteDrawingSheet(createdSheetId)

      if (deleteResult.success) {
        const verifyResult = await db.listDrawingSheets(createdSetId)
        const found = verifyResult.data?.find(s => s.id === createdSheetId)
        
        if (!found) {
          updateTestStatus(suiteIndex, 3, {
            status: 'pass',
            message: 'Drawing sheet deleted successfully',
            details: 'Sheet removed from database',
            duration: Date.now() - deleteStartTime,
          })
        } else {
          throw new Error('Sheet still exists after delete')
        }
      } else {
        throw new Error(deleteResult.error || 'Failed to delete sheet')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 3, {
        status: 'fail',
        message: 'Failed to delete drawing sheet',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - deleteStartTime,
      })
    }

    await db.deleteDrawingSet(createdSetId)

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 4, { status: 'running' })
    const gatesStartTime = Date.now()
    
    try {
      const statuses: Array<DrawingSheet['status']> = ['IFA', 'BFA', 'OFS', 'BFS', 'FFF']
      
      const testSetRes = await db.createDrawingSet({
        project_id: projectId,
        name: 'Gates Test Set',
        status: 'IFA',
      })

      if (!testSetRes.success || !testSetRes.data) {
        throw new Error('Failed to create test set')
      }

      const testSheet = await db.createDrawingSheet({
        set_id: testSetRes.data.id,
        sheet_no: 'TEST-001',
        title: 'Status Gates Test',
        status: 'IFA',
      })

      if (!testSheet.success || !testSheet.data) {
        throw new Error('Failed to create test sheet')
      }

      for (const status of statuses) {
        const updateRes = await db.updateDrawingSheetStatus(testSheet.data.id, status)
        if (!updateRes.success) {
          throw new Error(`Failed to update status to ${status}`)
        }

        const verifyRes = await db.listDrawingSheets(testSetRes.data.id)
        const verified = verifyRes.data?.find(s => s.id === testSheet.data!.id)
        if (!verified || verified.status !== status) {
          throw new Error(`Status change to ${status} not persisted`)
        }
      }

      await db.deleteDrawingSet(testSetRes.data.id)

      updateTestStatus(suiteIndex, 4, {
        status: 'pass',
        message: 'Sheet status gates work correctly',
        details: `Tested all ${statuses.length} status gates`,
        duration: Date.now() - gatesStartTime,
      })
    } catch (error) {
      updateTestStatus(suiteIndex, 4, {
        status: 'fail',
        message: 'Status gates test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - gatesStartTime,
      })
    }
  }

  const runEquipmentTests = async (projectId: string) => {
    const suiteIndex = 3
    let createdEquipmentId = ''

    updateTestStatus(suiteIndex, 0, { status: 'running' })
    const startTime = Date.now()
    
    try {
      const createResult = await db.createEquipment({
        project_id: projectId,
        name: 'Test Crane TC-001',
        type: 'crane',
        asset_tag: 'TEST-CRANE-001',
        status: 'available',
        notes: 'Test equipment for persistence validation',
      })

      if (createResult.success && createResult.data) {
        createdEquipmentId = createResult.data.id
        updateTestStatus(suiteIndex, 0, {
          status: 'pass',
          message: 'Equipment created successfully',
          details: `ID: ${createdEquipmentId}`,
          duration: Date.now() - startTime,
        })
      } else {
        throw new Error(createResult.error || 'Failed to create equipment')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 0, {
        status: 'fail',
        message: 'Failed to create equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 1, { status: 'running' })
    const readStartTime = Date.now()
    
    try {
      const readResult = await db.listEquipment(projectId)

      if (readResult.success && readResult.data) {
        const found = readResult.data.find(e => e.id === createdEquipmentId)
        if (found && found.name === 'Test Crane TC-001') {
          updateTestStatus(suiteIndex, 1, {
            status: 'pass',
            message: 'Equipment read successfully',
            details: `Found ${readResult.data.length} equipment items`,
            duration: Date.now() - readStartTime,
          })
        } else {
          throw new Error('Equipment not found in list')
        }
      } else {
        throw new Error(readResult.error || 'Failed to read equipment')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 1, {
        status: 'fail',
        message: 'Failed to read equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - readStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 2, { status: 'running' })
    const updateStartTime = Date.now()
    
    try {
      const updateResult = await db.updateEquipment(createdEquipmentId, {
        status: 'in-use',
        assigned_to: 'Test Operator',
      })

      if (updateResult.success) {
        const verifyResult = await db.listEquipment(projectId)
        const updated = verifyResult.data?.find(e => e.id === createdEquipmentId)
        
        if (updated && updated.status === 'in-use') {
          updateTestStatus(suiteIndex, 2, {
            status: 'pass',
            message: 'Equipment updated successfully',
            details: 'Status changed to in-use',
            duration: Date.now() - updateStartTime,
          })
        } else {
          throw new Error('Update not persisted')
        }
      } else {
        throw new Error(updateResult.error || 'Failed to update equipment')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 2, {
        status: 'fail',
        message: 'Failed to update equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - updateStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 3, { status: 'running' })
    const deleteStartTime = Date.now()
    
    try {
      const deleteResult = await db.deleteEquipment(createdEquipmentId)

      if (deleteResult.success) {
        const verifyResult = await db.listEquipment(projectId)
        const found = verifyResult.data?.find(e => e.id === createdEquipmentId)
        
        if (!found) {
          updateTestStatus(suiteIndex, 3, {
            status: 'pass',
            message: 'Equipment deleted successfully',
            details: 'Equipment removed from database',
            duration: Date.now() - deleteStartTime,
          })
        } else {
          throw new Error('Equipment still exists after delete')
        }
      } else {
        throw new Error(deleteResult.error || 'Failed to delete equipment')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 3, {
        status: 'fail',
        message: 'Failed to delete equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - deleteStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 4, { status: 'running' })
    const statusStartTime = Date.now()
    
    try {
      const statuses = ['available', 'in-use', 'maintenance', 'retired'] as const
      const testEquip = await db.createEquipment({
        project_id: projectId,
        name: 'Status Test Equipment',
        type: 'truck',
        asset_tag: 'TEST-STATUS',
        status: 'available',
      })

      if (!testEquip.success || !testEquip.data) {
        throw new Error('Failed to create test equipment')
      }

      for (const status of statuses) {
        const updateRes = await db.updateEquipment(testEquip.data.id, { status })
        if (!updateRes.success) {
          throw new Error(`Failed to update status to ${status}`)
        }

        const verifyRes = await db.listEquipment(projectId)
        const verified = verifyRes.data?.find(e => e.id === testEquip.data!.id)
        if (!verified || verified.status !== status) {
          throw new Error(`Status change to ${status} not persisted`)
        }
      }

      await db.deleteEquipment(testEquip.data.id)

      updateTestStatus(suiteIndex, 4, {
        status: 'pass',
        message: 'Status changes persisted',
        details: `Tested ${statuses.length} status transitions`,
        duration: Date.now() - statusStartTime,
      })
    } catch (error) {
      updateTestStatus(suiteIndex, 4, {
        status: 'fail',
        message: 'Status change test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - statusStartTime,
      })
    }
  }

  const runCostCodeTests = async (projectId: string) => {
    const suiteIndex = 4
    let createdCodeId = ''

    updateTestStatus(suiteIndex, 0, { status: 'running' })
    const startTime = Date.now()
    
    try {
      const createResult = await db.createCostCode({
        project_id: projectId,
        code: 'TEST-001',
        description: 'Test Cost Code',
        category: 'labor',
        budget_amount: 10000,
        actual_amount: 0,
      })

      if (createResult.success && createResult.data) {
        createdCodeId = createResult.data.id
        updateTestStatus(suiteIndex, 0, {
          status: 'pass',
          message: 'Cost code created successfully',
          details: `Code: TEST-001, Budget: $10,000`,
          duration: Date.now() - startTime,
        })
      } else {
        throw new Error(createResult.error || 'Failed to create cost code')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 0, {
        status: 'fail',
        message: 'Failed to create cost code',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 1, { status: 'running' })
    const readStartTime = Date.now()
    
    try {
      const readResult = await db.listCostCodes(projectId)

      if (readResult.success && readResult.data) {
        const found = readResult.data.find(c => c.id === createdCodeId)
        if (found && found.code === 'TEST-001') {
          updateTestStatus(suiteIndex, 1, {
            status: 'pass',
            message: 'Cost code read successfully',
            details: `Found ${readResult.data.length} cost codes`,
            duration: Date.now() - readStartTime,
          })
        } else {
          throw new Error('Cost code not found in list')
        }
      } else {
        throw new Error(readResult.error || 'Failed to read cost codes')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 1, {
        status: 'fail',
        message: 'Failed to read cost code',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - readStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 2, { status: 'running' })
    const updateStartTime = Date.now()
    
    try {
      const updateResult = await db.updateCostCode(createdCodeId, {
        actual_amount: 5000,
        description: 'Updated Test Cost Code',
      })

      if (updateResult.success) {
        const verifyResult = await db.listCostCodes(projectId)
        const updated = verifyResult.data?.find(c => c.id === createdCodeId)
        
        if (updated && updated.actual_amount === 5000) {
          updateTestStatus(suiteIndex, 2, {
            status: 'pass',
            message: 'Cost code updated successfully',
            details: 'Actual amount updated to $5,000',
            duration: Date.now() - updateStartTime,
          })
        } else {
          throw new Error('Update not persisted')
        }
      } else {
        throw new Error(updateResult.error || 'Failed to update cost code')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 2, {
        status: 'fail',
        message: 'Failed to update cost code',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - updateStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 3, { status: 'running' })
    const deleteStartTime = Date.now()
    
    try {
      const deleteResult = await db.deleteCostCode(createdCodeId)

      if (deleteResult.success) {
        const verifyResult = await db.listCostCodes(projectId)
        const found = verifyResult.data?.find(c => c.id === createdCodeId)
        
        if (!found) {
          updateTestStatus(suiteIndex, 3, {
            status: 'pass',
            message: 'Cost code deleted successfully',
            details: 'Cost code removed from database',
            duration: Date.now() - deleteStartTime,
          })
        } else {
          throw new Error('Cost code still exists after delete')
        }
      } else {
        throw new Error(deleteResult.error || 'Failed to delete cost code')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 3, {
        status: 'fail',
        message: 'Failed to delete cost code',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - deleteStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 4, { status: 'running' })
    const calcStartTime = Date.now()
    
    try {
      const code1 = await db.createCostCode({
        project_id: projectId,
        code: 'CALC-001',
        description: 'Calculation Test 1',
        category: 'labor',
        budget_amount: 10000,
        actual_amount: 8000,
      })

      const code2 = await db.createCostCode({
        project_id: projectId,
        code: 'CALC-002',
        description: 'Calculation Test 2',
        category: 'materials',
        budget_amount: 15000,
        actual_amount: 12000,
      })

      if (!code1.success || !code2.success) {
        throw new Error('Failed to create test cost codes')
      }

      const countsResult = await db.getDashboardCounts(projectId)
      
      if (countsResult.success && countsResult.data) {
        const { total_budget, total_actual } = countsResult.data
        
        if (total_budget >= 25000 && total_actual >= 20000) {
          updateTestStatus(suiteIndex, 4, {
            status: 'pass',
            message: 'Budget calculations correct',
            details: `Budget: $${total_budget.toLocaleString()}, Actual: $${total_actual.toLocaleString()}`,
            duration: Date.now() - calcStartTime,
          })
        } else {
          throw new Error(`Incorrect totals: Budget ${total_budget}, Actual ${total_actual}`)
        }
      } else {
        throw new Error('Failed to get dashboard counts')
      }

      if (code1.data) await db.deleteCostCode(code1.data.id)
      if (code2.data) await db.deleteCostCode(code2.data.id)
    } catch (error) {
      updateTestStatus(suiteIndex, 4, {
        status: 'fail',
        message: 'Budget calculation test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - calcStartTime,
      })
    }
  }

  const runContractTests = async (projectId: string) => {
    const suiteIndex = 5
    let createdContractId = ''

    updateTestStatus(suiteIndex, 0, { status: 'running' })
    const startTime = Date.now()
    
    try {
      const createResult = await db.createContract({
        project_id: projectId,
        contract_number: 'TEST-CONTRACT-001',
        title: 'Test Steel Fabrication Contract',
        contract_type: 'lump-sum',
        value: 500000,
        signed_date: '2024-01-15',
        start_date: '2024-02-01',
        completion_date: '2024-12-31',
        retainage: 10,
      })

      if (createResult.success && createResult.data) {
        createdContractId = createResult.data.id
        updateTestStatus(suiteIndex, 0, {
          status: 'pass',
          message: 'Contract created successfully',
          details: `Contract: TEST-CONTRACT-001, Value: $500,000`,
          duration: Date.now() - startTime,
        })
      } else {
        throw new Error(createResult.error || 'Failed to create contract')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 0, {
        status: 'fail',
        message: 'Failed to create contract',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 1, { status: 'running' })
    const readStartTime = Date.now()
    
    try {
      const readResult = await db.listContracts(projectId)

      if (readResult.success && readResult.data) {
        const found = readResult.data.find(c => c.id === createdContractId)
        if (found && found.contract_number === 'TEST-CONTRACT-001') {
          updateTestStatus(suiteIndex, 1, {
            status: 'pass',
            message: 'Contract read successfully',
            details: `Found ${readResult.data.length} contracts`,
            duration: Date.now() - readStartTime,
          })
        } else {
          throw new Error('Contract not found in list')
        }
      } else {
        throw new Error(readResult.error || 'Failed to read contracts')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 1, {
        status: 'fail',
        message: 'Failed to read contract',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - readStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 2, { status: 'running' })
    const updateStartTime = Date.now()
    
    try {
      const updateResult = await db.updateContract(createdContractId, {
        value: 550000,
        title: 'Updated Steel Fabrication Contract',
      })

      if (updateResult.success) {
        const verifyResult = await db.listContracts(projectId)
        const updated = verifyResult.data?.find(c => c.id === createdContractId)
        
        if (updated && updated.value === 550000) {
          updateTestStatus(suiteIndex, 2, {
            status: 'pass',
            message: 'Contract updated successfully',
            details: 'Value updated to $550,000',
            duration: Date.now() - updateStartTime,
          })
        } else {
          throw new Error('Update not persisted')
        }
      } else {
        throw new Error(updateResult.error || 'Failed to update contract')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 2, {
        status: 'fail',
        message: 'Failed to update contract',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - updateStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 3, { status: 'running' })
    const deleteStartTime = Date.now()
    
    try {
      const deleteResult = await db.deleteContract(createdContractId)

      if (deleteResult.success) {
        const verifyResult = await db.listContracts(projectId)
        const found = verifyResult.data?.find(c => c.id === createdContractId)
        
        if (!found) {
          updateTestStatus(suiteIndex, 3, {
            status: 'pass',
            message: 'Contract deleted successfully',
            details: 'Contract removed from database',
            duration: Date.now() - deleteStartTime,
          })
        } else {
          throw new Error('Contract still exists after delete')
        }
      } else {
        throw new Error(deleteResult.error || 'Failed to delete contract')
      }
    } catch (error) {
      updateTestStatus(suiteIndex, 3, {
        status: 'fail',
        message: 'Failed to delete contract',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - deleteStartTime,
      })
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    updateTestStatus(suiteIndex, 4, { status: 'running' })
    const calcStartTime = Date.now()
    
    try {
      const contract1 = await db.createContract({
        project_id: projectId,
        contract_number: 'VAL-001',
        title: 'Value Test 1',
        contract_type: 'time-and-materials',
        value: 250000,
        signed_date: '2024-01-01',
        start_date: '2024-01-15',
        retainage: 5,
      })

      const contract2 = await db.createContract({
        project_id: projectId,
        contract_number: 'VAL-002',
        title: 'Value Test 2',
        contract_type: 'unit-price',
        value: 350000,
        signed_date: '2024-01-01',
        start_date: '2024-01-15',
        retainage: 10,
      })

      if (!contract1.success || !contract2.success) {
        throw new Error('Failed to create test contracts')
      }

      const listResult = await db.listContracts(projectId)
      
      if (listResult.success && listResult.data) {
        const totalValue = listResult.data.reduce((sum, c) => sum + c.value, 0)
        
        if (totalValue >= 600000) {
          updateTestStatus(suiteIndex, 4, {
            status: 'pass',
            message: 'Contract value calculations correct',
            details: `Total value: $${totalValue.toLocaleString()}`,
            duration: Date.now() - calcStartTime,
          })
        } else {
          throw new Error(`Incorrect total: $${totalValue}`)
        }
      } else {
        throw new Error('Failed to list contracts')
      }

      if (contract1.data) await db.deleteContract(contract1.data.id)
      if (contract2.data) await db.deleteContract(contract2.data.id)
    } catch (error) {
      updateTestStatus(suiteIndex, 4, {
        status: 'fail',
        message: 'Value calculation test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - calcStartTime,
      })
    }
  }

  const runAllTests = async () => {
    if (!isDesktop) {
      toast.error('Test suite only works in Electron desktop mode')
      return
    }

    if (!testProjectId) {
      toast.error('Please enter a test project ID')
      return
    }

    setIsRunning(true)
    toast.info('Starting test suite...')

    try {
      await runRFITests(testProjectId)
      await runDrawingSetTests(testProjectId)
      await runDrawingSheetTests(testProjectId)
      await runEquipmentTests(testProjectId)
      await runCostCodeTests(testProjectId)
      await runContractTests(testProjectId)

      toast.success('Test suite completed')
    } catch (error) {
      toast.error('Test suite encountered an error')
      console.error('Test suite error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const resetTests = () => {
    setTestSuites(prev =>
      prev.map(suite => ({
        ...suite,
        tests: suite.tests.map(test => ({
          name: test.name,
          status: 'pending',
        })),
      }))
    )
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Pass</Badge>
      case 'fail':
        return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />Fail</Badge>
      case 'running':
        return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1 animate-spin" />Running</Badge>
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0)
  const passedTests = testSuites.reduce(
    (sum, suite) => sum + suite.tests.filter(t => t.status === 'pass').length,
    0
  )
  const failedTests = testSuites.reduce(
    (sum, suite) => sum + suite.tests.filter(t => t.status === 'fail').length,
    0
  )

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Database className="h-6 w-6 mr-3" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Electron Database Test Suite</h1>
            <p className="text-sm text-muted-foreground">
              Verify RFIs, Drawing Sets, Drawing Sheets, Equipment, Cost Codes, and Contracts persistence in SQLite
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {!isDesktop && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Desktop Mode Required</CardTitle>
                <CardDescription>
                  This test suite requires the Electron desktop environment to run. Please launch the app with <code>npm run electron:dev</code>
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Configure the test environment and run the automated test suite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Test Project ID</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                    placeholder="Enter project ID to test with..."
                    value={testProjectId}
                    onChange={(e) => setTestProjectId(e.target.value)}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use an existing project ID or create a new test project
                  </p>
                </div>
                <Button
                  onClick={runAllTests}
                  disabled={isRunning || !isDesktop || !testProjectId}
                  className="min-w-32"
                >
                  {isRunning ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Tests
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetTests}
                  disabled={isRunning}
                >
                  Reset
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{totalTests}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{failedTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {testSuites.map((suite, suiteIndex) => (
            <Card key={suiteIndex}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {suite.icon}
                  <CardTitle>{suite.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suite.tests.map((test, testIndex) => (
                    <div key={testIndex} className="flex items-start gap-4 p-3 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{test.name}</p>
                          {getStatusBadge(test.status)}
                        </div>
                        {test.message && (
                          <p className="text-sm text-muted-foreground">{test.message}</p>
                        )}
                        {test.details && (
                          <p className="text-xs text-muted-foreground mt-1">{test.details}</p>
                        )}
                        {test.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Duration: {test.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
