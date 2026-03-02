import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useElectronAPI() {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
  
  return {
    isElectron,
    api: isElectron ? window.electronAPI : undefined,
  };
}

export function useElectronMenuHandlers() {
  const navigate = useNavigate();
  const { isElectron, api } = useElectronAPI();

  useEffect(() => {
    if (!isElectron || !api) return;

    const unsubNavigate = api.onMenuNavigate((path: string) => {
      navigate(path);
    });

    return () => {
      unsubNavigate();
    };
  }, [isElectron, api, navigate]);
}

export function useElectronFileOperations() {
  const { isElectron, api } = useElectronAPI();

  const saveFile = async (defaultPath: string, data: string, filters?: Array<{ name: string; extensions: string[] }>) => {
    if (!isElectron || !api) {
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultPath;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const result = await api.saveFileDialog({
      defaultPath,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });

    if (!result.canceled && result.filePath) {
      await api.writeFile(result.filePath, data);
    }
  };

  const openFile = async (filters?: Array<{ name: string; extensions: string[] }>) => {
    if (!isElectron || !api) {
      return new Promise<string | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        if (filters && filters.length > 0) {
          input.accept = filters.map(f => f.extensions.map(ext => `.${ext}`).join(',')).join(',');
        }
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const text = await file.text();
            resolve(text);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }

    const result = await api.openFileDialog({
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const fileResult = await api.readFile(result.filePaths[0]);
      if (fileResult.success) {
        return fileResult.data || null;
      }
    }

    return null;
  };

  return {
    saveFile,
    openFile,
  };
}
