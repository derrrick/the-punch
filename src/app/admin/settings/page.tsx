"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ScrapeProgress {
  current: number;
  total: number;
  currentFoundry: string;
  status: 'in_progress' | 'completed' | 'error';
  successCount: number;
  failedCount: number;
  message?: string;
}

export default function AdminSettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Screenshot scraping state
  const [isStartingScrape, setIsStartingScrape] = useState(false);
  const [scrapeJobId, setScrapeJobId] = useState<string | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress | null>(null);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD.trim()) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  // Poll for scrape progress
  useEffect(() => {
    if (!scrapeJobId || !isAuthenticated) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/admin/rescrape-screenshots?jobId=${scrapeJobId}&password=${encodeURIComponent(password)}`
        );
        const data = await response.json();

        if (response.ok) {
          setScrapeProgress(data);

          // Stop polling when completed
          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling progress:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [scrapeJobId, isAuthenticated, password]);

  const handleStartScrape = async () => {
    if (!confirm('This will re-scrape screenshots for ALL foundries. This process takes several minutes. Continue?')) {
      return;
    }

    setIsStartingScrape(true);
    setScrapeProgress(null);

    try {
      const response = await fetch('/api/admin/rescrape-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scraping');
      }

      setScrapeJobId(data.jobId);
      setScrapeProgress({
        current: 0,
        total: data.foundryCount,
        currentFoundry: '',
        status: 'in_progress',
        successCount: 0,
        failedCount: 0,
      });
    } catch (err) {
      console.error('Start scrape error:', err);
      alert(`Failed to start: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsStartingScrape(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="max-w-md w-full px-6">
          <h1 className="text-3xl font-medium tracking-tight text-neutral-900 mb-8 text-center">
            Admin Login
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
            {error && <p className="text-sm text-red-600">{error}</p>}
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
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 block">
              ← Back to Admin
            </Link>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900">
              Settings & Maintenance
            </h1>
          </div>
        </div>

        {/* Screenshot Scraping Section */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium mb-2">Re-scrape Screenshots</h2>
              <p className="text-sm text-neutral-500 max-w-lg">
                Capture fresh screenshots of all foundry websites. Use this periodically to keep
                the directory visuals up-to-date. This process runs in the background and may take
                several minutes (~85 foundries × 5 seconds each).
              </p>
            </div>
            <span className="text-2xl">📸</span>
          </div>

          {/* Progress Display */}
          {scrapeProgress && (
            <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">
                  {scrapeProgress.status === 'in_progress' ? 'Scraping in progress...' :
                   scrapeProgress.status === 'completed' ? 'Completed!' : 'Error'}
                </span>
                <span className="text-sm text-neutral-500">
                  {scrapeProgress.current} / {scrapeProgress.total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    scrapeProgress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(scrapeProgress.current / scrapeProgress.total) * 100}%` }}
                />
              </div>

              {scrapeProgress.currentFoundry && scrapeProgress.status === 'in_progress' && (
                <p className="text-xs text-neutral-500 mb-2">
                  Currently processing: <span className="font-medium">{scrapeProgress.currentFoundry}</span>
                </p>
              )}

              <div className="flex gap-4 text-xs">
                <span className="text-green-600">✓ {scrapeProgress.successCount} success</span>
                <span className="text-red-600">✗ {scrapeProgress.failedCount} failed</span>
              </div>

              {scrapeProgress.message && (
                <p className="text-sm text-neutral-600 mt-2">{scrapeProgress.message}</p>
              )}
            </div>
          )}

          <button
            onClick={handleStartScrape}
            disabled={isStartingScrape || scrapeProgress?.status === 'in_progress'}
            className="bg-neutral-900 text-white px-6 py-3 text-sm uppercase tracking-[0.1em] hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStartingScrape ? 'Starting...' :
             scrapeProgress?.status === 'in_progress' ? 'Scraping in Progress...' :
             'Start Screenshot Scrape'}
          </button>

          <p className="text-xs text-neutral-400 mt-3">
            Last run: Check Supabase foundries table for updated_at timestamps
          </p>
        </div>

        {/* Future settings sections can go here */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 opacity-50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-medium mb-2">Data Validation</h2>
              <p className="text-sm text-neutral-500">
                Run automated validation of foundry data against their websites. Coming soon.
              </p>
            </div>
            <span className="text-2xl">🔍</span>
          </div>
        </div>
      </div>
    </div>
  );
}
