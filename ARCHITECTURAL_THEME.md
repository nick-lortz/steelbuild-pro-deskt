# SteelBuild Pro - Architectural Theme Design System

## Overview
The new theme transforms SteelBuild Pro into a light, modern, architectural visualization platform inspired by professional construction management interfaces. The design emphasizes clarity, warmth, and precision.

## Color Philosophy

### Primary Palette
- **Background**: `oklch(0.98 0.005 60)` - Soft warm white, reminiscent of architectural paper
- **Foreground**: `oklch(0.20 0.015 30)` - Deep charcoal for excellent readability
- **Primary**: `oklch(0.25 0.02 30)` - Professional dark gray for key actions
- **Accent**: `oklch(0.65 0.18 50)` - Warm amber/orange for highlights and progress indicators

### Semantic Colors
- **Success**: `oklch(0.60 0.15 145)` - Muted teal-green
- **Warning**: `oklch(0.70 0.16 70)` - Warm yellow-orange
- **Destructive**: `oklch(0.55 0.22 25)` - Subdued red

### Design Rationale
The warm hue shift (towards 50-70 in OKLCH) creates a construction-industry appropriate palette that feels:
- Professional and trustworthy
- Warm and approachable
- Architectural (like blueprints and site plans)
- Modern but not overly technical

## Typography

### Font Stack
- **Primary**: Inter (300-700 weights) - Clean, modern, excellent at all sizes
- **Serif**: PT Serif - For formal documents and headers
- **Mono**: Roboto Mono - For technical data, codes, and measurements

### Hierarchy
- **H1**: 2.5rem, weight 300, tight letter-spacing (-0.04em) - Large, light, architectural
- **H2**: 2rem, weight 400, letter-spacing (-0.035em) - Section headers
- **H3**: 1.5rem, weight 500 - Subsection headers
- **Body**: Default Inter with optimized font features for legibility

### Design Rationale
Lighter font weights (300-500) with tighter letter-spacing create an elegant, architectural feel that mirrors technical drawings and professional construction documents.

## Visual Effects & Utilities

### Warm Gradient Overlay
```css
.warm-gradient-overlay
```
Subtle orange-toned gradient for background panels that need visual interest without competing with content.

### Architectural Shadow
```css
.architectural-shadow
```
Multi-layered shadows with a hint of warm color to create depth while maintaining the light, clean aesthetic.

### Construction Card
```css
.construction-card
```
Gradient card backgrounds that feel tactile and premium, with subtle warmth.

### Progress Gradient
```css
.progress-gradient
```
Warm amber-to-orange gradient for progress bars and completion indicators.

### Isometric Grid
```css
.isometric-grid
```
30-degree angled grid pattern reminiscent of isometric architectural drawings.

### Blueprint Lines
```css
.blueprint-lines
```
Fine grid lines with accent color that evoke construction blueprints.

### Metric Highlight
```css
.metric-highlight
```
Highlighted panels for key metrics with left accent border and warm gradient background.

## Component Styling Guidelines

### Cards
- Use `.construction-card` for primary content containers
- Apply `.architectural-shadow` for floating cards
- Border radius: `0.75rem` (12px) for modern, soft corners

### Data Visualizations
- Use warm gradients for progress indicators
- Chart colors use the warm palette (orange, yellow-orange, amber)
- Backgrounds can use `.isometric-grid` or `.blueprint-lines` for context

### Interactive Elements
- Buttons should have subtle warm hover states
- Focus rings use the accent color for consistency
- Active states can use deeper amber tones

### Metrics & Stats
- Large numbers should be light weight (300) for elegance
- Use `.metric-highlight` for important KPIs
- Combine with icons from Phosphor set in accent colors

## Spacing & Layout

### Border Radius
- Small: 0.45rem (calc(0.75 * 0.6))
- Medium: 0.75rem (default)
- Large: 0.9rem (calc(0.75 * 1.2))
- Extra Large: 1.2rem (calc(0.75 * 1.6))

### Shadows
Shadows have been enhanced to be slightly stronger and include subtle warm tones:
- Use `shadow-md` for most cards
- Use `shadow-lg` for modals and overlays
- Use `.architectural-shadow` for special emphasis

## Implementation Examples

### Hero Section with Isometric Background
```tsx
<section className="isometric-grid warm-gradient-overlay p-8">
  <h1 className="text-foreground">Building Plan</h1>
  <p className="text-muted-foreground">Project overview and metrics</p>
</section>
```

### Metric Card
```tsx
<div className="construction-card architectural-shadow p-6 rounded-lg">
  <div className="metric-highlight p-4 rounded-md">
    <p className="text-sm text-muted-foreground">Progress Total</p>
    <h2 className="text-4xl font-light">72.34%</h2>
  </div>
</div>
```

### Progress Indicator
```tsx
<div className="h-2 bg-secondary rounded-full overflow-hidden">
  <div 
    className="h-full progress-gradient transition-all duration-500"
    style={{ width: '67%' }}
  />
</div>
```

## Migration Notes

### Breaking Changes
- Background changed from near-white to warm-tinted white
- Primary color shifted from blue to charcoal
- Accent changed from blue to warm amber/orange
- Typography weights significantly lightened

### Recommended Updates
1. Review custom components for color contrast
2. Update any hardcoded color values to use CSS variables
3. Test readability of all text against new backgrounds
4. Update chart/graph colors to use new warm palette
5. Add new utility classes where appropriate

## Design Principles

1. **Architectural Precision**: Clean lines, clear hierarchy, purposeful spacing
2. **Warm Professionalism**: Approachable but serious, warm but not playful
3. **Data Clarity**: Information should be immediately scannable
4. **Progressive Disclosure**: Show what's needed, hide complexity until required
5. **Tactile Quality**: Shadows and gradients should feel dimensional and real

## Accessibility

- All color combinations maintain WCAG AA contrast ratios (4.5:1 minimum)
- Focus states are clearly visible with accent color rings
- Font sizes and weights ensure readability at all sizes
- Hover states provide clear feedback for interactive elements

## Best Practices

✅ **Do:**
- Use warm gradients sparingly for accent areas
- Let white space breathe around content
- Use lighter font weights for large text
- Apply architectural patterns to backgrounds, not foregrounds
- Use the accent color for progress, highlights, and calls-to-action

❌ **Don't:**
- Overuse gradients (they should enhance, not dominate)
- Mix the warm palette with cool blues or purples
- Use heavy font weights for headlines
- Apply multiple competing patterns in the same view
- Use the accent color for body text

## Future Enhancements

Consider adding:
- 3D isometric illustrations for empty states
- Animated progress transitions with easing
- Interactive blueprint-style overlays for drawings
- Warm-toned photography for project hero images
- Custom icon set with construction/steel industry specificity
