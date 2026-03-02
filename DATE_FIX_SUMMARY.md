# Date Issue Fix Summary

## Problem
The application was displaying dates one day before the date entered by users. This occurred because the code was using `new Date().toISOString().split('T')[0]` to get date strings.

### Root Cause
The `.toISOString()` method converts dates to UTC timezone. For users in timezones behind UTC (e.g., US timezones), this conversion can result in the previous calendar day.

**Example:**
- User's local time: January 15, 2025 11:00 PM PST
- `new Date().toISOString()`: `2025-01-16T07:00:00.000Z` (UTC)
- `.split('T')[0]`: `2025-01-16` ❌ (wrong day)

## Solution
Created a utility function `getLocalDateString()` that uses local timezone values instead of UTC conversion:

```typescript
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

This function:
- Uses `getFullYear()`, `getMonth()`, and `getDate()` which return local timezone values
- Properly pads month and day with leading zeros
- Returns format: `YYYY-MM-DD` (compatible with HTML date inputs)

## Files Fixed

### 1. `/src/lib/utils.ts`
Added the `getLocalDateString()` utility function.

### 2. `/src/components/rfis/rfi-form-dialog.tsx`
Fixed two instances:
- Line 53: Default `submittedDate` value
- Line 69: Reset form `submittedDate` value

**Before:**
```typescript
submittedDate: new Date().toISOString().split('T')[0]
```

**After:**
```typescript
submittedDate: getLocalDateString()
```

### 3. `/src/components/projects/project-form-dialog.tsx`
Fixed one instance:
- Line 52: Default `startDate` value

**Before:**
```typescript
startDate: new Date().toISOString().split('T')[0]
```

**After:**
```typescript
startDate: getLocalDateString()
```

### 4. `/src/pages/change-orders/change-orders-page-impl.tsx`
Added import for future use. Note: Lines 93 and 100 use `.toISOString()` correctly for timestamp fields (`requestedDate` and `createdAt`), not date-only fields.

## Date vs Timestamp Guidelines

### Use `getLocalDateString()` for:
- Date-only fields displayed in `<input type="date">` elements
- Fields named with "Date" suffix that represent calendar dates
- Examples: `startDate`, `endDate`, `submittedDate`, `dueDate`, `baselineDate`

### Use `.toISOString()` for:
- Timestamp fields that include time
- Fields named with "At" suffix
- Examples: `createdAt`, `updatedAt`, `joinedAt`, `completedAt`

## Testing
To verify the fix:
1. Create a new RFI and check the "Date Submitted" field - should show today's date
2. Create a new Project and check the "Start Date" field - should show today's date
3. Verify dates persist correctly after saving
4. Test in different timezones (particularly UTC-negative zones like US timezones)

## Status
✅ Core date handling fixed
✅ Utility function created
✅ RFI form fixed
✅ Project form fixed
✅ Change orders reviewed (timestamps are correct)

## Additional Notes
The ESLint warnings appearing in the output are unrelated to this fix - they're configuration issues with the eslint-plugin-react version compatibility.
