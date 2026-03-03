# WBS Code Structure Implementation

## Overview

A comprehensive Work Breakdown Structure (WBS) coding system has been implemented for SteelBuild Pro to enable hierarchical project organization and better task management in construction projects.

## Features

### 1. **Flexible WBS Configuration**
- Multi-level hierarchical coding (up to unlimited levels)
- Configurable format types per level:
  - Numeric (1, 2, 3...)
  - Alpha Upper (A, B, C...)
  - Alpha Lower (a, b, c...)
  - Custom values (user-defined lists)
- Custom separators (., -, /, etc.)
- Prefix and suffix support per level
- Per-project configuration

### 2. **Industry Templates**

#### Steel Fabrication Template
```
Format: Phase.Area.Sequence.Activity
Example: 01.A.001.05
```
- **Level 1 - Phase**: 01-Detailing, 02-Fabrication, 03-Delivery, 04-Erection
- **Level 2 - Area/Zone**: A, B, C... (building areas)
- **Level 3 - Sequence**: 001, 002, 003... (work sequences)
- **Level 4 - Activity**: 01, 02, 03... (specific tasks)

#### Steel Erection Template
```
Format: Building-Level-Sequence-Task
Example: A-L02-S015-08
```
- **Level 1 - Building**: A, B, C... (building identifier)
- **Level 2 - Level/Floor**: L01, L02, L03... (floor level)
- **Level 3 - Sequence**: S001, S002... (erection sequence)
- **Level 4 - Task**: 01, 02... (task number)

### 3. **Automatic Code Generation**
- Automatic assignment of next available WBS code
- Intelligent sequencing based on parent codes
- Validation of code format and uniqueness
- Automatic resequencing capabilities

### 4. **Hierarchical Task Management**
- Parent-child task relationships via WBS codes
- Subtask creation with automatic code assignment
- Visual hierarchy representation
- Collapsible tree structure in Gantt view

### 5. **Enhanced Gantt View**
- WBS-based hierarchical display
- Expandable/collapsible task groups
- Visual level indicators with indentation
- WBS code badges on each task
- Quick actions for subtask creation
- Dependency visualization
- Critical path highlighting

## Usage

### Setting Up WBS Structure

1. **Navigate to WBS Settings**
   ```
   Projects → [Select Project] → Schedule → WBS Settings
   ```

2. **Choose Configuration Method**
   - **Template**: Select from industry-standard templates
   - **Custom**: Create your own structure from scratch

3. **Configure Levels**
   - Add levels using the "+ Add Level" button
   - For each level, configure:
     - Level name (e.g., "Phase", "Area", "Sequence")
     - Format type (Numeric, Alpha Upper, Alpha Lower, Custom)
     - Max length (number of characters/digits)
     - Prefix/Suffix (optional)

4. **Test Your Structure**
   - Use the "Test Code" button to generate sample codes
   - Preview shows example hierarchy

### Creating Tasks with WBS Codes

#### Method 1: Top-Level Task
```typescript
// New task is automatically assigned next WBS code
// If existing: 01, 02, 03
// New task gets: 04
```

#### Method 2: Subtask Creation
```typescript
// Click "Add Subtask" on parent task (e.g., 01)
// New subtask automatically gets: 01.A (or 01.001, depending on structure)
```

#### Method 3: Direct Entry
```typescript
// Manual WBS code entry is validated against structure
// Invalid codes are rejected with helpful error messages
```

### WBS Code Operations

#### Moving Tasks
```typescript
// Move task to new parent
// All child codes are automatically updated
// Example: Move 01.A → 02.B
//   01.A.001 becomes 02.B.001
//   01.A.002 becomes 02.B.002
```

#### Resequencing
```typescript
// Automatically renumber all codes in sequence
// Maintains hierarchy relationships
// Useful after bulk deletions or reorganization
```

#### Validation
```typescript
// Real-time validation of WBS codes
// Checks format, length, uniqueness
// Provides actionable error messages
```

## API Reference

### WBSCodeGenerator Class

```typescript
import { createWBSGenerator } from '@/lib/wbs-utils';

const generator = createWBSGenerator(wbsStructure);

// Generate new code
const code = generator.generateCode([1, 'A', 1, 5]);
// Returns: "01.A.001.05"

// Get next available code
const nextCode = generator.getNextCode('01.A', existingCodes);
// Returns: "01.A.003" (if 001 and 002 exist)

// Parse existing code
const parsed = generator.parseCode('01.A.001.05');
// Returns: { full: "01.A.001.05", segments: ["01", "A", "001", "05"], level: 4 }

// Validate code
const validation = generator.validateCode('01.A.001.05');
// Returns: { valid: true, errors: [] }

// Get parent code
const parent = generator.getParentCode('01.A.001.05');
// Returns: "01.A.001"

// Get children
const children = generator.getChildren('01.A', allCodes);
// Returns: ["01.A.001", "01.A.002", ...]
```

