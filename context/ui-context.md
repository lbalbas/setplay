# UI Context

## Theme

Dark-mode only. No light mode. The visual language is a stark, premium technical dashboard for the Fighting Game Community (FGC). It relies on near-black obsidian backgrounds, layered warm slate-gray card surfaces, white headings, and a vivid, warm pastel yellow accent color used sparingly to direct attention.

All colors are mapped to CSS custom variables in `src/styles.css` and applied via Tailwind utility names.

### Color Palette

| Role | CSS Variable | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Page Background** | `--bg-base` | `#0A0A08` | Deep obsidian base. Accents content images and thumbnails. |
| **Surface (Cards)** | `--bg-surface` | `#141411` | Warm slate charcoal. Used for stream cards and sidebar containers. |
| **Hover / Active Surface** | `--bg-elevated` | `#1F1F1A` | Selected buttons, dropdown items, active states. |
| **Subtle Border** | `--border-default` | `#292923` | Clean grid-lines, card outlines, header dividing line. |
| **Primary Text** | `--text-primary` | `#FFFFFF` | Clear white for titles, values, and emphasis. |
| **Secondary Text** | `--text-secondary` | `#9E9E93` | Warm champagne-gray for description text and metadata. |
| **Accent Primary** | `--accent-primary` | `#FFF282` | Neon pastel yellow. Main accent for active tags, LIVE dots, and button outlines. |
| **Accent Glow** | `--accent-glow` | `rgba(255, 242, 130, 0.12)` | Subtle glow drop-shadows or translucent overlays. |
| **Success/State** | `--state-success` | `#00F0A0` | Sleek mint green for verified checks and push alert success indicators. |

## Typography

- **UI & Body text**: `Manrope` (loaded via Google Fonts).
- **Titles & Display headings**: `Fraunces` (serif, loaded via Google Fonts). Used for headers and display text to give a premium, editorial editorial feel.

## Border Radius

Borders should be clean and rounded using the following hierarchy:
- **Buttons / Tags**: `rounded-full` (capsule style).
- **Stream Cards / Widgets**: `rounded-xl`.
- **Modals / Drawers**: `rounded-2xl`.

## Layout & Navigation Patterns

1. **Root Navigation Shell**:
   - Sticky top header (`Header.tsx`) containing the brand logotype (featuring the yellow accent dot), a search bar, active game shortcuts, and an Admin portal link.
   - Global footer (`Footer.tsx`) containing social links and platform info.
2. **Dashboard Feed (`/`)**:
   - Floating layout: Headline featured stream hero widget at the top, a grid of live streams below, and a collapsible sidebar panel containing the tournament calendar.
3. **Watch View (`/watch/$streamName`)**:
   - Split-screen layout. Left side: responsive iframe video container (collapsible to theater view). Right side: collapsible Twitch/YouTube chat panel.
   - Under-player: event metadata, bracket redirects, and Web Push notifications action card.
4. **Events Calendar Page (`/events`)**:
   - Clean calendar/timeline layout mapping out past, ongoing, and upcoming brackets.
5. **Admin Portal (`/admin`)**:
   - Structured tabular layout for managing manual event overrides, seeding brackets, and cron worker logs.

## Icons

- Lucide React (thin, stroke-based icons).
- Sizing conventions: `w-4 h-4` for tags and metadata icons, `w-5 h-5` for standard button icons.
