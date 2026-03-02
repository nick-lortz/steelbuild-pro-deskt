export interface ElectronAPI {
  getUserDataPath: () => Promise<string>;
  saveFileDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  openFileDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  writeFile: (filePath: string, data: string | Buffer) => Promise<{ success: boolean; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  onMenuNewProject: (callback: () => void) => () => void;
  onMenuExportDailyReport: (callback: (filePath: string) => void) => () => void;
  onMenuExportSOV: (callback: (filePath: string) => void) => () => void;
  onMenuNavigate: (callback: (path: string) => void) => () => void;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
