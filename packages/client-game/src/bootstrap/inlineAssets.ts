import { MANOR_INLINE_ENVIRONMENT_ASSETS } from "./inlineEnvironmentArt";

const asDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const INLINE_ASSETS = {
  roomShell: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <defs>
        <linearGradient id="shell" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#28343d"/>
          <stop offset="100%" stop-color="#11181f"/>
        </linearGradient>
      </defs>
      <rect x="8" y="10" width="304" height="200" rx="30" fill="url(#shell)"/>
      <rect x="16" y="18" width="288" height="184" rx="24" fill="none" stroke="#6a8ba2" stroke-opacity="0.22" stroke-width="3"/>
    </svg>
  `),
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
  roomVignette: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="100%" stop-color="#040608" stop-opacity="0.82"/>
        </radialGradient>
      </defs>
      <rect width="320" height="220" rx="26" fill="url(#vignette)"/>
    </svg>
  `),
  roomDust: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <g fill="#ffffff" fill-opacity="0.12">
        <circle cx="54" cy="42" r="2"/><circle cx="112" cy="78" r="1.5"/><circle cx="174" cy="60" r="1.8"/>
        <circle cx="248" cy="92" r="1.6"/><circle cx="280" cy="44" r="1.4"/><circle cx="72" cy="136" r="1.7"/>
        <circle cx="126" cy="164" r="1.3"/><circle cx="208" cy="146" r="1.9"/><circle cx="262" cy="168" r="1.5"/>
      </g>
    </svg>
  `),
  roomSpecular: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <defs>
        <linearGradient id="spec" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
          <stop offset="40%" stop-color="#ffffff" stop-opacity="0.02"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="18" y="18" width="284" height="184" rx="24" fill="url(#spec)"/>
    </svg>
  `),
  roomWall: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">
      <defs>
        <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6a7681"/>
          <stop offset="100%" stop-color="#353f49"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" rx="18" fill="url(#wall)"/>
      <path d="M0 28h320M0 60h320M0 92h320" stroke="#dbe4ed" stroke-opacity="0.08" stroke-width="2"/>
    </svg>
  `),
  roomShadow: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="340" height="240" viewBox="0 0 340 240">
      <defs>
        <radialGradient id="shadow" cx="50%" cy="62%" r="54%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="170" cy="156" rx="156" ry="88" fill="url(#shadow)"/>
    </svg>
  `),
  focusBeam: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="260" viewBox="0 0 360 260">
      <defs>
        <radialGradient id="focus" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stop-color="#f2dd9c" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#f2dd9c" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="180" cy="130" rx="154" ry="102" fill="url(#focus)"/>
    </svg>
  `),
  signalPulse: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="26" fill="#ffffff" fill-opacity="0.22"/>
      <circle cx="80" cy="80" r="44" fill="none" stroke="#ffffff" stroke-opacity="0.42" stroke-width="6"/>
      <circle cx="80" cy="80" r="64" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="4"/>
    </svg>
  `),
  stormCloud: asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="150" viewBox="0 0 420 150">
      <defs>
        <linearGradient id="cloud" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#8bb4dc" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#284e73" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="64" rx="96" ry="48" fill="url(#cloud)"/>
      <ellipse cx="208" cy="58" rx="112" ry="56" fill="url(#cloud)"/>
      <ellipse cx="310" cy="72" rx="94" ry="44" fill="url(#cloud)"/>
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
  ...MANOR_INLINE_ENVIRONMENT_ASSETS,
} as const;
