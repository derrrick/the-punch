# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Punch is a curated directory of independent type foundries built with Next.js 14 (App Router) and backed by Supabase PostgreSQL. The site showcases typography organized by the foundries that created them, with filtering by style and location. It includes an admin panel for reviewing submissions, managing a homepage spotlight feature, and sending newsletters.

**Live URL:** https://thepunch.studio

## Development Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build (includes TypeScript type checking)
npm start                # Run production build locally
npm run lint             # ESLint
npm run migrate:foundries  # Migrate foundries from JSON to Supabase
npm run validate:foundries # Validate foundry data integrity
```

There is no automated test suite. Verification is done via `npm run build` (catches type errors) and `npm run lint`.

## Tech Stack

- **Framework**: Next.js 14.2.35 with App Router, TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.4 with custom extensions (see `tailwind.config.ts`)
- **Animations**: Framer Motion (UI transitions), GSAP (scroll-based animations)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`) for foundry website analysis
- **Scraping**: Puppeteer for website screenshots and metadata extraction
- **Email**: Resend + React Email for newsletters
- **Fonts**: Geist Sans and Geist Mono (local via `next/font`)
- **Deployment**: Vercel with Vercel Analytics

## Architecture

### Data Layer

All foundry data lives in Supabase PostgreSQL (migrated from legacy `src/data/foundries.json`).

**`src/lib/foundries-db.ts`** — Primary data access layer. Creates its own Supabase client with `revalidate: 60` (ISR) baked into the fetch options. Transforms flat database records (`DbFoundry` with `location_city`, `location_country_code`, etc.) into nested `Foundry` interface objects (with `location.city`, `location.countryCode`, etc.). Key functions: `getAllFoundries()`, `getFoundryBySlug()`, `getFoundriesByCountry()`, `getFoundriesByStyle()`, `searchFoundries()` (client-side filter over all results — no DB full-text search yet).

**`src/lib/supabase.ts`** — Shared Supabase client (no ISR fetch config). Used by client components and API routes. Exports `FoundrySubmission` and `Foundry` (flat DB schema) interfaces.

**`src/lib/foundries.ts`** — Re-exports types and functions from `foundries-db.ts`.

Note: There are two `Foundry` interfaces — the nested one in `foundries-db.ts` (used by components) and the flat DB one in `supabase.ts` (used by admin/API code). Watch for which one you're working with.

### Database Schema

Two main tables:

- **`foundries`** — The directory. Key columns: `slug` (unique), `style` (text[]), `tier` (1-4, determines sort prominence), `notable_typefaces` (text[]), `screenshot_url` (base64 data URL), spotlight columns (`is_spotlight`, `spotlight_order`, `spotlight_is_primary`, `spotlight_description`, `spotlight_quote`, `spotlight_image_*`, `spotlight_theme`).
- **`foundry_submissions`** — User submissions. Status: `pending` | `approved` | `rejected`. Has `scraped_metadata` (JSONB) and `ai_analysis` (JSONB) fields populated by the review pipeline.

Migrations live in `supabase/migrations/`.

### Routing

**Pages:**
- `/` — Home page with hero spotlight and filterable foundry grid (server component)
- `/foundry/[slug]` — Foundry detail pages (statically generated via `generateStaticParams()`)
- `/about`, `/submit`, `/privacy`, `/sponsorship` — Static/form pages
- `/admin` — Submission review dashboard (password protected)
- `/admin/spotlight` — Spotlight feature management
- `/admin/newsletter` — Newsletter composition and sending

**API Routes** (`src/app/api/`):
- `scrape-foundry/` — Puppeteer website scraping (screenshots, metadata)
- `analyze-foundry/` — Claude AI analysis (extracts founder, location, typefaces, style tags, tier)
- `add-to-directory/` — Adds approved submission to foundries table
- `update-submission/` — Updates submission status
- `newsletter/subscribe/`, `newsletter/send/`, `newsletter/stats/` — Newsletter endpoints
- `spotlight/*` — Spotlight management endpoints
- `admin/foundries/` — Admin foundry CRUD

### Filtering System

Client-side filtering via URL query parameters in `FoundryGrid.tsx`:
- `?style=swiss` — Style filter (case-insensitive, array containment)
- `?location=US` — Country code filter
- `?search=query` — Text search across name, founder, location, typefaces, style
- `?sort=popular` — Sort by tier
- `?filter=recent|classic|established` — Filter by founding year

Filters are mutually exclusive for style/location. Implemented with `useSearchParams` and `useMemo`.

### Submission Review Pipeline

1. User submits foundry via `/submit` form → stored in `foundry_submissions` as `pending`
2. Admin scrapes website via `/api/scrape-foundry` (Puppeteer: screenshots, social links, descriptions)
3. Admin runs AI analysis via `/api/analyze-foundry` (Claude extracts metadata)
4. Admin reviews/edits extracted data, approves or rejects
5. Approval calls `/api/add-to-directory` → inserts into `foundries` table

### Spotlight Feature

The homepage hero (`HeroSpotlight.tsx` / `HeroSpotlightLight.tsx`) features up to 4 foundries. Managed via `/admin/spotlight`. One foundry is marked `spotlight_is_primary` (displayed large). Supports dark/light theme variants and custom spotlight images. Data fetched via `src/lib/spotlight.ts`.

### Key Patterns

- **Server components by default**, `"use client"` only for interactivity (hooks, browser APIs)
- **ISR with 60s revalidation** on foundry data fetches (configured in `foundries-db.ts` Supabase client)
- **Two Supabase clients**: one in `foundries-db.ts` (with ISR fetch), one in `supabase.ts` (standard)
- **Path alias**: `@/*` maps to `./src/*`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only, never expose to client
ANTHROPIC_API_KEY=                  # Server-side only
RESEND_API_KEY=                     # Server-side only
NEXT_PUBLIC_ADMIN_PASSWORD=         # Admin panel password
NEXT_PUBLIC_SITE_URL=               # For metadata/OG images
```

## Styling

Tailwind custom extensions in `tailwind.config.ts`:
- Font size: `2xs` (0.625rem)
- Letter spacing: `tighter` (-0.04em), `tight` (-0.02em)
- Line height: `tighter` (1.1)
- Theme colors via CSS variables: `--background`, `--foreground`

Light mode: #fafafa bg, #171717 text. Dark mode: #171717 bg, #EDEDED text.
