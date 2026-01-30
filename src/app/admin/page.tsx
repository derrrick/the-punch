"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { FoundrySubmission } from "@/lib/supabase";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState<FoundrySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Simple password check (we'll upgrade this later)
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
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
      let query = supabase
        .from("foundry_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error("Error loading submissions:", err);
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected", reason?: string) => {
    try {
      const { error } = await supabase
        .from("foundry_submissions")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: "admin",
          rejection_reason: reason || null,
        })
        .eq("id", id);

      if (error) throw error;

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
            Foundry Submissions
          </h1>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword("");
            }}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-4 mb-8 border-b border-neutral-200">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
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

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onStatusUpdate(submission.id, "rejected", rejectionReason);
    setShowRejectForm(false);
    setRejectionReason("");
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

      {/* Actions */}
      {submission.status === "pending" && (
        <div className="mt-6 flex gap-3">
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
      )}
    </div>
  );
}
