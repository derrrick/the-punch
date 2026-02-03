import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How The Punch collects, uses, and protects your data.",
  openGraph: {
    title: "Privacy Policy — The Punch",
    description: "How The Punch collects, uses, and protects your data.",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <div className="max-w-[680px] mx-auto px-6 md:px-12 py-32 md:py-40">
        {/* Headline */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 leading-[1.15] mb-8">
          Privacy Policy
        </h1>
        <p className="text-sm text-neutral-400 mb-20 md:mb-28">
          Last updated: January 31, 2026
        </p>

        {/* Data Collection */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            What we collect
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed mb-6">
            The Punch collects minimal data to provide and improve our service:
          </p>
          <ul className="space-y-3 text-lg md:text-xl text-neutral-700 leading-relaxed">
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Email addresses</strong> for
                newsletter subscriptions
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Submission data</strong> when
                you submit a foundry (name, website URL, location, contact email, notes)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Basic usage data</strong> like
                IP address and browser information for spam prevention
              </span>
            </li>
          </ul>
        </section>

        {/* Data Usage */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            How we use your data
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed mb-6">
            We use the information we collect to:
          </p>
          <ul className="space-y-3 text-lg md:text-xl text-neutral-700 leading-relaxed">
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>Send you our weekly newsletter (if you&apos;ve subscribed)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>Review and add foundry submissions to our directory</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>Prevent spam and abuse of our forms</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>Improve the site and understand how it&apos;s being used</span>
            </li>
          </ul>
        </section>

        {/* Third Parties */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Third-party services
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed mb-6">
            We use the following services to operate The Punch:
          </p>
          <ul className="space-y-3 text-lg md:text-xl text-neutral-700 leading-relaxed">
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Supabase</strong> for database
                and data storage
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Vercel</strong> for web hosting
                and deployment
              </span>
            </li>
          </ul>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed mt-6">
            These services may have their own privacy policies. We do not
            share your data with any third parties for marketing purposes.
          </p>
        </section>

        {/* User Rights */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Your rights
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            You have the right to request access to, correction of, or deletion
            of your personal data. If you&apos;d like to unsubscribe from our
            newsletter or delete your data, please contact us at{" "}
            <a
              href="mailto:hello@thepunch.studio"
              className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
            >
              hello@thepunch.studio
            </a>
            .
          </p>
        </section>

        {/* Cookies */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Cookies
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            The Punch does not use tracking cookies or third-party analytics
            at this time. If we add analytics in the future, we will update
            this policy and use privacy-focused tools.
          </p>
        </section>

        {/* Changes to Policy */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Changes to this policy
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            We may update this privacy policy from time to time. When we do,
            we&apos;ll update the &quot;Last updated&quot; date at the top of this page.
            Continued use of The Punch after changes constitutes acceptance
            of the updated policy.
          </p>
        </section>

        {/* Contact */}
        <section>
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Questions
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            If you have questions about this privacy policy or how we handle
            your data, contact us at{" "}
            <a
              href="mailto:hello@thepunch.studio"
              className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
            >
              hello@thepunch.studio
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
