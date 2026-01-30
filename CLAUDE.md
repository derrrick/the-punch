# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Punch is a curated directory of independent type foundries built with Next.js 14 (App Router). The site showcases typography organized by the foundries that created them, with filtering by style and location.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Run linter
npm run lint
```

## Tech Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS with custom typography extensions
- **Animations**: Framer Motion for page transitions and UI interactions, GSAP for scroll animations
- **Data**: Static JSON database (`src/data/foundries.json`) with TypeScript interfaces
- **Fonts**: Geist Sans and Geist Mono (local fonts via `next/font`)

## Architecture

### Data Layer (`src/lib/foundries.ts`)

All foundry data is stored in a single JSON file (`src/data/foundries.json`) containing:
- Metadata (version, last updated, total count)
- Array of foundry objects with comprehensive details (name, location, typefaces, style tags, images, etc.)
- Pre-computed aggregations (all styles, country counts)

The `foundries.ts` library provides typed functions to access this data:
- `getAllFoundries()` - Returns all foundries
- `getFoundryBySlug(slug)` - Get single foundry for detail pages
- `getFoundriesByCountry(code)` - Filter by country code
- `getFoundriesByStyle(style)` - Filter by style tag
- `searchFoundries(query)` - Search across multiple fields

### Routing Structure

- `/` - Home page with hero and filterable foundry grid
- `/foundry/[slug]` - Dynamic foundry detail pages (statically generated)
- `/about` - About page
- `/submit` - Foundry submission page

All foundry detail pages are statically generated at build time using `generateStaticParams()`.

### Layout & Components

**Layout** (`src/app/layout.tsx`):
- Fixed header with scroll-based backdrop blur
- Scroll progress indicator
- Footer (always at bottom)
- Main content area with top padding to account for fixed header

**Header** (`src/components/Header.tsx`):
- Fixed position with glassmorphic blur on scroll
- Animated dropdown filters for Style and Location
- Client-side routing with URL query parameters (`?style=swiss`, `?location=US`)
- Dropdowns close on click-outside using refs

**Foundry Grid** (`src/components/FoundryGrid.tsx`):
- Responsive grid (1-4 columns based on breakpoint)
- Client-side filtering based on URL search params
- Auto-scrolls to filter status when filter is applied
- Shows count and active filter name

**Foundry Card** (`src/components/FoundryCard.tsx`):
- Links to individual foundry pages
- Displays foundry name, location, and style tags

### Filtering System

Filters work via URL query parameters:
- Style filter: `/?style=swiss` (exact match, case-insensitive)
- Location filter: `/?location=US` (matches country code)
- Mutually exclusive - applying one clears the other
- Implemented client-side in `FoundryGrid` using `useSearchParams` and `useMemo`

### Styling Approach

Tailwind is configured with custom extensions in `tailwind.config.ts`:
- Custom font sizes (`2xs`)
- Custom letter-spacing (`tighter`, `tight`)
- Custom line-height (`tighter`)
- CSS variables for `background` and `foreground` colors
- Geist Sans and Mono font families via CSS variables

Global styles in `src/app/globals.css` define:
- Light mode: white background (#FFFFFF), dark text (#171717)
- Dark mode: dark background (#171717), light text (#EDEDED)

### Animation Patterns

**Framer Motion** is used for:
- Header dropdown enter/exit animations
- Staggered list item animations (see Header dropdowns with index-based delays)

**GSAP** is used for:
- Scroll-based progress indicator (`ScrollProgress.tsx`)

### Scripts

- `scripts/generate-favicon.js` - Generates favicon.ico programmatically (simple "P" icon on dark background)

## Admin Panel

Access the admin panel at `/admin` to review foundry submissions.

**Login credentials:**
- Password: Set via `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable (default: `thepunch2026`)

**Features:**
- View all submissions with status filter (all/pending/approved/rejected)
- Approve submissions with one click
- Reject submissions with required reason
- View submission details (URL, location, submitter email, notes)
- Simple password authentication (upgrade to Supabase Auth later)

**Database Tables:**
- `foundry_submissions` - Stores all form submissions with status tracking
- `foundries` - Will store approved foundries (currently using JSON)

## Key Patterns

1. **Client Components**: Components using hooks (`useState`, `useSearchParams`, etc.) are marked with `"use client"`

2. **Type Safety**: All foundry data uses the `Foundry` and `FoundriesData` interfaces from `src/lib/foundries.ts`

3. **Static Generation**: Foundry detail pages are pre-rendered at build time for optimal performance

4. **URL State Management**: Filters are managed via URL params for shareability and browser history

5. **Responsive Design**: Mobile-first approach with breakpoint-specific layouts using Tailwind

## Adding/Modifying Foundries

To add or modify foundry data, edit `src/data/foundries.json`. The schema includes:
- `id`, `name`, `slug` (for URL)
- `location` (city, country, countryCode)
- `url`, `founder`, `founded`
- `notableTypefaces` (array)
- `style` (array of tags matching the global `styles` array)
- `tier` (1-4, determines prominence)
- `images` (screenshot, logo, specimens)
- `socialMedia`, `contentFeed`, `notes`

After modifying the JSON, ensure the `meta` section and `countries` array are updated accordingly.
