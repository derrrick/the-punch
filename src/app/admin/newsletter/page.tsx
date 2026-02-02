"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Foundry } from "@/lib/foundries-db";

interface NewsletterFormData {
  issueNumber: string;
  subject: string;
  introHeadline: string;
  introBody: string;
  selectedFoundries: string[];
  quickLinksTitle: string;
  quickLinks: { title: string; url: string; description: string }[];
  testEmail: string;
}

interface SubscriberStats {
  total: number;
  active: number;
}

const INITIAL_FORM_DATA: NewsletterFormData = {
  issueNumber: "",
  subject: "",
  introHeadline: "",
  introBody: "",
  selectedFoundries: [],
  quickLinksTitle: "More to Explore",
  quickLinks: [
    { title: "", url: "", description: "" },
    { title: "", url: "", description: "" },
  ],
  testEmail: "",
};

export default function NewsletterAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [foundries, setFoundries] = useState<Foundry[]>([]);
  const [formData, setFormData] = useState<NewsletterFormData>(INITIAL_FORM_DATA);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats>({ total: 0, active: 0 });
  const [activeTab, setActiveTab] = useState<"compose" | "preview" | "send">("compose");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

  // Check for existing auth on mount
  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadData();
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
    setIsLoading(true);
    try {
      // Load foundries
      const { data: foundriesData, error: foundriesError } = await supabase
        .from("foundries")
        .select("*")
        .order("tier", { ascending: true })
        .order("name", { ascending: true });

      if (foundriesError) throw foundriesError;
      setFoundries(foundriesData || []);

      // Load subscriber stats
      const { count: totalCount } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true });

      const { count: activeCount } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setSubscriberStats({
        total: totalCount || 0,
        active: activeCount || 0,
      });

      // Generate next issue number
      const { data: issuesData } = await supabase
        .from("newsletter_issues")
        .select("issue_number")
        .order("created_at", { ascending: false })
        .limit(1);

      const nextIssue = issuesData && issuesData.length > 0
        ? String(parseInt(issuesData[0].issue_number) + 1).padStart(2, "0")
        : "01";
      
      setFormData((prev) => ({ ...prev, issueNumber: nextIssue }));
    } catch (err) {
      console.error("Error loading data:", err);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = async () => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch("/api/newsletter/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPreviewHtml(data.html);
      setActiveTab("preview");
    } catch (err) {
      console.error("Preview error:", err);
      setMessage({ type: "error", text: "Failed to generate preview" });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const sendTest = async () => {
    if (!formData.testEmail) {
      setMessage({ type: "error", text: "Please enter a test email address" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mode: "test",
          testEmail: formData.testEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessage({ type: "success", text: `Test email sent to ${formData.testEmail}` });
    } catch (err) {
      console.error("Send test error:", err);
      setMessage({ type: "error", text: "Failed to send test email" });
    } finally {
      setIsLoading(false);
    }
  };

  const sendNewsletter = async () => {
    if (!confirm(`Are you sure you want to send this newsletter to ${subscriberStats.active} subscribers?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mode: "production",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessage({ type: "success", text: `Newsletter sent successfully to ${data.sent} subscribers` });
    } catch (err) {
      console.error("Send error:", err);
      setMessage({ type: "error", text: "Failed to send newsletter" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFoundry = (foundryId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFoundries: prev.selectedFoundries.includes(foundryId)
        ? prev.selectedFoundries.filter((id) => id !== foundryId)
        : [...prev.selectedFoundries, foundryId],
    }));
  };

  const updateQuickLink = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const addQuickLink = () => {
    setFormData((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { title: "", url: "", description: "" }],
    }));
  };

  const removeQuickLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index),
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="max-w-md w-full px-6">
          <h1 className="text-3xl font-medium tracking-tight text-neutral-900 mb-8 text-center">
            Newsletter Admin
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
              Newsletter Admin
            </h1>
            <p className="text-neutral-500 mt-1">
              {subscriberStats.active.toLocaleString()} active subscribers ·{" "}
              {subscriberStats.total.toLocaleString()} total
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

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-neutral-200 p-1 rounded-lg w-fit">
          {[
            { id: "compose", label: "Compose" },
            { id: "preview", label: "Preview" },
            { id: "send", label: "Send" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
          </div>
        )}

        {/* Compose Tab */}
        {activeTab === "compose" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <section className="bg-white rounded-lg p-6 border border-neutral-200">
                <h2 className="text-lg font-medium mb-4">Issue Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Issue Number
                    </label>
                    <input
                      type="text"
                      value={formData.issueNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, issueNumber: e.target.value }))
                      }
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-4 py-2 focus:outline-none focus:border-neutral-400"
                      placeholder="01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email Subject *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-4 py-2 focus:outline-none focus:border-neutral-400"
                      placeholder="The Punch Weekly — Issue Title"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-lg p-6 border border-neutral-200">
                <h2 className="text-lg font-medium mb-4">Introduction</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Headline (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.introHeadline}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, introHeadline: e.target.value }))
                      }
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-4 py-2 focus:outline-none focus:border-neutral-400"
                      placeholder="This week: Something exciting"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Body Text *
                    </label>
                    <textarea
                      value={formData.introBody}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, introBody: e.target.value }))
                      }
                      rows={5}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-4 py-2 focus:outline-none focus:border-neutral-400 resize-none"
                      placeholder="Write your introduction here..."
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-lg p-6 border border-neutral-200">
                <h2 className="text-lg font-medium mb-4">Quick Links</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={formData.quickLinksTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, quickLinksTitle: e.target.value }))
                      }
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-4 py-2 focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                  {formData.quickLinks.map((link, index) => (
                    <div key={index} className="p-4 bg-neutral-50 rounded-md space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-500">
                          Link {index + 1}
                        </span>
                        <button
                          onClick={() => removeQuickLink(index)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => updateQuickLink(index, "title", e.target.value)}
                        placeholder="Link title"
                        className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateQuickLink(index, "url", e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                      />
                      <input
                        type="text"
                        value={link.description}
                        onChange={(e) => updateQuickLink(index, "description", e.target.value)}
                        placeholder="Brief description (optional)"
                        className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addQuickLink}
                    className="w-full py-2 border border-dashed border-neutral-300 rounded-md text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors text-sm"
                  >
                    + Add Link
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column - Foundry Selection */}
            <div className="space-y-6">
              <section className="bg-white rounded-lg p-6 border border-neutral-200">
                <h2 className="text-lg font-medium mb-4">
                  Featured Foundries
                  <span className="ml-2 text-sm font-normal text-neutral-500">
                    ({formData.selectedFoundries.length} selected)
                  </span>
                </h2>
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                  {foundries.map((foundry) => (
                    <label
                      key={foundry.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.selectedFoundries.includes(foundry.id)
                          ? "bg-neutral-100 border border-neutral-200"
                          : "hover:bg-neutral-50 border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedFoundries.includes(foundry.id)}
                        onChange={() => toggleFoundry(foundry.id)}
                        className="mt-1 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">
                          {foundry.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {foundry.location.city}, {foundry.location.country}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {foundry.style.slice(0, 3).join(" · ")}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Preview Button */}
              <button
                onClick={generatePreview}
                disabled={isPreviewLoading || !formData.subject || !formData.introBody}
                className="w-full bg-neutral-900 text-white py-4 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPreviewLoading ? "Generating Preview..." : "Generate Preview →"}
              </button>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Email Preview</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("compose")}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  ← Back to Edit
                </button>
                <button
                  onClick={() => setActiveTab("send")}
                  className="px-6 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
                >
                  Continue to Send →
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[800px]"
                  title="Email Preview"
                />
              ) : (
                <div className="p-12 text-center text-neutral-500">
                  No preview generated yet. Go to Compose tab to generate preview.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Send Tab */}
        {activeTab === "send" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <section className="bg-white rounded-lg p-6 border border-neutral-200">
              <h2 className="text-lg font-medium mb-4">Test Email</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Send a test email to yourself before sending to all subscribers.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={formData.testEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, testEmail: e.target.value }))
                  }
                  placeholder="your@email.com"
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-md px-4 py-2 focus:outline-none focus:border-neutral-400"
                />
                <button
                  onClick={sendTest}
                  disabled={isLoading || !formData.testEmail}
                  className="px-6 py-2 bg-neutral-200 text-neutral-700 font-medium rounded-md hover:bg-neutral-300 disabled:opacity-50 transition-colors"
                >
                  Send Test
                </button>
              </div>
            </section>

            <section className="bg-white rounded-lg p-6 border border-neutral-200">
              <h2 className="text-lg font-medium mb-4">Send Newsletter</h2>
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Issue</span>
                    <span className="font-medium">#{formData.issueNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Subject</span>
                    <span className="font-medium">{formData.subject || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Featured Foundries</span>
                    <span className="font-medium">{formData.selectedFoundries.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Recipients</span>
                    <span className="font-medium">{subscriberStats.active.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> This will send the newsletter to all{" "}
                    {subscriberStats.active.toLocaleString()} active subscribers. Make sure you&apos;ve
                    tested the email first!
                  </p>
                </div>

                <button
                  onClick={sendNewsletter}
                  disabled={isLoading || !formData.subject || !formData.introBody}
                  className="w-full py-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? "Sending..."
                    : `Send to ${subscriberStats.active.toLocaleString()} Subscribers`}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
