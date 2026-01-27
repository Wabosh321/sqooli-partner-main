# Dashboard Design Specification - Implementation Reference

## Visual Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            Dashboard Page (1400px max)                           │
│                         Background: #F7F9FC (Light Gray-Blue)                    │
│                          Padding: 24px (All Sides)                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Dashboard    [+ New Campaign]                                                   │
│  (32px, Bold, #0F172A)                                                          │
│                                                                                   │
├────────────────────────────────────────────────┬──────────────────────────────────┤
│                                                │                                  │
│  ┌──────────────────────────────────────────┐ │ ┌────────────────────────────┐  │
│  │     Wallet Balance                       │ │ │  ⏰ Upcoming Campaigns     │  │
│  │     KES 23,450.00                        │ │ │  ┌────────────────────────┐│  │
│  │  [M-Pesa] ••••5463    [Withdraw]         │ │ │  │ 21 Apr 2025            ││  │
│  │                                          │ │ │  │ Good Friday Disc...    ││  │
│  │ Blue Gradient Background                 │ │ │  └────────────────────────┘│  │
│  │ (135deg, #5B8DEF → #6AAEFF)             │ │ │  ┌────────────────────────┐│  │
│  │ Border Radius: 16px                      │ │ │  │ 21 Apr 2025            ││  │
│  │ Height: 140px                            │ │ │  │ Good Friday Disc...    ││  │
│  │ Column Span: 8/12                        │ │ │  └────────────────────────┘│  │
│  └──────────────────────────────────────────┘ │ │ Purple Gradient (180deg)   │  │
│                                                │ │ #F5E8FF → #EEF2FF         │  │
│                          Grid Gap: 24px        │ │ Column Span: 4/12          │  │
│                                                │ └────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │   📚     │  │   ✅     │  │   ⏳     │  │   👥     │                         │
│  │ Total    │  │ Claimed  │  │ Pending  │  │Benefic.  │                         │
│  │ Lessons  │  │    0     │  │    0     │  │    0     │                         │
│  │    0     │  │          │  │          │  │          │                         │
│  │          │  │          │  │          │  │          │                         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                         │
│  Column Span: 12/12                                                               │
│  Grid: 4 Equal Columns                                                            │
│                                                                                    │
├──────────────────────────────────────────────┬────────────────────────────────────┤
│                                              │                                    │
│  ┌────────────────────────────────────────┐ │ ┌──────────────────────────────┐  │
│  │  📈 Earnings                           │ │ │  Recent Activity             │  │
│  │  KES 12,458.57                         │ │ │  ──────────────────────────  │  │
│  │                                        │ │ │                              │  │
│  │  [SVG Line Chart with Gradient]        │ │ │  J  John Aimo               │  │
│  │  1 Sep ... 25 Sep                      │ │ │     Downloaded Report...    │  │
│  │                                        │ │ │     22 Jan 2024 at 9:34 PM  │  │
│  │ White Background (#FFFFFF)             │ │ │                              │  │
│  │ Border: 1px solid #E2E8F0             │ │ │  J  John Aimo               │  │
│  │ Shadow: 0 1px 2px rgba(0,0,0,0.04)   │ │ │     Downloaded Report...    │  │
│  │ Border Radius: 16px                    │ │ │     22 Jan 2024 at 9:34 PM  │  │
│  │ Height: 320px                          │ │ │                              │  │
│  │ Column Span: 8/12                      │ │ │  P  Peter Okumu             │  │
│  │ Padding: 24px                          │ │ │     send a message          │  │
│  └────────────────────────────────────────┘ │ │     22 Jun 2024 at 9:34 PM  │  │
│                                              │ │                              │  │
│                          Grid Gap: 24px      │ │ White Background (#FFFFFF)   │  │
│                                              │ │ Border: 1px solid #E2E8F0  │  │
│                                              │ │ Border Radius: 16px         │  │
│                                              │ │ Column Span: 4/12           │  │
│                                              │ │ Padding: 16px               │  │
│                                              │ └──────────────────────────────┘  │
│                                              │                                    │
└──────────────────────────────────────────────┴────────────────────────────────────┘
```

---

## Color Palette

### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Page Background | `#F7F9FC` | Page background color |
| Section Background | `#FFFFFF` | Card backgrounds |
| Text Primary | `#0F172A` | Main text, headings |
| Text Secondary | `#64748B` | Meta text, labels |
| Text Muted | `#94A3B8` | Disabled text, timestamps |
| Primary Action | `#2563EB` | Links, buttons, highlights |
| Accent Light | `#EEF2FF` | Light backgrounds, highlights |

### Gradients
| Name | Start | End | Usage |
|------|-------|-----|-------|
| Wallet | `#5B8DEF` | `#6AAEFF` | Wallet balance card (135deg) |
| Campaigns | `#F5E8FF` | `#EEF2FF` | Upcoming campaigns card (180deg) |

### Component Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#22C55E` | Positive indicators |
| Warning | `#F59E0B` | Warnings |
| Error | `#EF4444` | Errors |
| Border Light | `#E5E7EB` | Light borders |
| Border Muted | `#E2E8F0` | Card borders |

---

## Spacing System

### Base Units (4px Grid)
```
xs:  4px   (1 unit)
sm:  8px   (2 units)
md:  16px  (4 units)
lg:  24px  (6 units)
xl:  32px  (8 units)
```

### Applied Spacing
| Element | Value |
|---------|-------|
| Page Padding | 24px |
| Grid Gap | 24px |
| Section Padding | 24px |
| Card Padding | 16-24px |
| Item Spacing | 12px |
| Icon Size | 36px |

---

## Typography

### Font
- Family: `"Inter", system-ui, -apple-system, sans-serif`
- Base Size: `14px`

### Sizes
| Size | Pixels | Usage |
|------|--------|-------|
| xs | 12px | Small text, captions |
| sm | 14px | Body text, default |
| md | 16px | Slightly larger body |
| lg | 18px | Larger text |
| xl | 20px | Small headings |
| 2xl | 24px | Section headings |
| 3xl | 32px | Page title |

### Weights
| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 400 | Body text |
| Medium | 500 | Labels, secondary headings |
| Semibold | 600 | Card titles |
| Bold | 700 | Main headings |

### Line Heights
- Tight: 1.25 (headings)
- Normal: 1.5 (body text)
- Relaxed: 1.75 (longer content)

---

## Border & Shadows

### Border Radius
| Size | Pixels | Usage |
|------|--------|-------|
| sm | 8px | Buttons, small elements |
| md | 12px | Input fields |
| lg | 16px | Cards, major sections |
| xl | 20px | Large sections |

### Shadows
| Level | CSS | Usage |
|-------|-----|-------|
| sm | `0 1px 2px rgba(0,0,0,0.04)` | Card shadows |
| md | `0 4px 6px rgba(0,0,0,0.1)` | Elevated components |
| lg | `0 10px 15px rgba(0,0,0,0.1)` | Overlays, modals |

---

## Grid System

### Layout
- **Type**: CSS Grid (12-column)
- **Max Width**: 1400px
- **Gap**: 24px
- **Padding**: 24px (page level)

### Column Distribution
| Component | Columns | Width % |
|-----------|---------|---------|
| Wallet Card | 8 | 66.67% |
| Upcoming Campaigns | 4 | 33.33% |
| Stats Grid | 12 | 100% |
| Chart | 8 | 66.67% |
| Recent Activity | 4 | 33.33% |

---

## Component Specifications

### Wallet Balance Card
```
Grid Column: span 8
Height: 140px
Background: linear-gradient(135deg, #5B8DEF, #6AAEFF)
Border Radius: 16px
Padding: 24px
Text Color: #FFFFFF (white)
Layout: Flexbox, space-between (title top, account+button bottom)
```

### Upcoming Campaigns Card
```
Grid Column: span 4
Background: linear-gradient(180deg, #F5E8FF, #EEF2FF)
Border Radius: 16px
Padding: 16px
Item Height: 48px
Items Background: #FFFFFF
Item Border Radius: 8px
Item Padding: 12px
```

### Stats Grid (Small Cards)
```
Grid Column: span 12
Layout: 4-column grid (grid-cols-4)
Gap: 16px
Card Background: #FFFFFF
Card Border: 1px solid #E2E8F0
Card Border Radius: 12px
Card Padding: 16px
Card Shadow: 0 1px 2px rgba(0,0,0,0.04)
```

### Chart (Earnings)
```
Grid Column: span 8
Height: 320px (minimum)
Background: #FFFFFF
Border: 1px solid #E2E8F0
Border Radius: 16px
Padding: 24px
Shadow: 0 1px 2px rgba(0,0,0,0.04)
Title: "📈 Earnings" (Semibold, 14px, #0F172A)
Subtitle: "KES 12,458.57" (12px, #64748B)
```

### Recent Activity Card
```
Grid Column: span 4
Background: #FFFFFF
Border: 1px solid #E2E8F0
Border Radius: 16px
Padding: 16px
Shadow: 0 1px 2px rgba(0,0,0,0.04)
Header: "Recent Activity" + "View All" (link, #2563EB)
Item Gap: 12px
Avatar: 32px circle, primary color background
Dividers: 1px solid #E2E8F0 (between items)
```

---

## Responsive Behavior

### Desktop (Current Implementation)
- Full 12-column grid
- All cards visible
- 24px spacing throughout
- Max width 1400px

### Tablet (Future Enhancement)
- Possible 2-column layout or adjusted column spans
- Maintain spacing proportions
- Stack chart and activity if needed

### Mobile (Future Enhancement)
- Single column layout
- Full width cards
- Reduced padding (12-16px)
- Smaller fonts (12px base or less)

---

## CSS Classes & Utilities Used

### Tailwind Classes
- `flex`, `items-center`, `justify-between` — Flexbox utilities
- `gap-3`, `gap-4`, `gap-6` — Spacing
- `rounded-lg`, `rounded-xl`, `rounded-2xl` — Border radius
- `text-sm`, `text-md`, `text-2xl`, `text-3xl` — Typography
- `font-medium`, `font-semibold`, `font-bold` — Font weights
- `shadow-sm` — Shadows
- `bg-white`, `text-foreground` — Colors (Tailwind + CSS vars)
- `border`, `border-b` — Borders
- `last:border-0` — Conditional styling

### CSS Variables (Custom)
- `--dashboard-page-bg: #F7F9FC`
- `--dashboard-section-bg: #FFFFFF`
- `--dashboard-text-primary: #0F172A`
- `--dashboard-text-secondary: #64748B`
- `--dashboard-primary: #2563EB`
- (... 10+ more)

### Inline Styles (for Grid)
- `gridTemplateColumns: 'repeat(12, 1fr)'`
- `gap: '24px'`
- `display: 'grid'`
- `background: '#F7F9FC'`
- `maxWidth: '1400px'`

---

## Implementation Notes

### Design Token Centralization
All design values imported from `src/theme/dashboardTheme.ts`:
- Colors: `DashboardColors`
- Spacing: `DashboardSpacing`
- Radius: `DashboardRadius`
- Shadows: `DashboardShadows`
- Typography: `DashboardTypography`
- Layout: `DashboardLayout`

### Component Styling Approach
1. **Theme Constants**: Import colors/spacing from `dashboardTheme.ts`
2. **Inline Styles**: Grid, gaps, backgrounds at container level
3. **Tailwind Classes**: Flexbox, typography, spacing utilities
4. **CSS Variables**: Page-level theme in `App.css`

### Browser Compatibility
- CSS Grid: All modern browsers (IE 11+ with fallbacks)
- CSS Gradients: All modern browsers
- CSS Custom Properties: All modern browsers (IE no support)

### Performance Considerations
- SVG chart instead of heavy chart library (fast rendering)
- No animations in base implementation (can be added)
- Minimal DOM depth (grid + card components)
- CSS Grid native support (hardware accelerated)

---

## Quick Reference Table

| Property | Value | Usage |
|----------|-------|-------|
| **Colors** | See Color Palette section | All UI elements |
| **Typography** | 12px-32px, Inter family | Text content |
| **Spacing** | 4px-32px (grid) | Margins, padding, gaps |
| **Border Radius** | 8px-20px | Cards, buttons, inputs |
| **Shadows** | 3 levels (sm-lg) | Depth, elevation |
| **Grid** | 12-column, 24px gap | Layout system |
| **Max Width** | 1400px | Container limit |
| **Page Padding** | 24px | All sides |

---

## File References

- Design Constants: `src/theme/dashboardTheme.ts`
- Dashboard Section: `src/sections/DashboardSection.tsx`
- Wallet Card: `src/ui/dashboard/WalletBalanceCard.tsx`
- Stats Grid: `src/ui/dashboard/SmallCardsGrid.tsx`
- Campaigns: `src/ui/dashboard/UpcomingCampaigns.tsx`
- Activity: `src/ui/dashboard/RecentActivity.tsx`
- Chart: `src/ui/dashboard/LineChart.tsx`
- Global Styles: `src/App.css`
