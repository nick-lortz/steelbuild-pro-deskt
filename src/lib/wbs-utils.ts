import type { WBSCodeStructure, WBSLevel, WBSCode, TaskWithWBS } from '@/types/wbs';

export class WBSCodeGenerator {
  private structure: WBSCodeStructure;

  constructor(structure: WBSCodeStructure) {
    this.structure = structure;
  }

  generateCode(segments: (string | number)[]): string {
    if (segments.length > this.structure.levels.length) {
      throw new Error(`Too many segments. Maximum levels: ${this.structure.levels.length}`);
    }

    const formattedSegments = segments.map((segment, index) => {
      const level = this.structure.levels[index];
      return this.formatSegment(segment, level);
    });

    return formattedSegments.join(this.structure.separator);
  }

  private formatSegment(value: string | number, level: WBSLevel): string {
    const strValue = String(value);
    const prefix = level.prefix || '';
    const suffix = level.suffix || '';

    let formatted: string;

    switch (level.type) {
      case 'numeric':
        formatted = strValue.padStart(level.maxLength, '0');
        break;
      case 'alpha-upper':
        formatted = strValue.toUpperCase().padStart(level.maxLength, 'A');
        break;
      case 'alpha-lower':
        formatted = strValue.toLowerCase().padStart(level.maxLength, 'a');
        break;
      case 'custom':
        if (level.customValues && !level.customValues.includes(strValue)) {
          throw new Error(`Invalid value "${strValue}" for level ${level.name}. Expected one of: ${level.customValues.join(', ')}`);
        }
        formatted = strValue;
        break;
      default:
        formatted = strValue;
    }

    return `${prefix}${formatted}${suffix}`;
  }

  parseCode(code: string): WBSCode {
    const segments = code.split(this.structure.separator);
    
    return {
      full: code,
      segments,
      level: segments.length,
    };
  }

  getNextCode(parentCode: string | null, existingCodes: string[]): string {
    if (!parentCode) {
      const level1Codes = existingCodes
        .filter(code => !code.includes(this.structure.separator))
        .map(code => this.parseCode(code));
      
      const nextValue = this.getNextValue(level1Codes.map(c => c.segments[0]), this.structure.levels[0]);
      return this.generateCode([nextValue]);
    }

    const parsed = this.parseCode(parentCode);
    const currentLevel = parsed.level;
    
    if (currentLevel >= this.structure.levels.length) {
      throw new Error('Maximum WBS level reached');
    }

    const childCodes = existingCodes
      .filter(code => code.startsWith(parentCode + this.structure.separator))
      .map(code => this.parseCode(code))
      .filter(parsed => parsed.level === currentLevel + 1);

    const childSegments = childCodes.map(c => c.segments[currentLevel]);
    const nextValue = this.getNextValue(childSegments, this.structure.levels[currentLevel]);

    return this.generateCode([...parsed.segments, nextValue]);
  }

