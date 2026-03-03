export async function exportAllData() {
  if (typeof window === 'undefined' || !window.spark?.kv) {
    console.error('Spark KV not available');
    return null;
  }

  try {
    const keys = await window.spark.kv.keys();
    const data: Record<string, any> = {};

    for (const key of keys) {
      const value = await window.spark.kv.get(key);
      data[key] = value;
    }

    return data;
  } catch (error) {
    console.error('Failed to export data:', error);
    return null;
  }
}

export async function downloadDataBackup() {
  const data = await exportAllData();
  
  if (!data) {
    alert('Failed to export data');
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `steelbuild-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(jsonData: Record<string, any>) {
  if (typeof window === 'undefined' || !window.spark?.kv) {
    console.error('Spark KV not available');
    return { success: false, error: 'Spark KV not available' };
  }

  try {
    let imported = 0;
    const errors: string[] = [];

    for (const [key, value] of Object.entries(jsonData)) {
      try {
        await window.spark.kv.set(key, value);
        imported++;
      } catch (err) {
        errors.push(`Failed to import ${key}: ${err}`);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Failed to import data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function uploadDataBackup(file: File): Promise<{ success: boolean; message: string; imported?: number }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    const result = await importData(data);
    
    if (result.success) {
      return {
        success: true,
        message: `Successfully imported ${result.imported} data items`,
        imported: result.imported,
      };
    } else {
      return {
        success: false,
        message: result.error || 'Import failed with errors',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to parse backup file',
    };
  }
}
