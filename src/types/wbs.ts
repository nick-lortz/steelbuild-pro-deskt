export interface WBSCodeStructure {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  levels: WBSLevel[];
  separator: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WBSLevel {
  level: number;
  name: string;
  type: 'numeric' | 'alpha-upper' | 'alpha-lower' | 'custom';
  maxLength: number;
  prefix?: string;
  suffix?: string;
  customValues?: string[];
}

export interface WBSCode {
  full: string;
  segments: string[];
  level: number;
}

export interface TaskWithWBS {
  id: string;
  projectId: string;
  name: string;
  wbsCode: string;
  wbsLevel: number;
  parentWBSCode?: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  baselineStartDate?: string;
  baselineEndDate?: string;
  dependencies?: string[];
  percentComplete: number;
  isCriticalPath: boolean;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  costCode?: string;
  phase?: string;
  discipline?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export type WBSCodeFormat = 
  | 'numeric'           // 1, 2, 3...
  | 'alpha-upper'       // A, B, C...
  | 'alpha-lower'       // a, b, c...
  | 'custom';           // User-defined list

export interface WBSTemplate {
  id: string;
  name: string;
  description: string;
  industry: 'steel-fabrication' | 'steel-erection' | 'general-construction' | 'custom';
  structure: WBSCodeStructure;
}

export const STEEL_FABRICATION_TEMPLATE: WBSTemplate = {
  id: 'steel-fab-default',
  name: 'Steel Fabrication Standard',
  description: 'Industry-standard WBS for structural steel fabrication projects',
  industry: 'steel-fabrication',
  structure: {
    id: 'steel-fab-structure',
    projectId: '',
    name: 'Steel Fabrication WBS',
    description: 'Phase.Area.Sequence.Activity format',
    levels: [
      {
        level: 1,
        name: 'Phase',
        type: 'numeric',
        maxLength: 2,
        customValues: ['01-Detailing', '02-Fabrication', '03-Delivery', '04-Erection']
      },
      {
        level: 2,
        name: 'Area/Zone',
        type: 'alpha-upper',
        maxLength: 1,
      },
      {
        level: 3,
        name: 'Sequence',
        type: 'numeric',
        maxLength: 3,
      },
      {
        level: 4,
        name: 'Activity',
        type: 'numeric',
        maxLength: 2,
      }
    ],
    separator: '.',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
};

export const STEEL_ERECTION_TEMPLATE: WBSTemplate = {
  id: 'steel-erection-default',
  name: 'Steel Erection Standard',
  description: 'Industry-standard WBS for structural steel erection projects',
  industry: 'steel-erection',
  structure: {
    id: 'steel-erection-structure',
    projectId: '',
    name: 'Steel Erection WBS',
    description: 'Building.Level.Sequence.Task format',
    levels: [
      {
        level: 1,
        name: 'Building',
        type: 'alpha-upper',
        maxLength: 1,
      },
      {
        level: 2,
        name: 'Level/Floor',
        type: 'numeric',
        maxLength: 2,
        prefix: 'L',
      },
      {
        level: 3,
        name: 'Sequence',
        type: 'numeric',
        maxLength: 3,
        prefix: 'S',
      },
      {
        level: 4,
        name: 'Task',
        type: 'numeric',
        maxLength: 2,
      }
    ],
    separator: '-',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
};

export const DEFAULT_WBS_TEMPLATES: WBSTemplate[] = [
  STEEL_FABRICATION_TEMPLATE,
  STEEL_ERECTION_TEMPLATE,
];
