# AGENTS.md — The Punch

A comprehensive guide for AI coding agents working on The Punch, a curated directory of independent type foundries.

---

## Project Overview

**The Punch** is a Next.js 14 web application that showcases typography organized by the foundries that created them. The site provides a filterable directory of independent type foundries with detailed information about each foundry, their notable typefaces, and style categorization.

**Live URL:** https://thepunch.studio  
**Primary Language:** TypeScript  
**Framework:** Next.js 14 with App Router

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14.2.35 with App Router |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 3.4 |
| **UI Library** | React 18 |
| **Animations** | Framer Motion + GSAP |
| **Database** | Supabase (PostgreSQL) |
| **Fonts** | Geist Sans & Geist Mono (local) |
| **Scraping** | Puppeteer |
| **AI** | Anthropic Claude API |
| **Deployment** | Vercel |

---

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Run ESLint
npm run lint

# Migrate foundries from JSON to Supabase
npm run migrate:foundries
```

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (routes)/           # Page components
│   │   │   ├── page.tsx        # Home page (foundry grid)
│   │   │   ├── about/page.tsx  # About page
│   │   │   ├── submit/page.tsx # Foundry submission page
│   │   │   ├── admin/page.tsx  # Admin panel (password protected)
│   │   │   ├── foundry/[slug]/ # Dynamic foundry detail pages
│   │   │   ├── privacy/page.tsx
│   │   │   └── sponsorship/page.tsx
│   │   ├── api/                # API routes
│   │   │   ├── scrape-foundry/route.ts
│   │   │   ├── analyze-foundry/route.ts
│   │   │   ├── add-to-directory/route.ts
│   │   │   ├── update-submission/route.ts
│   │   │   └── newsletter/subscribe/route.ts
│   │   ├── layout.tsx          # Root layout with fonts, metadata
│   │   ├── globals.css         # Global styles, CSS variables
│   │   ├── sitemap.ts          # Dynamic sitemap generation
│   │   └── opengraph-image.tsx # OG image generation
│   ├── components/             # React components
│   │   ├── Header.tsx          # Sticky header with animated logo
│   │   ├── Footer.tsx          # Site footer
│   │   ├── Hero.tsx            # Home page hero section
│   │   ├── FoundryGrid.tsx     # Main foundry listing grid
│   │   ├── FoundryCard.tsx     # Individual foundry card
│   │   ├── FilterBar.tsx       # Style/country filter bar
│   │   ├── ScrollProgress.tsx  # GSAP scroll progress indicator
│   │   ├── AnimatedLogo.tsx    # SVG logo animation
│   │   ├── PageTransition.tsx  # Framer Motion page transitions
│   │   └── FoundryTransition.tsx # Context for foundry navigation
│   ├── lib/                    # Utility libraries
│   │   ├── foundries-db.ts     # Supabase data access layer
│   │   ├── foundries.ts        # Re-exports from foundries-db
│   │   ├── supabase.ts         # Supabase client + types
│   │   ├── scraper.ts          # Puppeteer web scraping
│   │   └── ai-analyzer.ts      # Claude AI analysis
│   └── data/
│       └── foundries.json      # Legacy static data (migrated to DB)
├── scripts/                    # Utility scripts
│   ├── migrate-foundries-to-db.mjs
│   ├── scrape-foundry.mjs
│   ├── screenshot-new-foundries.mjs
│   └── generate-favicon.js
├── supabase/
│   └── migrations/             # Database migrations
│       ├── 001_initial_schema.sql
│       ├── 002_add_scraped_metadata.sql
│       ├── 003_add_ai_analysis.sql
│       └── 004_newsletter_subscribers.sql
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind configuration
├── next.config.mjs             # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── .env.local                  # Environment variables (not committed)
```

---

## Architecture Details

### Data Layer (`src/lib/foundries-db.ts`)

All foundry data is stored in Supabase PostgreSQL database. The data access layer provides:

- `getAllFoundries()` — Returns all foundries sorted by tier, then name
- `getFoundryBySlug(slug)` — Get single foundry for detail pages
- `getFoundriesByCountry(code)` — Filter by country code
- `getFoundriesByStyle(style)` — Filter by style tag (array containment)
- `searchFoundries(query)` — Client-side search across multiple fields
- `getAllStyles()` — Get unique style tags from all foundries
- `getAllCountries()` — Get countries with foundry counts

**Caching Strategy:** Uses Next.js `revalidate: 60` for ISR (60-second cache). Client-side caching removed due to 2MB Next.js limit (screenshots cause data > 5MB).

### Database Schema

**foundries table:**
- `id`, `name`, `slug` (unique)
- `location_city`, `location_country`, `location_country_code`
- `url`, `founder`, `founded` (year)
- `notable_typefaces` (text array)
- `style` (text array of tags)
- `tier` (1-4, determines prominence)
- `social_instagram`, `social_twitter`
- `screenshot_url`, `logo_url`
- `content_feed_type`, `content_feed_url`, `content_feed_rss`, `content_feed_frequency`
- `notes`

**foundry_submissions table:**
- Stores form submissions with status tracking
- Includes `scraped_metadata` and `ai_analysis` JSON fields
- Status: `pending` | `approved` | `rejected`

### Routing Structure

| Route | Description |
|-------|-------------|
| `/` | Home page with hero and filterable foundry grid |
| `/foundry/[slug]` | Dynamic foundry detail pages (SSG) |
| `/about` | About page |
| `/submit` | Foundry submission form |
| `/admin` | Admin panel for reviewing submissions |

