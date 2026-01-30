"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    foundryName: "",
    websiteUrl: "",
    location: "",
    email: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.foundryName.trim()) {
      newErrors.foundryName = "Foundry name is required";
    }

    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = "Website URL is required";
    } else if (!isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = "Please enter a valid URL";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeUrl = (url: string) => {
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const isValidUrl = (url: string) => {
    try {
      // Normalize before validating
      const normalizedUrl = normalizeUrl(url);
      new URL(normalizedUrl);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize the URL before submitting
      const normalizedUrl = normalizeUrl(formData.websiteUrl);

      // Save to Supabase
      const { data, error } = await supabase
        .from('foundry_submissions')
        .insert([
          {
            foundry_name: formData.foundryName,
            website_url: normalizedUrl,
            location: formData.location || null,
            submitter_email: formData.email,
            notes: formData.notes || null,
          },
        ])
        .select();

      if (error) {
        console.error('Submission error:', error);
        setErrors({ form: `Failed to submit: ${error.message}` });
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);

      // Clear form
      setFormData({
        foundryName: "",
        websiteUrl: "",
        location: "",
        email: "",
        notes: "",
      });
      setErrors({});
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-[680px] mx-auto px-6 md:px-12 py-32 md:py-40">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 leading-[1.15] mb-6">
              Thank you
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8">
              We&apos;ve received your submission and will review it soon.
              If the foundry fits our criteria, we&apos;ll add it to the directory.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
            >
              Submit another foundry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[680px] mx-auto px-6 md:px-12 py-32 md:py-40">
        {/* Header */}
        <div className="mb-16 md:mb-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 leading-[1.15] mb-6">
            Submit a foundry
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Know an independent type foundry that belongs here?
            Tell us about it and we&apos;ll review it for inclusion.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Form-level error */}
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.form}</p>
            </div>
          )}

          {/* Foundry Name */}
          <div>
            <label
              htmlFor="foundryName"
              className="block text-sm uppercase tracking-[0.15em] text-neutral-400 mb-3"
            >
              Foundry name *
            </label>
            <input
              type="text"
              id="foundryName"
              name="foundryName"
              value={formData.foundryName}
              onChange={handleChange}
              className={`w-full bg-white border ${
                errors.foundryName
                  ? "border-red-400"
                  : "border-neutral-200 focus:border-neutral-400"
              } rounded-none px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors`}
              placeholder="e.g., Dinamo Typefaces"
            />
            {errors.foundryName && (
              <p className="mt-2 text-sm text-red-500">{errors.foundryName}</p>
            )}
          </div>

          {/* Website URL */}
          <div>
            <label
              htmlFor="websiteUrl"
              className="block text-sm uppercase tracking-[0.15em] text-neutral-400 mb-3"
            >
              Website URL *
            </label>
            <input
              type="text"
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              className={`w-full bg-white border ${
                errors.websiteUrl
                  ? "border-red-400"
                  : "border-neutral-200 focus:border-neutral-400"
              } rounded-none px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors`}
              placeholder="example.com or www.example.com"
            />
            {errors.websiteUrl && (
              <p className="mt-2 text-sm text-red-500">{errors.websiteUrl}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm uppercase tracking-[0.15em] text-neutral-400 mb-3"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full bg-white border border-neutral-200 focus:border-neutral-400 rounded-none px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
              placeholder="e.g., Berlin, Germany"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm uppercase tracking-[0.15em] text-neutral-400 mb-3"
            >
              Your email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full bg-white border ${
                errors.email
                  ? "border-red-400"
                  : "border-neutral-200 focus:border-neutral-400"
              } rounded-none px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm uppercase tracking-[0.15em] text-neutral-400 mb-3"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full bg-white border border-neutral-200 focus:border-neutral-400 rounded-none px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors resize-none"
              placeholder="Anything else we should know?"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neutral-900 text-white py-4 px-8 text-sm uppercase tracking-[0.1em] hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit foundry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
