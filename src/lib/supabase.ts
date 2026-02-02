import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface FoundrySubmission {
  id: string;
  created_at: string;
  foundry_name: string;
  website_url: string;
  location?: string;
  submitter_email: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  scraped_metadata?: {
    title?: string;
    description?: string;
    screenshot?: string;
    socialMedia?: {
      instagram?: string;
      twitter?: string;
      facebook?: string;
    };
    favicon?: string;
    ogImage?: string;
    homepageContent?: string;
    aboutContent?: string;
    typefaceListings?: string[];
  };
  scraped_at?: string;
  ai_analysis?: {
    founderName?: string;
    foundedYear?: number;
    location?: {
      city?: string;
      country?: string;
      countryCode?: string;
    };
    notableTypefaces?: string[];
    styleTags?: string[];
    positioningNote?: string;
    notes?: string;
    tier?: 1 | 2 | 3 | 4;
    confidence?: 'high' | 'medium' | 'low';
    reasoning?: string;
  };
  analyzed_at?: string;
}

export interface Foundry {
  id: string;
  name: string;
  slug: string;
  location_city: string;
  location_country: string;
  location_country_code: string;
  url: string;
  founder: string;
  founded: number;
  notable_typefaces: string[];
  style: string[];
  tier: number;
  social_instagram?: string;
  social_twitter?: string;
  notes?: string;
  screenshot_url?: string;
  logo_url?: string;
  content_feed_type?: string;
  content_feed_url?: string;
  content_feed_rss?: string;
  content_feed_frequency?: string;
  created_at: string;
  updated_at: string;
}
