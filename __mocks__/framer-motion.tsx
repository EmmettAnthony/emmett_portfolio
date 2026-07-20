// ──────────────────────────────────────────────────────────────────────────────
// Framer Motion Shared Test Mock
// ──────────────────────────────────────────────────────────────────────────────
// This mock replaces framer-motion in tests. Motion components (motion.div,
// motion.button, etc.) strip framer-motion-only props (whileInView, whileHover,
// whileTap, animate, initial, etc.) before passing them to DOM elements,
// preventing React "unrecognized prop" warnings.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { vi } from "vitest";

// ─── Known framer-motion-only props (not valid DOM attributes) ───────────────

const MOTION_ONLY_PROPS = new Set([
  // Viewport / scroll
  "whileInView",
  "viewport",
  "once",
  "amount",
  // Interaction
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whilePan",
  // Animation lifecycle
  "initial",
  "animate",
  "exit",
  "variants",
  "transition",
  "keyframes",
  // Layout animations
  "layout",
  "layoutId",
  "layoutDependency",
  "layoutScroll",
  "layoutRoot",
  "animateAs",
  // Events
  "onAnimationStart",
  "onAnimationComplete",
  "onLayoutAnimationStart",
  "onLayoutAnimationComplete",
  "onDragStart",
  "onDrag",
  "onDragEnd",
  "onHoverStart",
  "onHoverEnd",
  "onTap",
  "onTapStart",
  "onTapCancel",
  "onPan",
  "onPanStart",
  "onPanEnd",
  "onViewportEnter",
  "onViewportLeave",
  "onFocus",
  "onBlur",
  // Drag
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "dragPropagation",
  "dragSnapToOrigin",
  "dragTransition",
  "onDirectionLock",
  // Gesture
  "whileInView",
  "whileFocus",
  "whileHover",
  "whileTap",
  "whileDrag",
  "whilePan",
  // Other
  "custom",
  "inherit",
  "static",
  "style",
]);

// Remove 'style' from the set because it's a valid DOM attribute
MOTION_ONLY_PROPS.delete("style");
// Remove 'onFocus' and 'onBlur' since those ARE valid DOM event handlers
MOTION_ONLY_PROPS.delete("onFocus");
MOTION_ONLY_PROPS.delete("onBlur");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripMotionProps<P extends Record<string, unknown>>(
  props: P,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) {
      sanitized[key] = props[key];
    }
  }
  return sanitized;
}

type HTMLElementTag = keyof HTMLElementTagNameMap;

const motionCache = new Map<HTMLElementTag, React.FC<Record<string, unknown>>>();

function createMotionComponent(tag: HTMLElementTag): React.FC<Record<string, unknown>> {
  const Comp: React.FC<Record<string, unknown>> = ({ children, ...props }) => {
    return React.createElement(tag, stripMotionProps(props), children as React.ReactNode);
  };
  Comp.displayName = `motion.${tag}`;
  return Comp;
}

// ─── Motion element proxy ────────────────────────────────────────────────────

export const motion = new Proxy(
  {},
  {
    get(_target, tag: string) {
      const htmlTag = tag as HTMLElementTag;
      if (!motionCache.has(htmlTag)) {
        motionCache.set(htmlTag, createMotionComponent(htmlTag));
      }
      return motionCache.get(htmlTag)!;
    },
  },
) as Record<HTMLElementTag, React.FC<Record<string, unknown>>>;

// ─── Common exports ──────────────────────────────────────────────────────────

export const AnimatePresence: React.FC<{
  children?: React.ReactNode;
  mode?: "wait" | "sync" | "popLayout";
  initial?: boolean;
  onExitComplete?: () => void;
}> = ({ children }) => <>{children}</>;
AnimatePresence.displayName = "AnimatePresence";

export const useReducedMotion = vi.fn(() => false);

export const useInView = vi.fn(() => true);

export const useMotionValue = (initial: number) => ({
  get: () => initial,
  set: () => {},
  onChange: () => {},
});

export const useSpring = (value: number) => ({
  get: () => value,
  set: () => {},
  onChange: () => {},
});

export const useTransform = (value: number) => value;

export const useScroll = () => ({
  scrollY: { get: () => 0, onChange: () => {} },
  scrollX: { get: () => 0, onChange: () => {} },
  scrollYProgress: { get: () => 0, onChange: () => {}, set: () => {} },
  scrollXProgress: { get: () => 0, onChange: () => {}, set: () => {} },
});

export const useAnimation = () => ({
  start: async () => {},
  stop: () => {},
  set: () => {},
});

export const isValidMotionProp = (key: string): boolean => {
  return MOTION_ONLY_PROPS.has(key);
};

// Re-export domMax and domAnimation as no-ops
export const domMax = {};
export const domAnimation = {};
export const LazyMotion: React.FC<{
  children: React.ReactNode;
  features: () => void;
  strict?: boolean;
}> = ({ children }) => <>{children}</>;
LazyMotion.displayName = "LazyMotion";

export default motion;
