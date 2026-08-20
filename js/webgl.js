export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function capDpr() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

export async function loadThree() {
  if (!hasWebGL()) return null;
  return import("../vendor/three.module.min.js");
}
