export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    getUserDataPath: () => Promise<string>;
  };

  shell: {
    openExternal: (url: string) => Promise<{ success: boolean }>;
  };

  dialog: {
    saveFile: (options: {
      title?: string;
      defaultPath?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }) => Promise<{ canceled: boolean; filePath?: string }>;
    openFile: (options: {
      title?: string;
      defaultPath?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
      properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
    }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  };

  fs: {
    writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
    readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  };

  db: {
    query: (query: string, params?: any[]) => Promise<{ success: boolean; data: any[]; message?: string }>;
    execute: (query: string, params?: any[]) => Promise<{ success: boolean; affectedRows: number; message?: string }>;
  };

  menu: {
    onNewProject: (callback: () => void) => () => void;
    onExportDailyReport: (callback: (filePath: string) => void) => () => void;
    onExportSOV: (callback: (filePath: string) => void) => () => void;
    onNavigate: (callback: (path: string) => void) => () => void;
  };

  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
