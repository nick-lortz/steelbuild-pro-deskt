import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Upload, Database, AlertTriangle, CheckCircle2 } from '@phosphor-icons/react';
import { downloadDataBackup, uploadDataBackup, exportAllData } from '@/lib/data-export';
import { toast } from 'sonner';

export default function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dataStats, setDataStats] = useState<{ totalKeys: number; dataSize: string } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadDataBackup();
      toast.success('Data backup downloaded successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await uploadDataBackup(file);
      if (result.success) {
        toast.success(result.message);
        await loadDataStats();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to import data');
      console.error(error);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const loadDataStats = async () => {
    setLoadingStats(true);
    try {
      const data = await exportAllData();
      if (data) {
        const jsonString = JSON.stringify(data);
        const sizeInBytes = new Blob([jsonString]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
        
        setDataStats({
          totalKeys: Object.keys(data).length,
          dataSize: parseFloat(sizeInMB) > 1 ? `${sizeInMB} MB` : `${sizeInKB} KB`,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleViewKeys = async () => {
    try {
      const data = await exportAllData();
      if (data) {
        console.log('All data keys:', Object.keys(data));
        console.log('Full data:', data);
        toast.success(`Found ${Object.keys(data).length} data keys. Check console for details.`);
      }
    } catch (error) {
      toast.error('Failed to view data keys');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-text">Data Management</h1>
            <p className="text-text-dim mt-1">Export, import, and manage your application data</p>
          </div>
          <Button onClick={loadDataStats} disabled={loadingStats} variant="outline">
            <Database className="mr-2" />
            {loadingStats ? 'Loading...' : 'Refresh Stats'}
          </Button>
        </div>

        {dataStats && (
          <Card className="phoenix-panel p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-text-mute text-sm uppercase tracking-wide mb-2">Total Data Keys</p>
                <p className="text-3xl font-bold text-text">{dataStats.totalKeys}</p>
              </div>
              <div>
                <p className="text-text-mute text-sm uppercase tracking-wide mb-2">Total Data Size</p>
                <p className="text-3xl font-bold text-text">{dataStats.dataSize}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="phoenix-panel p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Download className="text-accent mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text mb-2">Export Data</h3>
                <p className="text-text-dim mb-4">
                  Download a complete backup of all your application data as a JSON file. This includes projects, 
                  RFIs, cost codes, equipment, and all other stored data.
                </p>
                <Button onClick={handleExport} disabled={isExporting} className="phoenix-gradient">
                  <Download className="mr-2" />
                  {isExporting ? 'Exporting...' : 'Download Backup'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="phoenix-panel p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Upload className="text-accent mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text mb-2">Import Data</h3>
                <p className="text-text-dim mb-4">
                  Restore your data from a previously exported backup file. This will merge the imported data 
                  with your existing data.
                </p>
                <div className="flex items-center gap-3">
                  <Button asChild disabled={isImporting} variant="outline">
                    <label className="cursor-pointer">
                      <Upload className="mr-2" />
                      {isImporting ? 'Importing...' : 'Upload Backup'}
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                        disabled={isImporting}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="phoenix-panel p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Database className="text-info mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text mb-2">View Data Keys</h3>
                <p className="text-text-dim mb-4">
                  View all stored data keys in the browser console for debugging purposes.
                </p>
                <Button onClick={handleViewKeys} variant="outline">
                  <Database className="mr-2" />
                  View in Console
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="phoenix-panel p-6 border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-warning mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text mb-2">Important Notes</h3>
              <ul className="text-text-dim space-y-2 list-disc list-inside">
                <li>Data is stored in your browser's local storage or Spark KV system</li>
                <li>Clearing browser data will remove all application data</li>
                <li>Regular backups are recommended to prevent data loss</li>
                <li>Import will merge with existing data (not replace)</li>
                <li>In desktop mode, data is stored in a local SQLite database</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="phoenix-panel p-6 border-success/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-success mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text mb-2">Data Persistence</h3>
              <p className="text-text-dim mb-3">
                Your data is automatically persisted in the following locations depending on your runtime:
              </p>
              <ul className="text-text-dim space-y-2 list-disc list-inside">
                <li><strong>Web Mode:</strong> Spark KV storage (GitHub Spark runtime)</li>
                <li><strong>Desktop Mode:</strong> Local SQLite database in your user data directory</li>
                <li><strong>Electron App:</strong> SQLite database with offline support</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