### Utility Functions

```typescript
import {
  compareWBSCodes,
  getWBSDepth,
  isDescendantOf,
  getCommonAncestor,
} from '@/lib/wbs-utils';

// Compare codes for sorting
const result = compareWBSCodes('01.A.001', '01.B.001', '.');
// Returns: -1 (first comes before second)

// Get depth
const depth = getWBSDepth('01.A.001.05', '.');
// Returns: 4

// Check descendant
const isChild = isDescendantOf('01.A.001', '01.A', '.');
// Returns: true

// Find common ancestor
const ancestor = getCommonAncestor(['01.A.001', '01.A.002', '01.B.001'], '.');
// Returns: "01"
```

## Data Model

### WBSCodeStructure
```typescript
interface WBSCodeStructure {
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
```

### WBSLevel
```typescript
interface WBSLevel {
  level: number;
  name: string;
  type: 'numeric' | 'alpha-upper' | 'alpha-lower' | 'custom';
  maxLength: number;
  prefix?: string;
  suffix?: string;
  customValues?: string[];
}
```

### TaskWithWBS
```typescript
interface TaskWithWBS {
  id: string;
  projectId: string;
  name: string;
  wbsCode: string;              // Full WBS code (e.g., "01.A.001.05")
  wbsLevel: number;             // Hierarchy level (1, 2, 3, 4)
  parentWBSCode?: string;       // Parent's WBS code
  // ... other task fields
}
```

## Best Practices

### 1. **Plan Your Structure**
- Consider your project phases and organization
- Match industry standards when possible
- Keep it simple - don't over-complicate
- Max 4-6 levels for most projects

### 2. **Use Meaningful Names**
- Level names should be clear (Phase, Area, not Level1, Level2)
- Use industry terminology
- Document your structure for the team

### 3. **Consistent Application**
- Apply WBS codes to ALL tasks
- Use the same structure across similar projects
- Train team on WBS conventions

### 4. **Regular Maintenance**
- Periodically resequence if codes become irregular
- Archive completed phases
- Update structure as project evolves

### 5. **Integration Points**
- Link cost codes to WBS codes
- Map WBS to deliverable packages
- Use WBS for progress reporting
- Filter reports by WBS levels

## Example Workflows

### Steel Fabrication Project

```
01 - Detailing Phase
  01.A - Building A
    01.A.001 - Columns Detailing
      01.A.001.01 - Generate column schedules
      01.A.001.02 - Create column details
    01.A.002 - Beams Detailing
  01.B - Building B
    01.B.001 - Columns Detailing

02 - Fabrication Phase
  02.A - Building A Fab
    02.A.001 - Column Fabrication
      02.A.001.01 - Cut columns
      02.A.001.02 - Weld base plates
      02.A.001.03 - QC inspection
    02.A.002 - Beam Fabrication

03 - Delivery Phase
  03.A - First Shipment
    03.A.001 - Load columns
    03.A.002 - Transport to site
  03.B - Second Shipment

04 - Erection Phase
  04.A - Building A Erection
    04.A.001 - Set columns
    04.A.002 - Install beams
```

### Steel Erection Project

```
A - Building A
  A-L01 - Level 1
    A-L01-S001 - Grid A Columns
      A-L01-S001-01 - Survey and mark
      A-L01-S001-02 - Set columns
      A-L01-S001-03 - Plumb and bolt
    A-L01-S002 - Grid B Columns
  A-L02 - Level 2
    A-L02-S001 - Floor beams
    A-L02-S002 - Roof joists

B - Building B
  B-L01 - Level 1
  B-L02 - Level 2
```

## Troubleshooting

### Common Issues

**Issue**: "Maximum WBS level reached"
- **Solution**: Your structure has reached its configured max levels. Create a sibling task instead of a subtask, or add another level to your structure.

**Issue**: "Invalid code format"
- **Solution**: Check that your code matches the configured format (numeric vs. alpha, length, prefix/suffix). Use the validation function for details.

**Issue**: "No available values for level"
- **Solution**: For custom level types, you've used all available values. Add more custom values or change the level type.

**Issue**: Codes are out of sequence
- **Solution**: Use the "Resequence" function to automatically renumber all tasks while maintaining hierarchy.

## Performance Considerations

- WBS operations are optimized for up to 10,000 tasks per project
- Code generation is O(log n) complexity
- Hierarchy rendering uses virtualization for large trees
- Validation is cached to avoid repeated computations

## Future Enhancements

- [ ] WBS dictionary with descriptions per code
- [ ] Multi-project WBS templates library
- [ ] WBS-based cost code mapping
- [ ] Export WBS structure to MS Project / Primavera
- [ ] Import existing WBS from other systems
- [ ] AI-assisted WBS generation based on project type
- [ ] WBS-based permission controls
- [ ] Baseline WBS snapshots and change tracking

## Support

For questions or issues with WBS implementation, contact the development team or refer to the main SteelBuild Pro documentation.
