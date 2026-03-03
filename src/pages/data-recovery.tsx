import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Database, Download, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

const KV_KEYS = [
  'projects',
  'costCodes',
  'changeOrders',
  'contracts',
  'drawingSets',
  'equipment',
  'checklistTemplates',
  'checklists',
  'rfis',
  'equipmentLogs',
  'tasks',
  'user-preferences',
  'gradient-presets',
]

export default function DataRecoveryPage() {
  const [dataStatus, setDataStatus] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [allKeys, setAllKeys] = useState<string[]>([])

  const checkData = async () => {
    setLoading(true)
    const status: Record<string, any> = {}
    
    try {
      const keys = await spark.kv.keys()
      setAllKeys(keys)
      
      for (const key of KV_KEYS) {
        const data = await spark.kv.get(key)
        status[key] = {
          exists: data !== undefined,
          count: Array.isArray(data) ? data.length : data ? 1 : 0,
          data: data,
        }
      }
      
      setDataStatus(status)
      toast.success('Data check complete')
    } catch (error) {
      toast.error('Failed to check data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkData()
  }, [])

  const exportAllData = async () => {
    try {
      const allData: Record<string, any> = {}
      const keys = await spark.kv.keys()
      
      for (const key of keys) {
        const data = await spark.kv.get(key)
        if (data !== undefined) {
          allData[key] = data
        }
      }
      
      const dataStr = JSON.stringify(allData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `steelbuild-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
      console.error(error)
    }
  }

  const importData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        let restored = 0
        for (const [key, value] of Object.entries(data)) {
          await spark.kv.set(key, value)
          restored++
        }
        
        toast.success(`Restored ${restored} data keys`)
        checkData()
      } catch (error) {
        toast.error('Failed to import data')
        console.error(error)
      }
    }
    input.click()
  }

  const viewData = (key: string, data: any) => {
    console.log(`Data for ${key}:`, data)
    toast.info(`Check console for ${key} data`)
  }

  const clearKey = async (key: string) => {
    if (!confirm(`Are you sure you want to clear all data for ${key}?`)) return
    
    try {
      await spark.kv.delete(key)
      toast.success(`Cleared ${key}`)
      checkData()
    } catch (error) {
      toast.error(`Failed to clear ${key}`)
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Data Recovery Center</h1>
          <p className="text-text-mute mt-1">Inspect, backup, and restore your SteelBuild Pro data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkData} variant="outline" disabled={loading}>
            <Database className="mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAllData} variant="outline">
            <Download className="mr-2" />
            Export All
          </Button>
          <Button onClick={importData}>
            <Upload className="mr-2" />
            Import Backup
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>All KV Keys Found:</strong> {allKeys.length} keys total
          {allKeys.length > 0 && (
            <div className="mt-2 text-xs font-mono max-h-20 overflow-auto">
              {allKeys.join(', ')}
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {KV_KEYS.map((key) => {
          const status = dataStatus[key]
          if (!status) return null

          return (
            <Card key={key} className="phoenix-panel">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display">{key}</CardTitle>
                  {status.exists ? (
                    <CheckCircle2 className="text-success" weight="fill" />
                  ) : (
                    <AlertCircle className="text-warning" weight="fill" />
                  )}
                </div>
                <CardDescription>
                  {status.exists ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {status.count} {status.count === 1 ? 'item' : 'items'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      No data
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => viewData(key, status.data)}
                    disabled={!status.exists}
                  >
                    View Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => clearKey(key)}
                    disabled={!status.exists}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {Object.keys(dataStatus).length > 0 && (
        <Card className="phoenix-panel">
          <CardHeader>
            <CardTitle className="font-display">Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-accent">
                  {Object.values(dataStatus).filter((s) => s.exists).length}
                </div>
                <div className="text-sm text-text-mute">Keys with data</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {Object.values(dataStatus).reduce((sum, s) => sum + s.count, 0)}
                </div>
                <div className="text-sm text-text-mute">Total items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {dataStatus.projects?.count || 0}
                </div>
                <div className="text-sm text-text-mute">Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-info">
                  {dataStatus.rfis?.count || 0}
                </div>
                <div className="text-sm text-text-mute">RFIs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
