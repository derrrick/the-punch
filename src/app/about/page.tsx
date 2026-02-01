import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about The Punch — a curated directory of independent type foundries. Discover why knowing your sources matters in typography.",
  openGraph: {
    title: "About — The Punch",
    description: "Learn about The Punch — a curated directory of independent type foundries. Discover why knowing your sources matters in typography.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[680px] mx-auto px-6 md:px-12 py-32 md:py-40">
        {/* Headline */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 leading-[1.15] mb-20 md:mb-28">
          Typography, organized by the experts who made them.
        </h1>

        {/* What this site is */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            What this is
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
          A punch is the steel tool used to cut an original letterform — the first physical act of making a typeface. We built this site to help punch back at an industry that wants to buy them, bundle them, and resell their work at a margin.
          <br />
          <br />
          This website is a curated directory of independent type foundries. 
            No algorithms, no affiliate links — just a hand-selected collection 
            of studios crafting exceptional typography.
          </p>
        </section>

        {/* Why foundry-first matters */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Why foundry-first matters
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            Foundries are the record labels of typography — understanding 
            who makes the fonts helps you understand the aesthetic DNA 
            behind the work. Each studio has a point of view, a philosophy, 
            a sensibility that runs through everything they release.
          </p>
        </section>

        {/* Who made it */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Who made this
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
          A growing collective of designers, typographers, and type nerds who believe you should know exactly who made the fonts you buy, and that your money should go directly to them.
          </p>
          <br />
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            Want to join us? We're always looking for new members to help contribute to the site.{" "}
            <a 
              href="mailto:hello@thepunch.studio" 
              className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
            >
              hello@thepunch.studio
            </a>
          </p>
        </section>

        {/* How to contribute */}
        <section className="mb-16 md:mb-24">
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            How to contribute
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            Know a foundry that belongs here?{" "}
            <Link 
              href="/submit" 
              className="text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
            >
              Submit it
            </Link>
            . We&apos;re always looking for studios doing exceptional work
            — whether they&apos;ve been around for decades or just launched last month.
          </p>
        </section>

        {/* Contact */}
        <section>
          <p className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            Get in touch
          </p>
          <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
            Questions, feedback, or just want to say hello?{" "}
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
