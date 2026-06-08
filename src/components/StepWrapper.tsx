"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ReactNode } from "react";

interface StepWrapperProps {
  stepKey: number;
  direction: number;
  children: ReactNode;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

// 3D Perspective + Glitch Slide Transitions
const variants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    rotateY: direction > 0 ? -15 : 15,
    scale: 0.9,
    filter: "blur(10px) brightness(1.5)",
  }),
  center: {
    x: 0,
    opacity: 1,
    rotateY: 0,
    scale: 1,
    filter: "blur(0px) brightness(1)",
    transition: {
      duration: 0.7,
      ease: easeOutExpo,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
    rotateY: direction > 0 ? 15 : -15,
    scale: 0.9,
    filter: "blur(10px) brightness(0.5)",
    transition: {
      duration: 0.4,
      ease: easeOutExpo,
    },
  }),
};

export const childVariants: Variants = {
  enter: { opacity: 0, x: 40, filter: "blur(4px)" },
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easeOutExpo },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export default function StepWrapper({
  stepKey,
  direction,
  children,
}: StepWrapperProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        className="step-content"
        style={{ perspective: 1000 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
