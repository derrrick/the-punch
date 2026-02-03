"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FoundrySpotlight } from "@/components/FoundrySpotlight";

interface RawFoundry {
  id: string;
  name: string;
  slug: string;
  location_city: string;
  location_country: string;
  location_country_code: string;
  notable_typefaces: string[];
  style: string[];
  tier: number;
  notes: string | null;
  screenshot_url: string | null;
  is_spotlight: boolean;
  spotlight_description: string | null;
  spotlight_quote: string | null;
  spotlight_order: number;
}

interface SpotlightSettings {
  id: string;
  is_enabled: boolean;
  title: string;
  subtitle: string;
  variant: "hero" | "grid" | "carousel";
  max_spotlights: number;
}

interface SpotlightTheme {
  name: string;
  title: string;
  subtitle: string;
  variant: "hero" | "grid";
}

const SPOTLIGHT_THEMES: SpotlightTheme[] = [
  {
    name: "Weekly Spotlight",
    title: "This Week's Spotlight",
    subtitle: "Exceptional foundries worth your attention",
    variant: "hero",
  },
  {
    name: "Editor's Picks",
    title: "Editor's Picks",
    subtitle: "Hand-selected foundries we love right now",
    variant: "hero",
  },
  {
    name: "New Discoveries",
    title: "New Discoveries",
    subtitle: "Fresh finds from the world of independent type",
    variant: "grid",
  },
  {
    name: "Featured Foundries",
    title: "Featured Foundries",
    subtitle: "Standout studios crafting exceptional letterforms",
    variant: "grid",
  },
  {
    name: "Type Spotlight",
    title: "In the Spotlight",
    subtitle: "Foundries making waves in the type community",
    variant: "hero",
  },
  {
    name: "Curator's Choice",
    title: "Curator's Choice",
    subtitle: "Our favorite foundries this month",
    variant: "grid",
  },
];

