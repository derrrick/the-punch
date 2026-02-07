"use client";

import { useState, useEffect } from "react";
import type { FoundrySubmission } from "@/lib/supabase";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState<FoundrySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "published">("pending");

  // Simple password check (we'll upgrade this later)
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD.trim()) {
      sessionStorage.setItem("admin_password", password.trim());
      setIsAuthenticated(true);
      setError("");
      loadSubmissions();
    } else {
      setError("Invalid password");
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password || sessionStorage.getItem("admin_password"), filter }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to load');
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error("Error loading submissions:", err);
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected", reason?: string) => {
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password || sessionStorage.getItem("admin_password"),
          action: 'updateStatus',
          id,
          status,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      // Reload submissions
      loadSubmissions();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSubmissions();
    }
  }, [filter, isAuthenticated]);

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
            {error && (
              <p className="text-sm text-red-600">{error}</p>
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

  // Admin dashboard
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900">
            Admin Dashboard
          </h1>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword("");
              sessionStorage.removeItem("admin_auth");
              sessionStorage.removeItem("admin_password");
            }}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <a
            href="/admin/spotlight"
            className="group bg-white border border-neutral-200 rounded-lg p-6 hover:border-orange-400 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium mb-2 group-hover:text-orange-600">
                  Spotlight
                </h2>
                <p className="text-sm text-neutral-500">
                  Feature exceptional foundries on the homepage
                </p>
              </div>
              <span className="text-2xl">⭐</span>
            </div>
          </a>

          <a
            href="/admin/newsletter"
            className="group bg-white border border-neutral-200 rounded-lg p-6 hover:border-neutral-400 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium mb-2 group-hover:text-neutral-700">
                  Newsletter
                </h2>
                <p className="text-sm text-neutral-500">
                  Compose, preview, and send The Punch Weekly
                </p>
              </div>
              <span className="text-2xl">✉️</span>
            </div>
          </a>

          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium mb-2">
                  Submissions
                </h2>
                <p className="text-sm text-neutral-500">
                  Review and manage foundry submissions
                </p>
              </div>
              <span className="text-2xl">📋</span>
            </div>
          </div>

          <a
            href="/admin/settings"
            className="group bg-white border border-neutral-200 rounded-lg p-6 hover:border-neutral-400 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium mb-2 group-hover:text-neutral-700">
                  Settings & Maintenance
                </h2>
                <p className="text-sm text-neutral-500">
                  Re-scrape screenshots, run data validation
                </p>
              </div>
              <span className="text-2xl">⚙️</span>
            </div>
          </a>
        </div>

        <h2 className="text-2xl font-medium tracking-tight text-neutral-900 mb-6">
          Foundry Submissions
        </h2>

        {/* Filter tabs */}
        <div className="flex gap-4 mb-8 border-b border-neutral-200">
          {(["all", "pending", "approved", "rejected", "published"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`pb-3 px-4 text-sm uppercase tracking-[0.1em] transition-colors ${
                filter === status
                  ? "border-b-2 border-neutral-900 text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Submissions list */}
        {loading ? (
          <div className="text-center py-12 text-neutral-500">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No {filter !== "all" ? filter : ""} submissions found
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onStatusUpdate={updateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Submission card component
// Editable foundry data form interface
interface EditableFoundryData {
  foundryName: string;
  founder: string;
  foundedYear: string;
  city: string;
  country: string;
  countryCode: string;
  notableTypefaces: string;
  styleTags: string;
  tier: string;
  positioningNote: string;
  notes: string;
  socialInstagram: string;
  socialTwitter: string;
  screenshotUrl: string;
  contentFeedType: string;
  contentFeedUrl: string;
  contentFeedRss: string;
  contentFeedFrequency: string;
}

function SubmissionCard({
  submission,
  onStatusUpdate,
}: {
  submission: FoundrySubmission;
  onStatusUpdate: (id: string, status: "approved" | "rejected", reason?: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState(submission.scraped_metadata);
  const [isAddingToDirectory, setIsAddingToDirectory] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(submission.ai_analysis);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editData, setEditData] = useState<EditableFoundryData>({
    foundryName: '',
    founder: '',
    foundedYear: '',
    city: '',
    country: '',
    countryCode: '',
    notableTypefaces: '',
    styleTags: '',
    tier: '3',
    positioningNote: '',
    notes: '',
    socialInstagram: '',
    socialTwitter: '',
    screenshotUrl: '',
    contentFeedType: '',
    contentFeedUrl: '',
    contentFeedRss: '',
    contentFeedFrequency: '',
  });

  // Initialize edit form with AI analysis data when entering edit mode
  const startEditing = () => {
    const loc = submission.location?.split(',').map(s => s.trim()) || [];
    setEditData({
      foundryName: aiAnalysis?.foundryNameOverride || submission.foundry_name || '',
      founder: aiAnalysis?.founderName || '',
      foundedYear: aiAnalysis?.foundedYear?.toString() || '',
      city: aiAnalysis?.location?.city || loc[0] || '',
      country: aiAnalysis?.location?.country || loc[1] || '',
      countryCode: aiAnalysis?.location?.countryCode || '',
      notableTypefaces: (aiAnalysis?.notableTypefaces || []).join(', '),
      styleTags: (aiAnalysis?.styleTags || []).join(', '),
      tier: (aiAnalysis?.tier || 3).toString(),
      positioningNote: aiAnalysis?.positioningNote || '',
      notes: aiAnalysis?.notes || submission.notes || '',
      socialInstagram: aiAnalysis?.socialInstagram || scrapedData?.socialMedia?.instagram || '',
      socialTwitter: aiAnalysis?.socialTwitter || scrapedData?.socialMedia?.twitter || '',
      screenshotUrl: aiAnalysis?.screenshotUrl || scrapedData?.screenshot || '',
      contentFeedType: aiAnalysis?.contentFeedType || '',
      contentFeedUrl: aiAnalysis?.contentFeedUrl || '',
      contentFeedRss: aiAnalysis?.contentFeedRss || '',
      contentFeedFrequency: aiAnalysis?.contentFeedFrequency || '',
    });
    setIsEditing(true);
  };

  // Save edited data back to submission
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const updatedAnalysis = {
        ...aiAnalysis,
        foundryNameOverride: editData.foundryName !== submission.foundry_name ? editData.foundryName : undefined,
        founderName: editData.founder || undefined,
        foundedYear: editData.foundedYear ? parseInt(editData.foundedYear) : undefined,
        location: {
          city: editData.city || undefined,
          country: editData.country || undefined,
          countryCode: editData.countryCode || undefined,
        },
        notableTypefaces: editData.notableTypefaces.split(',').map(s => s.trim()).filter(Boolean),
        styleTags: editData.styleTags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
        tier: parseInt(editData.tier) as 1 | 2 | 3 | 4,
        positioningNote: editData.positioningNote,
        notes: editData.notes,
        socialInstagram: editData.socialInstagram || undefined,
        socialTwitter: editData.socialTwitter || undefined,
        screenshotUrl: editData.screenshotUrl || undefined,
        contentFeedType: editData.contentFeedType || undefined,
        contentFeedUrl: editData.contentFeedUrl || undefined,
        contentFeedRss: editData.contentFeedRss || undefined,
        contentFeedFrequency: editData.contentFeedFrequency || undefined,
      };

      const response = await fetch('/api/update-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          aiAnalysis: updatedAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      setAiAnalysis(updatedAnalysis);
      setIsEditing(false);
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onStatusUpdate(submission.id, "rejected", rejectionReason);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const response = await fetch('/api/scrape-foundry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape website');
      }

      setScrapedData(data.metadata);
      alert('Website scraped successfully!');
    } catch (error) {
      console.error('Scraping error:', error);
      alert(`Failed to scrape: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleAnalyze = async () => {
    if (!scrapedData) {
      alert('Please scrape the website first before AI analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-foundry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze foundry');
      }

      setAiAnalysis(data.analysis);
      alert('AI analysis complete! Review the suggestions below.');
    } catch (error) {
      console.error('AI analysis error:', error);
      alert(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToDirectory = async () => {
    if (!confirm('Add this foundry to the live directory? This will make it visible on the website.')) {
      return;
    }

    setIsAddingToDirectory(true);
    try {
      const response = await fetch('/api/add-to-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to directory');
      }

      alert('Foundry added to directory successfully! Note: You may need to redeploy for changes to appear.');
      window.location.reload();
    } catch (error) {
      console.error('Add to directory error:', error);
      alert(`Failed to add to directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingToDirectory(false);
    }
  };

  const handleScreenshotDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    // Show preview immediately using base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setScrapedData((prev: typeof scrapedData) => prev ? { ...prev, screenshot: base64 } : prev);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    try {
      const formData = new FormData();
      formData.append('password', sessionStorage.getItem('admin_password') || '');
      formData.append('submissionId', submission.id);
      formData.append('foundryName', submission.foundry_name);
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-screenshot', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to upload screenshot');

      // Update local state with the storage URL
      const updatedAnalysis = { ...aiAnalysis, screenshotUrl: result.url };
      setAiAnalysis(updatedAnalysis);
      setScrapedData((prev: typeof scrapedData) => prev ? { ...prev, screenshot: result.url } : prev);
    } catch (err) {
      console.error('Failed to upload screenshot:', err);
      alert('Screenshot preview shown but upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-medium text-neutral-900">
              {submission.foundry_name}
            </h3>
            <span
              className={`text-xs uppercase tracking-wider px-2 py-1 rounded ${
                submission.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : submission.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : submission.status === "published"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {submission.status}
            </span>
          </div>

          <div className="space-y-1 text-sm text-neutral-600">
            <p>
              <span className="font-medium">URL:</span>{" "}
              <a
                href={submission.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 hover:underline"
              >
                {submission.website_url}
              </a>
            </p>
            {submission.location && (
              <p>
                <span className="font-medium">Location:</span> {submission.location}
              </p>
            )}
            <p>
              <span className="font-medium">Submitted by:</span> {submission.submitter_email}
            </p>
            <p>
              <span className="font-medium">Submitted:</span>{" "}
              {new Date(submission.created_at).toLocaleDateString()}
            </p>
          </div>

          {submission.notes && isExpanded && (
            <div className="mt-4 p-4 bg-neutral-50 rounded">
              <p className="text-sm font-medium text-neutral-700 mb-1">Notes:</p>
              <p className="text-sm text-neutral-600">{submission.notes}</p>
            </div>
          )}

          {submission.status === "rejected" && submission.rejection_reason && (
            <div className="mt-4 p-4 bg-red-50 rounded">
              <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-600">{submission.rejection_reason}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {submission.notes && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              {isExpanded ? "Hide" : "Show"} notes
            </button>
          )}
        </div>
      </div>

      {/* Scraped Data Display */}
      {scrapedData && (
        <div className="mt-4 p-4 bg-blue-50 rounded space-y-3">
          <p className="text-sm font-medium text-blue-700">Auto-Scraped Data:</p>

          <div
            className={`mt-2 relative cursor-pointer rounded border-2 border-dashed transition-colors ${
              isDraggingOver
                ? 'border-blue-500 bg-blue-100'
                : 'border-blue-200 hover:border-blue-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleScreenshotDrop}
          >
            {scrapedData.screenshot ? (
              <>
                <img
                  src={scrapedData.screenshot}
                  alt="Website screenshot"
                  className={`w-full rounded transition-opacity ${isDraggingOver ? 'opacity-40' : ''}`}
                />
                {isDraggingOver && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-blue-700 font-medium text-sm">Drop image to replace screenshot</p>
                  </div>
                )}
                <p className="text-xs text-blue-500 text-center py-1">Drag & drop an image here to replace</p>
              </>
            ) : (
              <div className={`py-8 flex flex-col items-center justify-center ${isDraggingOver ? 'bg-blue-100' : 'bg-blue-50'}`}>
                <p className="text-blue-700 font-medium text-sm">
                  {isDraggingOver ? 'Drop image here' : 'No screenshot available'}
                </p>
                <p className="text-xs text-blue-500 mt-1">Drag & drop an image to add a screenshot</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {scrapedData.title && (
              <div>
                <span className="font-medium text-blue-700">Title:</span>
                <p className="text-blue-600">{scrapedData.title}</p>
              </div>
            )}
            {scrapedData.description && (
              <div className="col-span-2">
                <span className="font-medium text-blue-700">Description:</span>
                <p className="text-blue-600">{scrapedData.description}</p>
              </div>
            )}
            {scrapedData.socialMedia?.instagram && (
              <div>
                <span className="font-medium text-blue-700">Instagram:</span>
                <p className="text-blue-600">{scrapedData.socialMedia.instagram}</p>
              </div>
            )}
            {scrapedData.socialMedia?.twitter && (
              <div>
                <span className="font-medium text-blue-700">Twitter:</span>
                <p className="text-blue-600">{scrapedData.socialMedia.twitter}</p>
              </div>
            )}
            {scrapedData.typefaceListings && scrapedData.typefaceListings.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium text-blue-700">Found Typefaces:</span>
                <p className="text-blue-600">{scrapedData.typefaceListings.slice(0, 10).join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Display */}
      {aiAnalysis && (
        <div className="mt-4 p-4 bg-purple-50 rounded space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-700">🤖 AI Analysis</p>
            <span className={`text-xs px-2 py-1 rounded ${
              aiAnalysis.confidence === 'high' ? 'bg-green-100 text-green-700' :
              aiAnalysis.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {aiAnalysis.confidence} confidence
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {aiAnalysis.founderName && (
              <div>
                <span className="font-medium text-purple-700">Founder:</span>
                <p className="text-purple-600">{aiAnalysis.founderName}</p>
              </div>
            )}
            {aiAnalysis.foundedYear && (
              <div>
                <span className="font-medium text-purple-700">Founded:</span>
                <p className="text-purple-600">{aiAnalysis.foundedYear}</p>
              </div>
            )}
            {aiAnalysis.location && (aiAnalysis.location.city || aiAnalysis.location.country) && (
              <div className="col-span-2">
                <span className="font-medium text-purple-700">Location:</span>
                <p className="text-purple-600">
                  {[aiAnalysis.location.city, aiAnalysis.location.country].filter(Boolean).join(', ')}
                  {aiAnalysis.location.countryCode && ` (${aiAnalysis.location.countryCode})`}
                </p>
              </div>
            )}
            {aiAnalysis.notableTypefaces && aiAnalysis.notableTypefaces.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium text-purple-700">Notable Typefaces:</span>
                <p className="text-purple-600">{aiAnalysis.notableTypefaces.join(', ')}</p>
              </div>
            )}
            {aiAnalysis.styleTags && aiAnalysis.styleTags.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium text-purple-700">Style Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiAnalysis.styleTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-purple-200 text-purple-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aiAnalysis.positioningNote && (
              <div className="col-span-2">
                <span className="font-medium text-purple-700">Positioning:</span>
                <p className="text-purple-600">{aiAnalysis.positioningNote}</p>
              </div>
            )}
            {aiAnalysis.notes && (
              <div className="col-span-2">
                <span className="font-medium text-purple-700">Notes:</span>
                <p className="text-purple-600">{aiAnalysis.notes}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-purple-700">Tier:</span>
              <p className="text-purple-600">{aiAnalysis.tier} ({
                aiAnalysis.tier === 1 ? 'Legendary' :
                aiAnalysis.tier === 2 ? 'Major' :
                aiAnalysis.tier === 3 ? 'Established' :
                'Emerging'
              })</p>
            </div>
          </div>

          {aiAnalysis.reasoning && (
            <div className="pt-2 border-t border-purple-200">
              <span className="font-medium text-purple-700 text-xs">AI Reasoning:</span>
              <p className="text-purple-600 text-xs mt-1">{aiAnalysis.reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {submission.status === "pending" && (
        <div className="mt-6 space-y-3">
          {/* Scrape & Analyze Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <button
                onClick={handleScrape}
                disabled={isScraping}
                className="bg-blue-600 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isScraping ? 'Scraping...' : scrapedData ? 'Re-scrape Website' : '1. Scrape Website'}
              </button>
              {submission.scraped_at && (
                <span className="text-xs text-neutral-500 self-center">
                  Last scraped: {new Date(submission.scraped_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {scrapedData && (
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !scrapedData}
                  className="bg-purple-600 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isAnalyzing ? 'Analyzing...' : aiAnalysis ? '🤖 Re-analyze with AI' : '2. 🤖 Analyze with AI'}
                </button>
                {submission.analyzed_at && (
                  <span className="text-xs text-neutral-500 self-center">
                    Last analyzed: {new Date(submission.analyzed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Approve/Reject Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onStatusUpdate(submission.id, "approved")}
              className="bg-green-600 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          {showRejectForm ? (
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Rejection reason..."
                className="flex-1 bg-white border border-neutral-200 px-4 py-2 text-sm focus:outline-none focus:border-neutral-400"
              />
              <button
                onClick={handleReject}
                className="bg-red-600 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
                className="bg-neutral-200 text-neutral-700 px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-neutral-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRejectForm(true)}
              className="bg-red-600 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          )}
          </div>
        </div>
      )}

      {/* Edit Data & Add to Directory (for pending and approved submissions) */}
      {(submission.status === "pending" || submission.status === "approved") && (
        <div className="mt-6 space-y-4">
          {isEditing ? (
            <div className="p-4 bg-amber-50 rounded border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-4">Edit Foundry Data</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Basic Info */}
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Basic Info</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-amber-700 mb-1">Foundry Name</label>
                  <input
                    type="text"
                    value={editData.foundryName}
                    onChange={(e) => setEditData({ ...editData, foundryName: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Foundry name (edit to fix typos)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Founder</label>
                  <input
                    type="text"
                    value={editData.founder}
                    onChange={(e) => setEditData({ ...editData, founder: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Founder name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Founded Year</label>
                  <input
                    type="number"
                    value={editData.foundedYear}
                    onChange={(e) => setEditData({ ...editData, foundedYear: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="YYYY"
                  />
                </div>

                {/* Location */}
                <div className="col-span-2 mt-2">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Location</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editData.city}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editData.country}
                    onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Country Code</label>
                  <input
                    type="text"
                    value={editData.countryCode}
                    onChange={(e) => setEditData({ ...editData, countryCode: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="US, GB, DE, etc."
                    maxLength={2}
                  />
                </div>

                {/* Typography */}
                <div className="col-span-2 mt-2">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Typography</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-amber-700 mb-1">Notable Typefaces (comma-separated)</label>
                  <input
                    type="text"
                    value={editData.notableTypefaces}
                    onChange={(e) => setEditData({ ...editData, notableTypefaces: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Typeface 1, Typeface 2, Typeface 3"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-amber-700 mb-1">Style Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editData.styleTags}
                    onChange={(e) => setEditData({ ...editData, styleTags: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="swiss, geometric, minimal"
                  />
                  <p className="text-xs text-amber-600 mt-1">Available: swiss, geometric, humanist, editorial, contemporary, modernist, brutalist, experimental, variable, display, playful, expressive, multilingual, minimal, grotesk, serif, etc.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Tier (1-4)</label>
                  <select
                    value={editData.tier}
                    onChange={(e) => setEditData({ ...editData, tier: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="1">1 - Legendary (Hoefler&Co)</option>
                    <option value="2">2 - Major (Grilli Type)</option>
                    <option value="3">3 - Established Indie</option>
                    <option value="4">4 - Emerging</option>
                  </select>
                </div>

                {/* Social & Web */}
                <div className="col-span-2 mt-2">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Social & Web</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={editData.socialInstagram}
                    onChange={(e) => setEditData({ ...editData, socialInstagram: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="https://instagram.com/foundry"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Twitter / X</label>
                  <input
                    type="text"
                    value={editData.socialTwitter}
                    onChange={(e) => setEditData({ ...editData, socialTwitter: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="https://twitter.com/foundry"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-amber-700 mb-1">Screenshot URL</label>
                  <input
                    type="text"
                    value={editData.screenshotUrl}
                    onChange={(e) => setEditData({ ...editData, screenshotUrl: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="https://... (override auto-scraped screenshot)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Content Feed Type</label>
                  <select
                    value={editData.contentFeedType}
                    onChange={(e) => setEditData({ ...editData, contentFeedType: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="">None</option>
                    <option value="blog">Blog</option>
                    <option value="rss">RSS</option>
                    <option value="newsletter">Newsletter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Content Feed URL</label>
                  <input
                    type="text"
                    value={editData.contentFeedUrl}
                    onChange={(e) => setEditData({ ...editData, contentFeedUrl: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="https://foundry.com/blog"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Content Feed RSS</label>
                  <input
                    type="text"
                    value={editData.contentFeedRss}
                    onChange={(e) => setEditData({ ...editData, contentFeedRss: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="https://foundry.com/feed.xml"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Content Feed Frequency</label>
                  <select
                    value={editData.contentFeedFrequency}
                    onChange={(e) => setEditData({ ...editData, contentFeedFrequency: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Unknown</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="irregular">Irregular</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="col-span-2 mt-2">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Notes</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-amber-700 mb-1">Positioning (1-liner, max 15 words)</label>
                  <input
                    type="text"
                    value={editData.positioningNote}
                    onChange={(e) => setEditData({ ...editData, positioningNote: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="What makes this foundry unique in one sentence..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-amber-700 mb-1">Notes (detailed background)</label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full bg-white border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    rows={3}
                    placeholder="Founder background, notable clients, unique business model, awards..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="bg-amber-600 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-neutral-200 text-neutral-700 px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-neutral-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={startEditing}
                className="bg-amber-500 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-amber-600 transition-colors"
              >
                Edit Data
              </button>
              {submission.status === "approved" && (
                <button
                  onClick={handleAddToDirectory}
                  disabled={isAddingToDirectory}
                  className="bg-blue-600 text-white px-6 py-2 text-sm uppercase tracking-[0.1em] hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isAddingToDirectory ? 'Adding...' : '✨ Add to Directory'}
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-neutral-500">
            {submission.status === "pending"
              ? "Manually populate foundry data before or after scraping. Changes will be saved to the submission."
              : "Review and edit data before adding to directory. Changes will be saved to the submission."}
          </p>
        </div>
      )}
    </div>
  );
}
