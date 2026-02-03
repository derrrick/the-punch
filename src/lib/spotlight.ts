import { createClient } from "@supabase/supabase-js";
import type { Foundry } from "./foundries-db";

// For server-side rendering, we need to use the service role key to bypass RLS
// For client-side, we use the anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables for spotlight");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface SpotlightSettings {
  is_enabled: boolean;
  title: string;
  subtitle: string;
  variant: "hero" | "grid" | "carousel";
  max_spotlights: number;
}

export interface SpotlightFoundry extends Foundry {
  spotlight_description?: string;
  spotlight_quote?: string;
}

export async function getSpotlightSettings(): Promise<SpotlightSettings | null> {
  try {
    const { data, error } = await supabase
      .from("spotlight_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching spotlight settings:", error.message);
      return null;
    }

    if (!data) {
      console.log("No spotlight settings found in database");
      return null;
    }

    return {
      is_enabled: data.is_enabled,
      title: data.title,
      subtitle: data.subtitle,
      variant: data.variant,
      max_spotlights: data.max_spotlights,
    };
  } catch (err) {
    console.error("Exception fetching spotlight settings:", err);
    return null;
  }
}

export async function getSpotlightFoundries(): Promise<SpotlightFoundry[]> {
  try {
    const { data, error } = await supabase
      .from("foundries")
      .select("*")
      .eq("is_spotlight", true)
      .order("spotlight_order", { ascending: true })
      .order("tier", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching spotlight foundries:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      location: {
        city: f.location_city,
        country: f.location_country,
        countryCode: f.location_country_code,
      },
      url: f.url,
      contentFeed: {
        type: f.content_feed_type,
        url: f.content_feed_url,
        rss: f.content_feed_rss,
        frequency: f.content_feed_frequency,
      },
      founder: f.founder,
      founded: f.founded,
      notableTypefaces: f.notable_typefaces,
      style: f.style,
      tier: f.tier,
      socialMedia: {
        instagram: f.social_instagram,
        twitter: f.social_twitter,
      },
      notes: f.notes || "",
      images: {
        screenshot: f.screenshot_url,
        logo: f.logo_url,
        specimens: [],
      },
      created_at: f.created_at,
      updated_at: f.updated_at,
      spotlight_description: f.spotlight_description,
      spotlight_quote: f.spotlight_quote,
    }));
  } catch (err) {
    console.error("Exception fetching spotlight foundries:", err);
    return [];
  }
}
