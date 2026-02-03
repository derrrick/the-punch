# New Foundries Migration Summary

## Migration Completed: January 30, 2026

### Overview
Successfully migrated **47 new foundries** from `new-foundries-to-add.json` to Supabase database.

### Statistics
- ✅ **Inserted**: 47 foundries
- ⏭️ **Skipped**: 0 (no duplicates found)
- 📝 **Total**: 47 foundries processed

### New Countries Added
The following countries were added to the directory:
- 🇦🇺 Australia (1 foundry: Family Type)
- 🇳🇴 Norway (1 foundry: Monokrom)
- 🇩🇰 Denmark (3 foundries: Signal Foundry, The Ivy Foundry, Acute Studio)
- 🇨🇱 Chile (3 foundries: TipoType, Latinotype, Quintana-Font)
- 🇬🇷 Greece (1 foundry: Atypical)
- 🇫🇮 Finland (1 foundry: Teo Tuominen)
- 🇲🇽 Mexico (1 foundry: Blackletra)
- 🇱🇺 Luxembourg (1 foundry: LuxTypo)
- 🇷🇺 Russia (1 foundry: TypeType)

### New Style Tags
New style tags introduced:
- `co-op`, `curated`, `premium` (Village)
- `news`, `americana` (Font Bureau)
- `tech`, `corporate` (Dalton Maag, TypeType)
- `portuguese`, `belgian`, `norwegian`, `danish`, `chilean`, `argentine`, `australian`, `greek`, `mexican`, `luxembourgish`, `finnish`, `russian` (various)
- `blackletter` (Inga Plönnigs)
- `arts-crafts`, `revival` (P22)
- `space-themed` (Constellation)
- `musical` (JazzMaType)
- `retro`, `lettering` (Erik Marinovich, Jake Fleming)

### Tier Distribution
- **Tier 2**: 3 foundries (TypeTogether, Village, Font Bureau, Dalton Maag, Fontsmith, TypeType)
- **Tier 3**: 44 foundries

### Notable Additions
- **HvD Fonts** - Brandon Grotesque (everywhere)
- **TypeTogether** - Adelle, Bree (editorial powerhouse)
- **Village** - Type co-op (Klim, MCKL, Sharp Type, Incubator)
- **Font Bureau** - Legendary news typography (Miller, Interstate)
- **Dalton Maag** - Corporate tech fonts (Ubuntu, Amazon Ember, Airbnb Cereal)
- **Fontsmith** - British institution (BBC, Channel 4)
- **TypeType** - Russian foundry, TT Norms is ubiquitous

### Scripts Created

#### 1. `scripts/migrate-new-foundries.mjs`
Migrates foundries from JSON to Supabase:
- Checks for duplicates by slug
- Transforms JSON structure to database schema
- Saves list of newly inserted foundries
- **Usage**: `node scripts/migrate-new-foundries.mjs`

#### 2. `scripts/screenshot-new-foundries.mjs`
Captures screenshots for newly inserted foundries:
- Reads from `newly-inserted-foundries.json`
- Uses Puppeteer to capture 1920x1080 screenshots
- Saves base64 JPEG to `screenshot_url` column
- **Usage**: `node scripts/screenshot-new-foundries.mjs`

### Files Generated
- `scripts/newly-inserted-foundries.json` - List of 47 foundries with UUIDs and URLs

### Screenshot Status
🔄 **In Progress** - Screenshot capture running in background
- Check progress: `tail -f screenshot-log.txt`
- Expected duration: ~10-15 minutes for 47 sites

### Database Changes
All foundries inserted into `foundries` table with:
- Auto-generated UUIDs
- Complete metadata (name, founder, founded, notable_typefaces, style, tier, etc.)
- Location data (city, country, country_code)
- Social media links (Instagram, Twitter)
- Content feed information where available
- Screenshot URLs (being populated by background script)

### Next Steps
1. ✅ Migration complete
2. 🔄 Screenshot capture in progress
3. ⏳ Verify screenshots on live site
4. ⏳ Update cache/revalidate if needed

---

## Spotlight Primary Feature: February 2, 2026

### Overview
Added ability to explicitly choose which foundry appears in the #1 featured spot in the Hero spotlight layout.

### Design Limit
The HeroSpotlight design supports **4 foundries optimally**:
- 1 featured foundry (large, left side)
- 3 secondary foundries (numbered 02, 03, 04, right side)

The `max_spotlights` setting allows 1-8, but the hero layout works best with 4.

### Database Changes
**Migration**: `supabase/migrations/20260202000000_add_spotlight_primary.sql`
```sql
-- Add spotlight_is_primary column
ALTER TABLE foundries 
ADD COLUMN IF NOT EXISTS spotlight_is_primary BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_foundries_spotlight_primary 
ON foundries(is_spotlight, spotlight_is_primary) 
WHERE is_spotlight = true;
```

### Code Changes

#### 1. Admin Interface (`src/app/admin/spotlight/page.tsx`)
- Added `spotlight_is_primary: boolean` to `RawFoundry` interface
- Added `togglePrimary()` function to set/unset primary status
- Added "Set as Primary" button for non-primary foundries
- Primary foundry gets orange badge and highlight styling
- First spotlight automatically becomes primary

#### 2. Hero Component (`src/components/HeroSpotlight.tsx`)
- Added `spotlightIsPrimary?: boolean` to `SpotlightFoundry` interface
- Updated logic to find primary foundry by flag instead of array position
- Falls back to first foundry if no primary is set

#### 3. Server Data (`src/lib/spotlight.ts`)
- Added `spotlightIsPrimary?: boolean` to `SpotlightFoundry` interface
- Maps `spotlight_is_primary` from database to component prop

### Admin UI
In the Spotlight Manager (Foundries tab):
- Primary foundry shows orange "Primary" badge
- Primary foundry has orange ring highlight
- Other foundries show "Set as Primary" button
- Clicking the button moves that foundry to the #1 spot

### Next Steps
1. ⏳ Run migration on production database
2. ⏳ Test primary toggle in admin
3. ⏳ Verify HeroSpotlight displays primary foundry correctly