export default function SpotlightAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [foundries, setFoundries] = useState<RawFoundry[]>([]);
  const [settings, setSettings] = useState<SpotlightSettings | null>(null);
  const [formState, setFormState] = useState<SpotlightSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSql, setSetupSql] = useState("");
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [aiContent, setAIContent] = useState<Record<string, { description: string; quote: string; altDescription: string }>>({});
  const [generatingSectionAI, setGeneratingSectionAI] = useState(false);
  const [sectionAIContent, setSectionAIContent] = useState<{ titles: string[]; subtitles: string[] } | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }

    // Load draft from localStorage
    const savedDraft = localStorage.getItem("spotlight_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.formState) {
          setFormState(draft.formState);
          setHasDraft(true);
        }
      } catch {
        // Invalid draft, ignore
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD.trim()) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      loadData();
    } else {
      setMessage({ type: "error", text: "Invalid password" });
    }
  };

  const loadData = async () => {
    setLoading(true);
    setNeedsSetup(false);
    try {
      // Load foundries with spotlight data
      const { data: foundriesData, error: foundriesError } = await supabase
        .from("foundries")
        .select("*")
        .order("name", { ascending: true });

      if (foundriesError) throw foundriesError;
      setFoundries(foundriesData || []);

      // Load spotlight settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("spotlight_settings")
        .select("*")
        .limit(1)
        .single();

      if (settingsError) {
        // Check if table doesn't exist (42P01 = undefined_table)
        if (settingsError.code === "42P01" || settingsError.message?.includes("spotlight_settings")) {
          setNeedsSetup(true);
          setSetupSql(`-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new):

-- Create spotlight_settings table
CREATE TABLE IF NOT EXISTS spotlight_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT false,
  title TEXT DEFAULT 'This Week''s Spotlight',
  subtitle TEXT DEFAULT 'Exceptional foundries worth your attention',
  variant TEXT DEFAULT 'hero' CHECK (variant IN ('hero', 'grid', 'carousel')),
  max_spotlights INTEGER DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- Add columns to foundries table
ALTER TABLE foundries 
ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spotlight_description TEXT,
ADD COLUMN IF NOT EXISTS spotlight_quote TEXT,
ADD COLUMN IF NOT EXISTS spotlight_order INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE spotlight_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read spotlight settings" ON spotlight_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all spotlight settings" ON spotlight_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO spotlight_settings (id, is_enabled)
SELECT gen_random_uuid(), false
WHERE NOT EXISTS (SELECT 1 FROM spotlight_settings LIMIT 1);`);
          setLoading(false);
          return;
        }
        if (settingsError.code !== "PGRST116") {
          throw settingsError;
        }
      }

      if (settingsData) {
        setSettings(settingsData);
        setFormState(settingsData);
      } else {
        // Create default settings
        const defaultSettings = {
          is_enabled: false,
          title: "This Week's Spotlight",
          subtitle: "Exceptional foundries worth your attention",
          variant: "hero" as const,
          max_spotlights: 4,
        };
        const { data: newSettings, error: createError } = await supabase
          .from("spotlight_settings")
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
        setFormState(newSettings);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SpotlightSettings>) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("spotlight_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;

      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      setFormState(newSettings);
      // Clear draft on successful save
      localStorage.removeItem("spotlight_draft");
      setHasDraft(false);
      setMessage({ type: "success", text: "Settings saved successfully! Changes will appear on the homepage." });
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSpotlight = async (foundry: RawFoundry, isSpotlight: boolean) => {
    try {
      const { error } = await supabase
        .from("foundries")
        .update({
          is_spotlight: isSpotlight,
          spotlight_description: foundry.spotlight_description,
          spotlight_quote: foundry.spotlight_quote,
          spotlight_order: isSpotlight ? getNextSpotlightOrder() : 0,
        })
        .eq("id", foundry.id);

      if (error) throw error;

      setFoundries(foundries.map(f => 
        f.id === foundry.id 
          ? { ...f, is_spotlight: isSpotlight }
          : f
      ));

      setMessage({ type: "success", text: isSpotlight ? "Added to spotlight" : "Removed from spotlight" });
    } catch (err) {
      console.error("Error updating spotlight:", err);
      setMessage({ type: "error", text: "Failed to update" });
    }
  };

  const updateSpotlightData = async (foundryId: string, data: Partial<RawFoundry>) => {
    try {
      const { error } = await supabase
        .from("foundries")
        .update(data)
        .eq("id", foundryId);

      if (error) throw error;

      setFoundries(foundries.map(f => 
        f.id === foundryId ? { ...f, ...data } : f
      ));
    } catch (err) {
      console.error("Error updating spotlight data:", err);
      setMessage({ type: "error", text: "Failed to update" });
    }
  };

  const getNextSpotlightOrder = () => {
    const spotlightFoundries = foundries.filter(f => f.is_spotlight);
    return spotlightFoundries.length + 1;
  };

  const generateAIContent = async (foundryId: string) => {
    setGeneratingAI(foundryId);
    try {
      const response = await fetch("/api/spotlight/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foundryId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAIContent(prev => ({
        ...prev,
        [foundryId]: data.content,
      }));
      setMessage({ type: "success", text: "Content generated! Select an option below." });
    } catch (err) {
      console.error("AI generation error:", err);
      setMessage({ type: "error", text: "Failed to generate content" });
    } finally {
      setGeneratingAI(null);
    }
  };

  const applyAIContent = (foundryId: string, field: "spotlight_description" | "spotlight_quote", value: string) => {
    updateSpotlightData(foundryId, { [field]: value });
  };

  const saveDraft = () => {
    const draft = {
      formState,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("spotlight_draft", JSON.stringify(draft));
    setHasDraft(true);
    setMessage({ type: "success", text: "Draft saved" });
  };

  const clearDraft = () => {
    localStorage.removeItem("spotlight_draft");
    setHasDraft(false);
    if (settings) {
      setFormState(settings);
    }
    setMessage({ type: "success", text: "Draft cleared" });
  };

  const applyTheme = (theme: SpotlightTheme) => {
    setFormState(prev => prev ? {
      ...prev,
      title: theme.title,
      subtitle: theme.subtitle,
      variant: theme.variant,
    } : null);
  };

  const generateSectionAI = async () => {
    const spotlightFoundriesList = foundries.filter(f => f.is_spotlight);
    if (spotlightFoundriesList.length === 0) {
      setMessage({ type: "error", text: "Add foundries to spotlight first" });
      return;
    }

    setGeneratingSectionAI(true);
    try {
      const foundryNames = spotlightFoundriesList.map(f => f.name).join(", ");
      const styles = [...new Set(spotlightFoundriesList.flatMap(f => f.style))].slice(0, 5).join(", ");

      const response = await fetch("/api/spotlight/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foundryNames, styles }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSectionAIContent(data.content);
      setMessage({ type: "success", text: "Section content generated!" });
    } catch (err) {
      console.error("Section AI error:", err);
      setMessage({ type: "error", text: "Failed to generate section content" });
    } finally {
      setGeneratingSectionAI(false);
    }
  };

  const spotlightFoundries = foundries
    .filter(f => f.is_spotlight)
    .sort((a, b) => a.spotlight_order - b.spotlight_order);

  const getPreviewFoundries = () => {
    return spotlightFoundries.slice(0, formState?.max_spotlights || 4).map(f => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      location: {
        city: f.location_city,
        country: f.location_country,
        countryCode: f.location_country_code,
      },
      url: '',
      contentFeed: { type: null, url: null, rss: null, frequency: null },
      founder: '',
      founded: 0,
      notableTypefaces: f.notable_typefaces,
      style: f.style,
      tier: f.tier,
      socialMedia: { instagram: null, twitter: null },
      notes: f.notes || '',
      images: {
        screenshot: f.screenshot_url,
        logo: null,
        specimens: [],
      },
      created_at: '',
      updated_at: '',
      spotlight_description: f.spotlight_description || undefined,
      spotlight_quote: f.spotlight_quote || undefined,
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="max-w-md w-full px-6">
          <h1 className="text-3xl font-medium tracking-tight text-neutral-900 mb-8 text-center">
            Spotlight Admin
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm text-neutral-600 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-neutral-200 focus:border-neutral-400 rounded-none px-4 py-3 text-neutral-900 focus:outline-none transition-colors"
                placeholder="Enter admin password"
              />
            </div>
            {message && (
              <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {message.text}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-neutral-900 text-white py-3 px-6 text-sm uppercase tracking-[0.1em] hover:bg-neutral-800 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900">
              Spotlight Manager
            </h1>
            <p className="text-neutral-500 mt-1">
              Feature exceptional foundries on the homepage
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              ← Back to Admin
            </a>
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_auth");
                setIsAuthenticated(false);
              }}
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : needsSetup ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <h2 className="text-xl font-medium text-amber-900">Database Setup Required</h2>
              </div>
              <p className="text-amber-800 mb-6">
                The spotlight feature requires database tables that haven&apos;t been created yet. 
                Please run the following SQL in your Supabase dashboard:
              </p>
              <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-neutral-300 font-mono whitespace-pre-wrap">
                  {setupSql}
                </pre>
              </div>
              <div className="mt-6 flex gap-4">
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.co', '.dashboard')}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  Open Supabase SQL Editor
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </a>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Quick Themes */}
            <section className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
              <h2 className="text-lg font-medium mb-4 text-orange-900">Quick Themes</h2>
              <p className="text-sm text-orange-700 mb-4">Apply a pre-built theme to quickly set up your spotlight section</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPOTLIGHT_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => applyTheme(theme)}
                    className="p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 transition-colors text-left"
                  >
                    <p className="font-medium text-sm text-neutral-900">{theme.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">{theme.variant} layout</p>
                  </button>
                ))}
              </div>
            </section>

            {/* AI Section Generator */}
            <section className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                  <path d="M12 3v18" />
                  <rect width="16" height="12" x="4" y="6" rx="2" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                </svg>
                <h2 className="text-lg font-medium text-purple-900">AI Section Generator</h2>
              </div>
              <p className="text-sm text-purple-700 mb-4">Generate custom titles and subtitles based on your spotlighted foundries</p>

              <button
                onClick={generateSectionAI}
                disabled={generatingSectionAI || foundries.filter(f => f.is_spotlight).length === 0}
                className="w-full py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {generatingSectionAI ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Titles & Subtitles"
                )}
              </button>

              {sectionAIContent && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-2">Title Options (click to apply)</p>
                    <div className="space-y-2">
                      {sectionAIContent.titles.map((title, i) => (
                        <button
                          key={i}
                          onClick={() => setFormState(prev => prev ? { ...prev, title } : null)}
                          className={`w-full text-left px-3 py-2 text-sm rounded border transition-colors ${
                            formState?.title === title
                              ? "bg-purple-100 border-purple-400"
                              : "bg-white border-purple-200 hover:border-purple-300"
                          }`}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-2">Subtitle Options (click to apply)</p>
                    <div className="space-y-2">
                      {sectionAIContent.subtitles.map((subtitle, i) => (
                        <button
                          key={i}
                          onClick={() => setFormState(prev => prev ? { ...prev, subtitle } : null)}
                          className={`w-full text-left px-3 py-2 text-sm rounded border transition-colors ${
                            formState?.subtitle === subtitle
                              ? "bg-purple-100 border-purple-400"
                              : "bg-white border-purple-200 hover:border-purple-300"
                          }`}
                        >
                          {subtitle}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Global Settings */}
            <section className="bg-white rounded-lg p-6 border border-neutral-200">
              <h2 className="text-lg font-medium mb-6">Spotlight Settings</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Enable/Disable */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState?.is_enabled || false}
                      onChange={(e) => setFormState(prev => prev ? { ...prev, is_enabled: e.target.checked } : null)}
                      className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="text-sm font-medium">Enable Spotlight Section</span>
                  </label>
                  <p className="text-xs text-neutral-500 mt-1 ml-8">
                    When enabled, spotlight foundries appear on the homepage
                  </p>
                </div>

                {/* Variant */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Layout Variant
                  </label>
                  <select
                    value={formState?.variant || "hero"}
                    onChange={(e) => setFormState(prev => prev ? { ...prev, variant: e.target.value as SpotlightSettings["variant"] } : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                  >
                    <option value="hero">Hero (1 large + 2-3 small)</option>
                    <option value="grid">Grid (Equal cards)</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={formState?.title || ""}
                    onChange={(e) => setFormState(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={formState?.subtitle || ""}
                    onChange={(e) => setFormState(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                  />
                </div>

                {/* Max Spotlights */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Max Spotlights ({formState?.max_spotlights || 4})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={formState?.max_spotlights || 4}
                    onChange={(e) => setFormState(prev => prev ? { ...prev, max_spotlights: parseInt(e.target.value) } : null)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>1</span>
                    <span>8</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {hasDraft && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Draft saved
                    </span>
                  )}
                  {JSON.stringify(formState) !== JSON.stringify(settings) && (
                    <span className="text-xs text-amber-600">Unsaved changes</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveDraft}
                    className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Save Draft
                  </button>
                  {hasDraft && (
                    <button
                      onClick={clearDraft}
                      className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                      Clear Draft
                    </button>
                  )}
                  <button
                    onClick={() => formState && updateSettings(formState)}
                    disabled={saving || JSON.stringify(formState) === JSON.stringify(settings)}
                    className="px-6 py-2.5 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </section>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">
                Current Spotlights
                <span className="ml-2 text-sm font-normal text-neutral-500">
                  ({spotlightFoundries.length} selected)
                </span>
              </h2>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md text-sm hover:bg-neutral-200 transition-colors"
              >
                {previewMode ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {/* Live Preview */}
            {previewMode && spotlightFoundries.length > 0 && (
              <div className="border-2 border-dashed border-neutral-300 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 text-xs uppercase tracking-wider text-orange-700 font-medium">
                  {JSON.stringify(formState) !== JSON.stringify(settings) 
                    ? "Preview (Unsaved Changes)" 
                    : "Live Preview"}
                </div>
                <FoundrySpotlight
                  foundries={getPreviewFoundries()}
                  title={formState?.title}
                  subtitle={formState?.subtitle}
                  variant={formState?.variant}
                />
              </div>
            )}

            {/* Selected Spotlights */}
            {spotlightFoundries.length > 0 && (
              <section className="bg-white rounded-lg p-6 border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
                  Selected Foundries
                </h3>
                <div className="space-y-4">
                  {spotlightFoundries.map((foundry, index) => (
                    <div key={foundry.id} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <h4 className="font-medium">{foundry.name}</h4>
                        </div>
                        <button
                          onClick={() => toggleSpotlight(foundry, false)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="ml-9 space-y-4">
                        {/* AI Generate Button */}
                        <button
                          onClick={() => generateAIContent(foundry.id)}
                          disabled={generatingAI === foundry.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                        >
                          {generatingAI === foundry.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3v18" />
                                <rect width="16" height="12" x="4" y="6" rx="2" />
                                <path d="M2 12h4" />
                                <path d="M18 12h4" />
                              </svg>
                              Generate with AI
                            </>
                          )}
                        </button>

                        {/* AI Generated Options */}
                        {aiContent[foundry.id] && (
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                            <p className="text-xs font-medium text-purple-700">AI Suggestions (click to apply)</p>

                            <div>
                              <p className="text-xs text-purple-600 mb-1">Description:</p>
                              <button
                                onClick={() => applyAIContent(foundry.id, "spotlight_description", aiContent[foundry.id].description)}
                                className={`w-full text-left p-2 text-sm rounded border transition-colors ${
                                  foundry.spotlight_description === aiContent[foundry.id].description
                                    ? "bg-purple-100 border-purple-400"
                                    : "bg-white border-purple-200 hover:border-purple-300"
                                }`}
                              >
                                {aiContent[foundry.id].description}
                              </button>
                            </div>

                            {aiContent[foundry.id].altDescription && (
                              <div>
                                <p className="text-xs text-purple-600 mb-1">Alternative:</p>
                                <button
                                  onClick={() => applyAIContent(foundry.id, "spotlight_description", aiContent[foundry.id].altDescription)}
                                  className={`w-full text-left p-2 text-sm rounded border transition-colors ${
                                    foundry.spotlight_description === aiContent[foundry.id].altDescription
                                      ? "bg-purple-100 border-purple-400"
                                      : "bg-white border-purple-200 hover:border-purple-300"
                                  }`}
                                >
                                  {aiContent[foundry.id].altDescription}
                                </button>
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-purple-600 mb-1">Quote:</p>
                              <button
                                onClick={() => applyAIContent(foundry.id, "spotlight_quote", aiContent[foundry.id].quote)}
                                className={`w-full text-left p-2 text-sm rounded border transition-colors ${
                                  foundry.spotlight_quote === aiContent[foundry.id].quote
                                    ? "bg-purple-100 border-purple-400"
                                    : "bg-white border-purple-200 hover:border-purple-300"
                                }`}
                              >
                                {aiContent[foundry.id].quote}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-neutral-500 mb-1">
                              Spotlight Description
                            </label>
                            <textarea
                              value={foundry.spotlight_description || ""}
                              onChange={(e) => updateSpotlightData(foundry.id, { spotlight_description: e.target.value })}
                              placeholder="Custom description for spotlight..."
                              rows={2}
                              className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-500 mb-1">
                              Quote (optional)
                            </label>
                            <textarea
                              value={foundry.spotlight_quote || ""}
                              onChange={(e) => updateSpotlightData(foundry.id, { spotlight_quote: e.target.value })}
                              placeholder="A quote from the foundry or about their work..."
                              rows={2}
                              className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Available Foundries */}
            <section className="bg-white rounded-lg p-6 border border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
                Available Foundries
              </h3>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {foundries
                  .filter(f => !f.is_spotlight)
                  .map((foundry) => (
                    <div
                      key={foundry.id}
                      className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg border border-transparent hover:border-neutral-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center text-neutral-400">
                          {foundry.screenshot_url ? (
                            <img 
                              src={foundry.screenshot_url} 
                              alt=""
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-xs">{foundry.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{foundry.name}</p>
                          <p className="text-xs text-neutral-500">
                            {foundry.location_city}, {foundry.location_country}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSpotlight(foundry, true)}
                        disabled={spotlightFoundries.length >= (settings?.max_spotlights || 4)}
                        className="px-3 py-1.5 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
