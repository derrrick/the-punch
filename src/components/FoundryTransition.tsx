"use client";

import { useRef, useEffect, useState, createContext, useContext, ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

interface TransitionContextType {
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function useFoundryTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useFoundryTransition must be used within FoundryTransitionProvider");
  }
  return context;
}

interface FoundryTransitionProviderProps {
  children: ReactNode;
}

export function FoundryTransitionProvider({ children }: FoundryTransitionProviderProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const pathname = usePathname();
  const isFoundryPage = pathname?.startsWith("/foundry/");
  const prevPathname = useRef(pathname);
  const curtainLeftRef = useRef<HTMLDivElement>(null);
  const curtainRightRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // Listen for transition trigger from FoundryCard
  useEffect(() => {
    const handleTransitionStart = () => {
      // Start transition immediately when card is clicked
      setIsTransitioning(true);
      
      // Position curtains to cover screen immediately
      gsap.set([curtainLeftRef.current, curtainRightRef.current], {
        xPercent: 0,
      });
    };

    window.addEventListener('foundryTransitionStart', handleTransitionStart);
    return () => window.removeEventListener('foundryTransitionStart', handleTransitionStart);
  }, []);

  // Handle page transitions
  useEffect(() => {
    const isNavigatingToFoundry = pathname?.startsWith("/foundry/") && !prevPathname.current?.startsWith("/foundry/");
    const isNavigatingFromFoundry = !pathname?.startsWith("/foundry/") && prevPathname.current?.startsWith("/foundry/");
    
    if (isNavigatingToFoundry) {
      // Transition TO foundry page - curtains should already be in place from click handler
      setShowContent(false);
      
      // After a brief moment, reveal content and animate
      const tl = gsap.timeline({
        onComplete: () => {
          setIsTransitioning(false);
        }
      });

      // Show content behind curtains
      tl.call(() => setShowContent(true), [], 0.1);

      // Animate curtains away
      tl.to([curtainLeftRef.current, curtainRightRef.current], {
        xPercent: (i) => i === 0 ? -100 : 100,
        duration: 0.8,
        ease: "power3.inOut",
        stagger: 0.05,
      }, 0.15);

      // Animate page elements
      tl.call(() => animateFoundryPageLoad(), [], 0.4);

    } else if (isNavigatingFromFoundry) {
      // Transition FROM foundry page back to home
      setIsTransitioning(true);
      
      const tl = gsap.timeline({
        onComplete: () => setIsTransitioning(false)
      });

      tl.set([curtainLeftRef.current, curtainRightRef.current], {
        xPercent: (i) => i === 0 ? -100 : 100,
      });

      tl.to([curtainLeftRef.current, curtainRightRef.current], {
        xPercent: 0,
        duration: 0.6,
        ease: "power3.inOut",
        stagger: 0.03,
      });
    }

    prevPathname.current = pathname;
  }, [pathname]);

  // Animate foundry page elements after transition
  const animateFoundryPageLoad = () => {
    // Animation is now handled by FoundryPageClient component
    // This function is kept for compatibility but does nothing
  };

  // Handle initial load on foundry page
  useEffect(() => {
    if (isFoundryPage && pathname === prevPathname.current) {
      // Initial page load - start with curtains closed
      setIsTransitioning(true);
      setShowContent(false);
      
      gsap.set([curtainLeftRef.current, curtainRightRef.current], {
        xPercent: 0,
      });

      // Reveal after a brief delay
      const tl = gsap.timeline({
        onComplete: () => setIsTransitioning(false)
      });

      tl.call(() => setShowContent(true), [], 0.1);
      
      tl.to([curtainLeftRef.current, curtainRightRef.current], {
        xPercent: (i) => i === 0 ? -100 : 100,
        duration: 0.8,
        ease: "power3.inOut",
        stagger: 0.05,
      }, 0.15);

      tl.call(() => animateFoundryPageLoad(), [], 0.4);
    }
  }, [isFoundryPage, pathname]);

  return (
    <TransitionContext.Provider value={{ isTransitioning }}>
      {/* Curtain transition overlays */}
      <div 
        ref={curtainLeftRef}
        className="fixed top-0 left-0 w-1/2 h-full bg-neutral-900 z-[100] pointer-events-none"
        style={{ transform: "translateX(-100%)" }}
      />
      <div 
        ref={curtainRightRef}
        className="fixed top-0 right-0 w-1/2 h-full bg-neutral-800 z-[100] pointer-events-none"
        style={{ transform: "translateX(100%)" }}
      />
      
      {/* Content wrapper - hidden during transition */}
      <div 
        ref={contentWrapperRef}
        className={!showContent ? "opacity-0" : ""}
      >
        {children}
      </div>
    </TransitionContext.Provider>
  );
}
