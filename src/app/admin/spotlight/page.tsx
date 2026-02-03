"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { HeroSpotlight } from "@/components/HeroSpotlight";

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
  spotlight_is_primary: boolean;
}

interface SpotlightSettings {
  id: string;
  is_enabled: boolean;
  variant: "hero" | "grid";
  max_spotlights: number;
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

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
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<SpotlightSettings | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const MAX_SPOTLIGHTS = 4;

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("spotlight_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.formState) {
          setHasDraft(true);
          setPendingDraft(draft.formState);
          setShowDraftBanner(true);
        }
      } catch {
        localStorage.removeItem("spotlight_draft");
      }
    }
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-save draft when form changes
  useEffect(() => {
    if (formState && settings && JSON.stringify(formState) !== JSON.stringify(settings)) {
      const draft = { formState, savedAt: new Date().toISOString() };
      localStorage.setItem("spotlight_draft", JSON.stringify(draft));
      setHasDraft(true);
    }
  }, [formState, settings]);

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
      // Load foundries
      const { data: foundriesData, error: foundriesError } = await supabase
        .from("foundries")
        .select("*")
        .order("name", { ascending: true });

      if (foundriesError) throw foundriesError;
      setFoundries(foundriesData || []);

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("spotlight_settings")
        .select("*")
        .limit(1)
        .single();

      if (settingsError) {
        if (settingsError.code === "42P01") {
          setNeedsSetup(true);
          setSetupSql(`-- Create spotlight_settings table
CREATE TABLE IF NOT EXISTS spotlight_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT false,
  variant TEXT DEFAULT 'hero' CHECK (variant IN ('hero', 'grid')),
  max_spotlights INTEGER DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to foundries table
ALTER TABLE foundries 
ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spotlight_description TEXT,
ADD COLUMN IF NOT EXISTS spotlight_quote TEXT,
ADD COLUMN IF NOT EXISTS spotlight_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spotlight_is_primary BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE spotlight_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read spotlight settings" ON spotlight_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all spotlight settings" ON spotlight_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO spotlight_settings (id, is_enabled)
SELECT gen_random_uuid(), false
WHERE NOT EXISTS (SELECT 1 FROM spotlight_settings LIMIT 1);`);
          setLoading(false);
          return;
        }
        if (settingsError.code !== "PGRST116") throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData);
        // Draft handling is done in the useEffect above via banner
        if (!pendingDraft) {
          setFormState(settingsData);
        }
      } else {
        // Create default settings
        const defaultSettings = {
          is_enabled: false,
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

  const saveSettings = async () => {
    if (!settings || !formState) return;

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: ADMIN_PASSWORD,
          settings: formState,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to save");
      }

      setSettings(formState);
      localStorage.removeItem("spotlight_draft");
      setHasDraft(false);
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSpotlight = async (foundry: RawFoundry, isSpotlight: boolean) => {
    try {
      // If this is the first spotlight, make it primary
      const shouldBePrimary = isSpotlight && spotlightFoundries.length === 0;
      
      const { error } = await supabase
        .from("foundries")
        .update({
          is_spotlight: isSpotlight,
          spotlight_order: isSpotlight ? getNextSpotlightOrder() : 0,
          spotlight_is_primary: shouldBePrimary,
        })
        .eq("id", foundry.id);

      if (error) throw error;

      setFoundries(prev => prev.map(f => 
        f.id === foundry.id ? { 
          ...f, 
          is_spotlight: isSpotlight, 
          spotlight_order: isSpotlight ? getNextSpotlightOrder() : 0,
          spotlight_is_primary: shouldBePrimary,
        } : f
      ));

      setMessage({ type: "success", text: isSpotlight ? "Added to spotlight" : "Removed from spotlight" });
    } catch (err) {
      console.error("Error updating spotlight:", err);
      setMessage({ type: "error", text: "Failed to update" });
    }
  };

  const togglePrimary = async (foundryId: string) => {
    try {
      // First, unset any existing primary
      const { error: unsetError } = await supabase
        .from("foundries")
        .update({ spotlight_is_primary: false })
        .eq("is_spotlight", true)
        .neq("id", foundryId);
      
      if (unsetError) throw unsetError;

      // Set the new primary
      const { error } = await supabase
        .from("foundries")
        .update({ spotlight_is_primary: true })
        .eq("id", foundryId);

      if (error) throw error;

      // Update local state
      setFoundries(prev => prev.map(f => ({
        ...f,
        spotlight_is_primary: f.id === foundryId
      })));

      setMessage({ type: "success", text: "Primary spotlight updated" });
    } catch (err) {
      console.error("Error updating primary:", err);
      setMessage({ type: "error", text: "Failed to update primary" });
    }
  };

  const updateSpotlightData = async (foundryId: string, data: Partial<RawFoundry>) => {
    try {
      const { error } = await supabase
        .from("foundries")
        .update(data)
        .eq("id", foundryId);

      if (error) throw error;

      setFoundries(prev => prev.map(f => f.id === foundryId ? { ...f, ...data } : f));
    } catch (err) {
      console.error("Error updating spotlight data:", err);
      setMessage({ type: "error", text: "Failed to update" });
    }
  };

  const reorderSpotlights = async (newOrder: RawFoundry[]) => {
    try {
      // Update local state first for immediate feedback
      setFoundries(prev => {
        const updated = [...prev];
        newOrder.forEach((f, idx) => {
          const index = updated.findIndex(item => item.id === f.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], spotlight_order: idx + 1 };
          }
        });
        return updated;
      });

      // Save to database
      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from("foundries")
          .update({ spotlight_order: i + 1 })
          .eq("id", newOrder[i].id);
      }

      setMessage({ type: "success", text: "Order updated" });
    } catch (err) {
      console.error("Error reordering:", err);
      setMessage({ type: "error", text: "Failed to update order" });
      loadData(); // Reload to get correct order
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== index) setDragOverIndex(index);
  };
  const handleDragLeave = () => setDragOverIndex(null);
  
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const spotlightList = spotlightFoundries.map((f, idx) => ({ ...f, originalIndex: idx }));
    const [removed] = spotlightList.splice(draggedIndex, 1);
    spotlightList.splice(dropIndex, 0, removed);

    await reorderSpotlights(spotlightList);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getNextSpotlightOrder = () => spotlightFoundries.length + 1;

  const spotlightFoundries = foundries
    .filter(f => f.is_spotlight)
    .sort((a, b) => a.spotlight_order - b.spotlight_order);

  const getPreviewFoundries = () => {
    return spotlightFoundries.slice(0, MAX_SPOTLIGHTS).map(f => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      location: { city: f.location_city, country: f.location_country, countryCode: f.location_country_code },
      url: '',
      contentFeed: { type: null, url: null, rss: null, frequency: null },
      founder: '',
      founded: 0,
      notableTypefaces: f.notable_typefaces,
      style: f.style,
      tier: f.tier,
      socialMedia: { instagram: null, twitter: null },
      notes: f.notes || '',
      images: { screenshot: f.screenshot_url, logo: null, specimens: [] },
      created_at: '',
      updated_at: '',
      spotlightDescription: f.spotlight_description || undefined,
      spotlightQuote: f.spotlight_quote || undefined,
      spotlightIsPrimary: f.spotlight_is_primary,
    }));
  };

  const isDirty = formState && settings && JSON.stringify(formState) !== JSON.stringify(settings);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
            <h2 className="text-xl font-medium text-amber-900 mb-4">Database Setup Required</h2>
            <p className="text-amber-800 mb-6">
              Run this SQL in your Supabase SQL Editor to enable the spotlight feature:
            </p>
            <pre className="bg-neutral-900 text-neutral-300 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
              {setupSql}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <a 
                  href="/admin" 
                  className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  Admin
                </a>
                <span className="text-neutral-300">/</span>
                <span className="text-sm text-neutral-500">Spotlight</span>
              </div>
              <h1 className="text-2xl font-medium text-neutral-900">Spotlight Manager</h1>
              {spotlightFoundries.length > 0 && (
                <p className="text-sm text-neutral-500 mt-1">
                  {spotlightFoundries.length} foundr{spotlightFoundries.length !== 1 ? 'ies' : 'y'} selected
                  {isDirty && <span className="text-amber-600 ml-2">• Unsaved changes</span>}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {hasDraft && (
                <button
                  onClick={() => {
                    localStorage.removeItem("spotlight_draft");
                    setHasDraft(false);
                    if (settings) setFormState(settings);
                  }}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Discard Draft
                </button>
              )}
              <button
                onClick={saveSettings}
                disabled={!isDirty || saving}
                className="px-6 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem("admin_auth");
                  setIsAuthenticated(false);
                }}
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Draft Banner */}
        {showDraftBanner && pendingDraft && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-900">Unsaved Draft Changes</h3>
                <p className="text-sm text-amber-700 mt-1">
                  You have unsaved changes from a previous session. Would you like to restore them?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormState(pendingDraft);
                    setShowDraftBanner(false);
                    setMessage({ type: "success", text: "Draft restored" });
                  }}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 transition-colors"
                >
                  Restore
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("spotlight_draft");
                    setShowDraftBanner(false);
                    setHasDraft(false);
                    setPendingDraft(null);
                    if (settings) setFormState(settings);
                  }}
                  className="px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded hover:bg-amber-100 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Combined Settings & Foundries Layout */}
        <div className="space-y-6">
          {/* Settings Bar */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex flex-wrap items-center gap-4">
              {/* Enable Toggle Button with Auto-save */}
              <button
                onClick={async () => {
                  if (!formState || !settings) return;
                  const newEnabled = !formState.is_enabled;
                  
                  // Optimistically update UI
                  setFormState(prev => prev ? { ...prev, is_enabled: newEnabled } : null);
                  
                  // Save via API
                  try {
                    const response = await fetch("/api/admin/spotlight", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        password: ADMIN_PASSWORD,
                        settings: { ...formState, is_enabled: newEnabled },
                      }),
                    });
                    
                    const result = await response.json();
                    
                    if (!response.ok) {
                      throw new Error(result.error || "Failed to save");
                    }
                    
                    // Update saved settings state
                    setSettings({ ...settings, is_enabled: newEnabled });
                    localStorage.removeItem("spotlight_draft");
                    setHasDraft(false);
                    setMessage({ type: "success", text: newEnabled ? "Spotlight enabled" : "Spotlight disabled" });
                  } catch (err) {
                    console.error("Error saving:", err);
                    // Revert on error
                    setFormState(prev => prev ? { ...prev, is_enabled: !newEnabled } : null);
                    setMessage({ type: "error", text: "Failed to save. Please try again." });
                  }
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formState?.is_enabled
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${formState?.is_enabled ? "bg-white" : "bg-neutral-400"}`} />
                {formState?.is_enabled ? "Spotlight Enabled" : "Spotlight Disabled"}
              </button>

              {/* Layout Style Selector with Auto-save */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">Layout:</span>
                <select
                  value={formState?.variant || "hero"}
                  onChange={async (e) => {
                    if (!formState || !settings) return;
                    const newVariant = e.target.value as SpotlightSettings["variant"];
                    
                    // Optimistically update UI
                    setFormState(prev => prev ? { ...prev, variant: newVariant } : null);
                    
                    // Save via API
                    try {
                      const response = await fetch("/api/admin/spotlight", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          password: ADMIN_PASSWORD,
                          settings: { ...formState, variant: newVariant },
                        }),
                      });
                      
                      const result = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(result.error || "Failed to save");
                      }
                      
                      // Update saved settings state
                      setSettings({ ...settings, variant: newVariant });
                      localStorage.removeItem("spotlight_draft");
                      setHasDraft(false);
                      setMessage({ type: "success", text: `Layout changed to ${newVariant}` });
                    } catch (err) {
                      console.error("Error saving:", err);
                      // Revert on error
                      setFormState(prev => prev ? { ...prev, variant: settings.variant } : null);
                      setMessage({ type: "error", text: "Failed to save layout. Please try again." });
                    }
                  }}
                  className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                >
                  <option value="hero">Hero</option>
                  <option value="grid">Grid</option>
                </select>
              </div>

              {/* Selection Count */}
              <div className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-neutral-500">Selected:</span>
                <span className={`font-medium ${spotlightFoundries.length >= MAX_SPOTLIGHTS ? "text-orange-600" : "text-neutral-900"}`}>
                  {spotlightFoundries.length} / {MAX_SPOTLIGHTS}
                </span>
              </div>
            </div>
          </div>

          {/* Foundries Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Selected Foundries */}
            <div className="bg-white rounded-lg p-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Selected Foundries</h2>
                <span className="text-xs text-neutral-500">Drag to reorder</span>
              </div>

              {spotlightFoundries.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No foundries selected</p>
              ) : (
                <div className="space-y-2">
                  {spotlightFoundries.map((foundry, index) => (
                    <div
                      key={foundry.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`p-4 bg-neutral-50 rounded-lg cursor-move transition-all ${
                        draggedIndex === index ? "opacity-50 ring-2 ring-orange-500" : ""
                      } ${
                        dragOverIndex === index && dragOverIndex !== draggedIndex
                          ? "border-t-4 border-orange-500 -mt-1"
                          : ""
                      } ${foundry.spotlight_is_primary ? "ring-2 ring-orange-500 bg-orange-50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        <svg className="text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="12" r="1" />
                          <circle cx="9" cy="5" r="1" />
                          <circle cx="9" cy="19" r="1" />
                          <circle cx="15" cy="12" r="1" />
                          <circle cx="15" cy="5" r="1" />
                          <circle cx="15" cy="19" r="1" />
                        </svg>
                        
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          foundry.spotlight_is_primary 
                            ? "bg-orange-500 text-white" 
                            : "bg-neutral-900 text-white"
                        }`}>
                          {index + 1}
                        </span>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{foundry.name}</h4>
                            {foundry.spotlight_is_primary && (
                              <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] uppercase tracking-wider rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500">
                            {foundry.location_city}, {foundry.location_country}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Primary Toggle */}
                          {!foundry.spotlight_is_primary && (
                            <button
                              onClick={() => togglePrimary(foundry.id)}
                              className="text-xs px-2 py-1 bg-white border border-neutral-300 rounded hover:border-orange-500 hover:text-orange-600 transition-colors"
                              title="Make primary featured foundry"
                            >
                              Set as Primary
                            </button>
                          )}
                          <button
                            onClick={() => toggleSpotlight(foundry, false)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <div className="mt-3 ml-9">
                        <textarea
                          value={foundry.spotlight_description || ""}
                          onChange={(e) => updateSpotlightData(foundry.id, { spotlight_description: e.target.value })}
                          placeholder="Add a custom description..."
                          rows={2}
                          className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Foundries */}
            <div className="bg-white rounded-lg p-6 border border-neutral-200">
              <h2 className="text-lg font-medium mb-4">Available Foundries</h2>
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {foundries
                  .filter(f => !f.is_spotlight)
                  .map((foundry) => (
                    <div
                      key={foundry.id}
                      className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg border border-transparent hover:border-neutral-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center text-xs font-medium text-neutral-500">
                          {foundry.name.charAt(0)}
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
                        disabled={spotlightFoundries.length >= MAX_SPOTLIGHTS}
                        className="px-3 py-1.5 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Preview - Full Width */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Preview</h2>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  previewMode 
                    ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300" 
                    : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm"
                }`}
              >
                {previewMode ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                    Hide Preview
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Show Preview
                  </>
                )}
              </button>
            </div>

            {previewMode && spotlightFoundries.length > 0 ? (
              <div className="border-2 border-dashed border-neutral-300 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 text-xs text-orange-700 font-medium flex items-center justify-between">
                  <span>Live Preview</span>
                  <span className="text-orange-600">Showing {spotlightFoundries.length} of {MAX_SPOTLIGHTS}</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <HeroSpotlight
                    spotlightFoundries={getPreviewFoundries()}
                  />
                </div>
              </div>
            ) : previewMode ? (
              <div className="bg-neutral-100 rounded-lg p-8 text-center text-neutral-500">
                Select foundries above to see preview
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