All foundry detail pages use static generation with `generateStaticParams()`.

### Filtering System

Filters work via URL query parameters:
- Style: `/?style=swiss` (case-insensitive exact match)
- Location: `/?location=US` (country code match)
- Mutually exclusive — applying one clears the other
- Implemented client-side using `useSearchParams` and `useMemo`

---

## Code Style Guidelines

### TypeScript Conventions

- **Strict mode enabled** — All code must be type-safe
- Use explicit return types for exported functions
- Prefer `interface` over `type` for object shapes
- Use `const` assertions for literal unions (style tags)

### Component Patterns

- **Server Components by default** — Use `"use client"` only when necessary
- Client components needed for: `useState`, `useEffect`, `useSearchParams`, browser APIs
- Props interfaces named `{ComponentName}Props`
- Use `className` for styling (Tailwind)

### Styling Conventions

- **Mobile-first responsive design**
- Use Tailwind utility classes exclusively (no CSS modules)
- Custom values in `tailwind.config.ts`:
  - Font sizes: `2xs` (0.625rem)
  - Letter spacing: `tighter` (-0.04em), `tight` (-0.02em)
  - Line height: `tighter` (1.1)
- Color scheme via CSS variables: `--background`, `--foreground`

### File Naming

- Components: PascalCase (e.g., `FoundryCard.tsx`)
- Utilities: camelCase (e.g., `foundries-db.ts`)
- API routes: `route.ts` in named directories

---

## Testing Instructions

**Note:** The project does not currently have an automated test suite. Testing is done manually:

1. **Development testing:**
   ```bash
   npm run dev
   # Test at http://localhost:3000
   ```

2. **Production build testing:**
   ```bash
   npm run build
   npm start
   ```

3. **Linting:**
   ```bash
   npm run lint
   ```

4. **Type checking:**
   TypeScript compilation happens during `npm run build`

---

## Security Considerations

### Environment Variables

Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-side only
DATABASE_URL=                   # For migrations

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=     # Plain text password (simple auth)

# AI
ANTHROPIC_API_KEY=              # Claude API for analysis

# Site
NEXT_PUBLIC_SITE_URL=
```

**⚠️ Important:**
- `SUPABASE_SERVICE_ROLE_KEY` — Never expose to client
- `ANTHROPIC_API_KEY` — Server-side only
- Admin password is simple plaintext (upgrade to proper auth recommended)

### Database Security (RLS)

Row Level Security policies:
- Anyone can insert submissions
- Anyone can read approved foundries
- Only authenticated users can modify foundries

### API Security

- API routes validate input with proper error handling
- Service role key only used server-side
- AI analysis endpoint checks for API key configuration

---

## Deployment

### Vercel Deployment

The project is configured for Vercel:

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Build command: `npm run build`
4. Output directory: `.next`

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] `npm run build` succeeds locally
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## Key Patterns and Conventions

### Animation Patterns

**Framer Motion** — Used for:
- Header dropdown enter/exit animations
- Page transitions
- Staggered list animations

**GSAP** — Used for:
- Scroll progress indicator
- Complex scroll-based animations

### Data Fetching

- Server components fetch data directly from Supabase
- Client components use Supabase client from `@/lib/supabase`
- Revalidation: 60 seconds for foundry data

### Form Handling

- Submissions stored in `foundry_submissions` table
- Scraping and AI analysis run asynchronously via API routes
- Admin panel provides approval/rejection workflow

---

## Admin Panel

Access at `/admin`

**Features:**
- Review foundry submissions
- Approve/reject with one click
- View scraped metadata and AI analysis
- Filter by status (all/pending/approved/rejected)

**Authentication:**
- Password: Set via `NEXT_PUBLIC_ADMIN_PASSWORD` (default: `thepunch2026`)
- Simple password check (not cryptographically secure)

---

## Adding/Modifying Foundries

### Current Process (Database)

1. Submit via `/submit` form
2. Review in `/admin` panel
3. Approve to add to `foundries` table

### Legacy Process (JSON)

The original data was stored in `src/data/foundries.json` and migrated to Supabase. The migration script is at `scripts/migrate-foundries-to-db.mjs`.

---

## External Dependencies

### Required Services

1. **Supabase** — Database and authentication
2. **Vercel** — Hosting and deployment
3. **Anthropic** — AI analysis (Claude API)

### Optional

- Puppeteer for web scraping (runs in Node.js environment)

---

## Troubleshooting

### Common Issues

**Build fails with "Cannot find module"**
- Check that all imports use `@/` alias correctly
- Verify `tsconfig.json` paths configuration

**Supabase connection errors**
- Verify environment variables are set
- Check Supabase project status

**AI analysis fails**
- Verify `ANTHROPIC_API_KEY` is set
- Check API key has available credits

**Images not loading**
- Screenshots stored as base64 data URLs in database
- Check that `screenshot_url` field is populated

---

## Migration History

The project has undergone a significant migration from static JSON to Supabase:

1. **v1.0** — Static JSON data (`src/data/foundries.json`)
2. **v2.0** — Migrated to Supabase PostgreSQL
   - Created `foundries` table
   - Created `foundry_submissions` table
   - Added web scraping integration
   - Added AI analysis with Claude

---

## Contributing Guidelines

1. Follow TypeScript strict mode
2. Use Tailwind for styling (no custom CSS)
3. Prefer server components
4. Add proper error handling for all async operations
5. Test admin flows when modifying submission logic
