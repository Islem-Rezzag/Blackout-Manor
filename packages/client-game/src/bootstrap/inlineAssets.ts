const asDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const INLINE_ASSETS = {
  roomFloor: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#40362a"/>
          <stop offset="100%" stop-color="#1e1b19"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="24" fill="url(#floor)"/>
      <path d="M0 84h256M0 170h256M84 0v256M170 0v256" stroke="#8b724f" stroke-opacity="0.17" stroke-width="3"/>
    </svg>
  `),
  playerToken: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="140" viewBox="0 0 120 140">
      <ellipse cx="60" cy="128" rx="36" ry="10" fill="#000000" fill-opacity="0.35"/>
      <path d="M26 118L60 12l34 106-34 10z" fill="#efe7d2" stroke="#2f2a22" stroke-width="8" stroke-linejoin="round"/>
      <circle cx="60" cy="50" r="12" fill="#2f2a22" fill-opacity="0.2"/>
      <path d="M44 66h32" stroke="#2f2a22" stroke-opacity="0.24" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `),
  roomGlow: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <defs>
        <radialGradient id="glow">
          <stop offset="0%" stop-color="#f3c771" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#f3c771" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="110" rx="130" ry="70" fill="url(#glow)"/>
    </svg>
  `),
  clueMarker: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <radialGradient id="spark">
          <stop offset="0%" stop-color="#fff6bd"/>
          <stop offset="100%" stop-color="#f0be55"/>
        </radialGradient>
      </defs>
      <circle cx="48" cy="48" r="16" fill="url(#spark)"/>
      <circle cx="48" cy="48" r="28" fill="none" stroke="#fff3be" stroke-width="6" stroke-opacity="0.85"/>
      <circle cx="48" cy="48" r="40" fill="none" stroke="#f0be55" stroke-width="3" stroke-opacity="0.42"/>
    </svg>
  `),
  sabotageStripe: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72">
      <rect width="320" height="72" rx="14" fill="#531813"/>
      <path d="M0 56L64 -8M42 80L142 -20M122 88L222 -12M202 86L304 -14M276 88L356 8" stroke="#ef9358" stroke-width="18" stroke-opacity="0.7"/>
    </svg>
  `),
  rainSheen: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <defs>
        <linearGradient id="sheen" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="#8ac2ff" stop-opacity="0"/>
          <stop offset="50%" stop-color="#a8d4ff" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#8ac2ff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="320" height="80" rx="16" fill="url(#sheen)"/>
    </svg>
  `),
} as const;
