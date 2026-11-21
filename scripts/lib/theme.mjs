export const SANS = `system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
export const MONO = `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;

// Surfaces match GitHub's light and dark canvases so the cards sit flush on the profile page.
export const themes = {
  light: {
    name: "light",
    surface: "#ffffff",
    ring: "rgba(11,11,11,0.10)",
    ink: "#0b0b0b",
    ink2: "#52514e",
    muted: "#898781",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    series: "#2a78d6",
    up: "#006300",
    scale: ["#e1e0d9", "#6da7ec", "#3987e5", "#256abf", "#184f95"],
    sideLeft: 0.86,
    sideFront: 0.72,
  },
  dark: {
    name: "dark",
    surface: "#0d1117",
    ring: "rgba(255,255,255,0.10)",
    ink: "#f0efec",
    ink2: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    axis: "#383835",
    series: "#3987e5",
    up: "#0ca30c",
    scale: ["#2c2c2a", "#184f95", "#256abf", "#3987e5", "#6da7ec"],
    sideLeft: 0.78,
    sideFront: 0.6,
  },
};

export const MOTION = `@keyframes fade{from{opacity:0;transform:translateY(4px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