  private getNextValue(existingValues: string[], level: WBSLevel): string | number {
    if (level.type === 'custom' && level.customValues) {
      const used = new Set(existingValues);
      const available = level.customValues.find(v => !used.has(this.formatSegment(v, level)));
      if (!available) {
        throw new Error(`No available values for level ${level.name}`);
      }
      return available;
    }

    if (level.type === 'numeric') {
      const numbers = existingValues
        .map(v => parseInt(v.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
      const max = numbers.length > 0 ? Math.max(...numbers) : 0;
      return max + 1;
    }

    if (level.type === 'alpha-upper' || level.type === 'alpha-lower') {
      const letters = existingValues.map(v => v.replace(/[^a-zA-Z]/g, ''));
      if (letters.length === 0) return 'A';
      
      const lastLetter = letters[letters.length - 1].toUpperCase();
      const nextCharCode = lastLetter.charCodeAt(0) + 1;
      
      if (nextCharCode > 90) {
        throw new Error(`Maximum letter exceeded for level ${level.name}`);
      }
      
      return String.fromCharCode(nextCharCode);
    }

    return 1;
  }

  validateCode(code: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const segments = code.split(this.structure.separator);

    if (segments.length > this.structure.levels.length) {
      errors.push(`Code has too many levels (${segments.length}). Maximum: ${this.structure.levels.length}`);
    }

    segments.forEach((segment, index) => {
      const level = this.structure.levels[index];
      if (!level) return;

      const cleanSegment = segment.replace(level.prefix || '', '').replace(level.suffix || '', '');

      if (level.type === 'numeric' && !/^\d+$/.test(cleanSegment)) {
        errors.push(`Segment ${index + 1} "${segment}" must be numeric`);
      }

      if (level.type === 'alpha-upper' && !/^[A-Z]+$/.test(cleanSegment)) {
        errors.push(`Segment ${index + 1} "${segment}" must be uppercase letters`);
      }

      if (level.type === 'alpha-lower' && !/^[a-z]+$/.test(cleanSegment)) {
        errors.push(`Segment ${index + 1} "${segment}" must be lowercase letters`);
      }

      if (level.type === 'custom' && level.customValues && !level.customValues.includes(cleanSegment)) {
        errors.push(`Segment ${index + 1} "${segment}" must be one of: ${level.customValues.join(', ')}`);
      }

      if (cleanSegment.length > level.maxLength) {
        errors.push(`Segment ${index + 1} "${segment}" exceeds maximum length of ${level.maxLength}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getParentCode(code: string): string | null {
    const segments = code.split(this.structure.separator);
    if (segments.length <= 1) return null;
    
    return segments.slice(0, -1).join(this.structure.separator);
  }

  getLevel(code: string): number {
    return code.split(this.structure.separator).length;
  }

  getChildren(parentCode: string, allCodes: string[]): string[] {
    const parentLevel = this.getLevel(parentCode);
    
    return allCodes.filter(code => {
      if (this.getLevel(code) !== parentLevel + 1) return false;
      return code.startsWith(parentCode + this.structure.separator);
    });
  }

  getDescendants(ancestorCode: string, allCodes: string[]): string[] {
    return allCodes.filter(code => 
      code.startsWith(ancestorCode + this.structure.separator)
    );
  }

  buildHierarchy(tasks: TaskWithWBS[]): TaskWithWBS[] {
    const taskMap = new Map(tasks.map(t => [t.wbsCode, t]));
    const roots: TaskWithWBS[] = [];

    tasks.forEach(task => {
      const parentCode = this.getParentCode(task.wbsCode);
      
      if (!parentCode) {
        roots.push(task);
      }
    });

    return roots.sort((a, b) => a.wbsCode.localeCompare(b.wbsCode));
  }

  getSiblings(code: string, allCodes: string[]): string[] {
    const parentCode = this.getParentCode(code);
    const level = this.getLevel(code);
    
    if (!parentCode) {
      return allCodes.filter(c => this.getLevel(c) === 1 && c !== code);
    }

    return allCodes.filter(c => {
      if (c === code) return false;
      if (this.getLevel(c) !== level) return false;
      return c.startsWith(parentCode + this.structure.separator);
    });
  }

  resequence(tasks: TaskWithWBS[], startingCode?: string): TaskWithWBS[] {
    const resequenced: TaskWithWBS[] = [];
    const processed = new Set<string>();

    const resequenceLevel = (parentCode: string | null, startIndex: number = 1) => {
      const siblings = tasks.filter(t => {
        if (processed.has(t.id)) return false;
        const taskParent = this.getParentCode(t.wbsCode);
        return taskParent === parentCode;
      }).sort((a, b) => a.wbsCode.localeCompare(b.wbsCode));

      siblings.forEach((task, index) => {
        processed.add(task.id);
        
        const segments = parentCode 
          ? [...this.parseCode(parentCode).segments, startIndex + index]
          : [startIndex + index];
        
        const newCode = this.generateCode(segments);
        
        resequenced.push({
          ...task,
          wbsCode: newCode,
          parentWBSCode: parentCode || undefined,
        });

        resequenceLevel(newCode, 1);
      });
    };

    resequenceLevel(null, 1);

    return resequenced;
  }

  moveTask(task: TaskWithWBS, newParentCode: string | null, allTasks: TaskWithWBS[]): TaskWithWBS[] {
    const oldCode = task.wbsCode;
    const descendants = this.getDescendants(oldCode, allTasks.map(t => t.wbsCode));
    
    const existingCodes = allTasks
      .filter(t => t.wbsCode !== oldCode && !descendants.includes(t.wbsCode))
      .map(t => t.wbsCode);
    
    const newCode = this.getNextCode(newParentCode, existingCodes);
    
    const updatedTasks = allTasks.map(t => {
      if (t.wbsCode === oldCode) {
        return {
          ...t,
          wbsCode: newCode,
          parentWBSCode: newParentCode || undefined,
        };
      }
      
      if (descendants.includes(t.wbsCode)) {
        const relativePath = t.wbsCode.substring(oldCode.length);
        return {
          ...t,
          wbsCode: newCode + relativePath,
        };
      }
      
      return t;
    });

    return updatedTasks;
  }

  exportStructure(): WBSCodeStructure {
    return { ...this.structure };
  }

  getLevelName(code: string): string {
    const level = this.getLevel(code);
    return this.structure.levels[level - 1]?.name || `Level ${level}`;
  }
}

export function createWBSGenerator(structure: WBSCodeStructure): WBSCodeGenerator {
  return new WBSCodeGenerator(structure);
}

export function formatWBSCode(code: string, structure: WBSCodeStructure): string {
  const segments = code.split(structure.separator);
  
  return segments.map((segment, index) => {
    const level = structure.levels[index];
    if (!level) return segment;
    
    const prefix = level.prefix || '';
    const suffix = level.suffix || '';
    
    if (segment.startsWith(prefix)) {
      return segment;
    }
    
    return `${prefix}${segment}${suffix}`;
  }).join(structure.separator);
}

export function compareWBSCodes(a: string, b: string, separator: string = '.'): number {
  const segmentsA = a.split(separator);
  const segmentsB = b.split(separator);
  
  const maxLength = Math.max(segmentsA.length, segmentsB.length);
  
  for (let i = 0; i < maxLength; i++) {
    const segA = segmentsA[i] || '';
    const segB = segmentsB[i] || '';
    
    if (segA === segB) continue;
    
    const numA = parseInt(segA.replace(/\D/g, ''), 10);
    const numB = parseInt(segB.replace(/\D/g, ''), 10);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    return segA.localeCompare(segB);
  }
  
  return 0;
}

export function getWBSDepth(code: string, separator: string = '.'): number {
  return code.split(separator).length;
}

export function isDescendantOf(childCode: string, ancestorCode: string, separator: string = '.'): boolean {
  return childCode.startsWith(ancestorCode + separator);
}

export function getCommonAncestor(codes: string[], separator: string = '.'): string | null {
  if (codes.length === 0) return null;
  if (codes.length === 1) return codes[0];
  
  const segmentArrays = codes.map(code => code.split(separator));
  const minLength = Math.min(...segmentArrays.map(arr => arr.length));
  
  const commonSegments: string[] = [];
  
  for (let i = 0; i < minLength; i++) {
    const firstSegment = segmentArrays[0][i];
    const allMatch = segmentArrays.every(arr => arr[i] === firstSegment);
    
    if (allMatch) {
      commonSegments.push(firstSegment);
    } else {
      break;
    }
  }
  
  return commonSegments.length > 0 ? commonSegments.join(separator) : null;
}
