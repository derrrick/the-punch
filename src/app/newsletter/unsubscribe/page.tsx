"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {success === "true" ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-neutral-900 mb-4">
              Unsubscribed
            </h1>
            <p className="text-neutral-600 mb-8">
              You&apos;ve been successfully unsubscribed from The Punch Weekly.
              We&apos;re sorry to see you go!
            </p>
            <Link
              href="/"
              className="inline-block bg-neutral-900 text-white px-8 py-3 text-sm uppercase tracking-[0.1em] hover:bg-neutral-800 transition-colors"
            >
              Back to Home
            </Link>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-600"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-neutral-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-neutral-600 mb-8">
              We couldn&apos;t process your unsubscribe request. The link may have
              expired or is invalid. Please try again or contact us directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@thepunch.xyz"
                className="inline-block bg-neutral-200 text-neutral-700 px-8 py-3 text-sm uppercase tracking-[0.1em] hover:bg-neutral-300 transition-colors"
              >
                Contact Support
              </a>
              <Link
                href="/"
                className="inline-block bg-neutral-900 text-white px-8 py-3 text-sm uppercase tracking-[0.1em] hover:bg-neutral-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-600"
              >
                <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
                <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
              </svg>
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-neutral-900 mb-4">
              Newsletter
            </h1>
            <p className="text-neutral-600 mb-8">
              Manage your subscription preferences
            </p>
            <Link
              href="/"
              className="inline-block bg-neutral-900 text-white px-8 py-3 text-sm uppercase tracking-[0.1em] hover:bg-neutral-800 transition-colors"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="animate-pulse text-neutral-400">Loading...</div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
