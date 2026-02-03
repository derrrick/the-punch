import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Sponsorship",
  description: "Partner with The Punch to reach designers, typographers, and creative professionals who care about quality typography.",
  openGraph: {
    title: "Sponsorship — The Punch",
    description: "Partner with The Punch to reach designers, typographers, and creative professionals who care about quality typography.",
    type: "website",
  },
};

export default function SponsorshipPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <div className="max-w-[680px] mx-auto px-6 md:px-12 py-32 md:py-40">
        {/* Headline */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 leading-[1.15] mb-20 md:mb-28">
          Partner with The Punch
        </h1>

        {/* What we offer */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Who we reach
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            The Punch reaches a highly engaged audience of designers,
            typographers, brand strategists, and creative professionals
            who value exceptional typography. Our visitors actively seek
            out independent foundries and care deeply about the craft
            of type design.
          </p>
        </section>

        {/* Sponsorship opportunities */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Sponsorship opportunities
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed mb-6">
            We offer several ways to connect with our community:
          </p>
          <ul className="space-y-4 text-lg md:text-xl text-neutral-700 leading-relaxed">
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Newsletter Sponsorship</strong> —
                Reach subscribers directly with a featured placement in
                The Punch Weekly.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Featured Placement</strong> —
                Highlight your product, service, or foundry on our homepage
                and directory pages.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400 mt-1">•</span>
              <span>
                <strong className="text-neutral-900">Custom Partnership</strong> —
                Let&apos;s collaborate on something unique. We&apos;re open
                to creative sponsorship ideas.
              </span>
            </li>
          </ul>
        </section>

        {/* Who should sponsor */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Who should sponsor
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            We work with type foundries, design tools, education platforms,
            creative software, and brands that align with our values of
            craftsmanship, independence, and quality. If your product or
            service serves designers and typographers, we&apos;d love to hear
            from you.
          </p>
        </section>

        {/* Contact */}
        <section>
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Get in touch
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            Interested in sponsoring The Punch?{" "}
            <a
              href="mailto:hello@thepunch.studio"
              className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
            >
              hello@thepunch.studio
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
