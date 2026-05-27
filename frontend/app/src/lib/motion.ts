import type { Variants, Transition } from "framer-motion";

export const softSpring: Transition = { type: "spring", stiffness: 210, damping: 28 };
export const tween: Transition = { duration: 0.26, ease: [0.3, 0, 0, 1] };

export const pageSlide: Variants = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0, transition: tween },
  exit: { opacity: 0, x: -24, transition: { duration: 0.18, ease: [0.3, 0, 0, 1] } },
};
export const pageRise: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: tween },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};
export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const listItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: softSpring },
};
