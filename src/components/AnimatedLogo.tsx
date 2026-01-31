"use client";

import { motion, Variants } from "framer-motion";

interface AnimatedLogoProps {
  className?: string;
}

export function AnimatedLogo({ className = "" }: AnimatedLogoProps) {
  // Individual square animation variants with spring physics
  const squareVariants: Variants = {
    hidden: { 
      scale: 0, 
      rotate: -180,
      opacity: 0,
    },
    visible: (i: number) => ({
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
        delay: i * 0.06,
        mass: 0.8,
      },
    }),
  };

  // Letter animation variants
  const letterVariants: Variants = {
    hidden: { 
      y: 15, 
      opacity: 0 
    },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 24,
        delay: 0.35 + i * 0.04,
      },
    }),
  };

  // Square positions (x coordinates)
  const squarePositions = [0, 102, 204, 306, 408];

  return (
    <svg
      width="494"
      height="86"
      viewBox="0 0 494 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g clipPath="url(#clip0_animated_logo)">
        {/* Animated black squares */}
        {squarePositions.map((x, i) => (
          <motion.g
            key={i}
            style={{
              transformOrigin: `${x + 43}px 43px`,
            }}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={squareVariants}
          >
            <rect
              x={x}
              width="86"
              height="86"
              fill="#171717"
            />
          </motion.g>
        ))}

        {/* Letter P */}
        <motion.path
          d="M25.752 67V16.6H46.488C49.656 16.6 52.44 17.248 54.84 18.544C57.288 19.792 59.184 21.568 60.528 23.872C61.92 26.176 62.616 28.912 62.616 32.08V33.088C62.616 36.208 61.896 38.944 60.456 41.296C59.064 43.6 57.144 45.4 54.696 46.696C52.296 47.944 49.56 48.568 46.488 48.568H35.256V67H25.752ZM35.256 39.928H45.552C47.808 39.928 49.632 39.304 51.024 38.056C52.416 36.808 53.112 35.104 53.112 32.944V32.224C53.112 30.064 52.416 28.36 51.024 27.112C49.632 25.864 47.808 25.24 45.552 25.24H35.256V39.928Z"
          fill="white"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={letterVariants}
        />

        {/* Letter U */}
        <motion.path
          d="M144.192 68.008C140.064 68.008 136.512 67.264 133.536 65.776C130.608 64.24 128.352 62.08 126.768 59.296C125.232 56.464 124.464 53.128 124.464 49.288V16.6H133.968V49.576C133.968 52.648 134.832 55.072 136.56 56.848C138.336 58.624 140.88 59.512 144.192 59.512C147.504 59.512 150.024 58.624 151.752 56.848C153.528 55.072 154.416 52.648 154.416 49.576V16.6H163.92V49.288C163.92 53.128 163.128 56.464 161.544 59.296C160.008 62.08 157.752 64.24 154.776 65.776C151.848 67.264 148.32 68.008 144.192 68.008Z"
          fill="white"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={letterVariants}
        />

        {/* Letter N */}
        <motion.path
          d="M226.752 67V16.6H244.824L254.832 60.52H256.128V16.6H265.488V67H247.416L237.408 23.08H236.112V67H226.752Z"
          fill="white"
          custom={2}
          initial="hidden"
          animate="visible"
          variants={letterVariants}
        />

        {/* Letter C */}
        <motion.path
          d="M347.904 68.008C341.664 68.008 336.72 66.28 333.072 62.824C329.424 59.32 327.6 54.328 327.6 47.848V35.752C327.6 29.272 329.424 24.304 333.072 20.848C336.72 17.344 341.664 15.592 347.904 15.592C354.096 15.592 358.872 17.296 362.232 20.704C365.64 24.064 367.344 28.696 367.344 34.6V35.032H357.984V34.312C357.984 31.336 357.144 28.888 355.464 26.968C353.832 25.048 351.312 24.088 347.904 24.088C344.544 24.088 341.904 25.12 339.984 27.184C338.064 29.248 337.104 32.056 337.104 35.608V47.992C337.104 51.496 338.064 54.304 339.984 56.416C341.904 58.48 344.544 59.512 347.904 59.512C351.312 59.512 353.832 58.552 355.464 56.632C357.144 54.664 357.984 52.216 357.984 49.288V47.992H367.344V49C367.344 54.904 365.64 59.56 362.232 62.968C358.872 66.328 354.096 68.008 347.904 68.008Z"
          fill="white"
          custom={3}
          initial="hidden"
          animate="visible"
          variants={letterVariants}
        />

        {/* Letter H */}
        <motion.path
          d="M430.752 67V16.6H440.256V37.408H458.976V16.6H468.48V67H458.976V46.048H440.256V67H430.752Z"
          fill="white"
          custom={4}
          initial="hidden"
          animate="visible"
          variants={letterVariants}
        />
      </g>
      <defs>
        <clipPath id="clip0_animated_logo">
          <rect width="494" height="86" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
