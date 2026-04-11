const asDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const surfaceAsset = (width: number, height: number, body: string) =>
  asDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${body}
    </svg>
  `);

const SOCIAL_ROOM_SURFACE_ASSETS = {
  floorGrandHall: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="hall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5a3a25"/>
          <stop offset="100%" stop-color="#1a120e"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#hall)"/>
      <path d="M0 64h256M0 128h256M0 192h256" stroke="#8e6540" stroke-opacity="0.22" stroke-width="4"/>
      <path d="M32 0v256M80 0v256M128 0v256M176 0v256M224 0v256" stroke="#d4ab77" stroke-opacity="0.12" stroke-width="3"/>
      <rect x="14" y="14" width="228" height="228" fill="none" stroke="#d9bf90" stroke-opacity="0.16" stroke-width="5"/>
      <circle cx="128" cy="148" r="54" fill="#362317" fill-opacity="0.72" stroke="#d5c08f" stroke-opacity="0.6" stroke-width="5"/>
      <circle cx="128" cy="148" r="32" fill="none" stroke="#f5e6bf" stroke-opacity="0.44" stroke-width="4"/>
      <path d="M128 96l14 40 42 12-42 12-14 40-14-40-42-12 42-12z" fill="#f0dfb5" fill-opacity="0.74"/>
      <path d="M128 110l8 26 26 12-26 10-8 28-8-28-26-10 26-12z" fill="#784b2d"/>
    `,
  ),
  floorLibrary: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="library" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#4e3422"/>
          <stop offset="100%" stop-color="#18110e"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#library)"/>
      <path d="M0 52h256M0 104h256M0 156h256M0 208h256" stroke="#7f5738" stroke-opacity="0.22" stroke-width="3"/>
      <path d="M28 0v256M76 0v256M124 0v256M172 0v256M220 0v256" stroke="#c89d66" stroke-opacity="0.1" stroke-width="2"/>
      <ellipse cx="150" cy="152" rx="68" ry="42" fill="#222018" stroke="#c7aa72" stroke-opacity="0.4" stroke-width="4"/>
      <ellipse cx="150" cy="152" rx="48" ry="28" fill="none" stroke="#dfc693" stroke-opacity="0.3" stroke-width="3"/>
      <rect x="18" y="18" width="220" height="220" fill="none" stroke="#d7c09b" stroke-opacity="0.14" stroke-width="4"/>
    `,
  ),
  floorStudy: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="study" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#453126"/>
          <stop offset="100%" stop-color="#16110d"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#study)"/>
      <path d="M0 48h256M0 96h256M0 144h256M0 192h256" stroke="#785338" stroke-opacity="0.22" stroke-width="3"/>
      <path d="M24 0v256M72 0v256M120 0v256M168 0v256M216 0v256" stroke="#bd9761" stroke-opacity="0.12" stroke-width="2"/>
      <rect x="54" y="92" width="148" height="96" rx="10" fill="#33472e" fill-opacity="0.8" stroke="#ceb07b" stroke-opacity="0.44" stroke-width="4"/>
      <rect x="74" y="112" width="108" height="56" rx="6" fill="none" stroke="#f0dfbd" stroke-opacity="0.18" stroke-width="3"/>
    `,
  ),
  floorBallroom: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="ballroom" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6f452a"/>
          <stop offset="100%" stop-color="#20120d"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#ballroom)"/>
      <path d="M0 42h256M0 84h256M0 126h256M0 168h256M0 210h256" stroke="#8f6038" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M42 0v256M84 0v256M126 0v256M168 0v256M210 0v256" stroke="#deb684" stroke-opacity="0.1" stroke-width="2"/>
      <rect x="26" y="26" width="204" height="204" fill="none" stroke="#e6c99a" stroke-opacity="0.16" stroke-width="4"/>
      <rect x="68" y="72" width="120" height="112" rx="12" fill="#2d1a18" fill-opacity="0.54" stroke="#c79d75" stroke-opacity="0.48" stroke-width="4"/>
      <path d="M88 92l80 72M168 92l-80 72" stroke="#f3dfbc" stroke-opacity="0.22" stroke-width="4"/>
      <ellipse cx="128" cy="132" rx="72" ry="42" fill="#f1d1ac" fill-opacity="0.08"/>
    `,
  ),
  floorGallery: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="gallery" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#4f3727"/>
          <stop offset="100%" stop-color="#18100d"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#gallery)"/>
      <path d="M0 48h256M0 96h256M0 144h256M0 192h256" stroke="#82583b" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M32 0v256M80 0v256M128 0v256M176 0v256M224 0v256" stroke="#d0a874" stroke-opacity="0.12" stroke-width="2"/>
      <rect x="56" y="30" width="144" height="196" rx="12" fill="#411d18" fill-opacity="0.58" stroke="#dbbf94" stroke-opacity="0.34" stroke-width="4"/>
      <path d="M76 58h104M76 198h104" stroke="#f4dfb5" stroke-opacity="0.24" stroke-width="4"/>
    `,
  ),
  wallGrandHall: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="grandWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#7d5535"/>
          <stop offset="100%" stop-color="#2a1b14"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#grandWall)"/>
      <rect x="0" y="0" width="320" height="14" fill="#120d0a"/>
      <path d="M16 20h288" stroke="#e4c693" stroke-opacity="0.24" stroke-width="4"/>
      <rect x="18" y="26" width="82" height="66" fill="none" stroke="#e0c497" stroke-opacity="0.24" stroke-width="3"/>
      <rect x="118" y="22" width="84" height="72" fill="none" stroke="#f0ddbd" stroke-opacity="0.2" stroke-width="3"/>
      <rect x="218" y="26" width="82" height="66" fill="none" stroke="#e0c497" stroke-opacity="0.24" stroke-width="3"/>
      <path d="M0 100h320" stroke="#050608" stroke-opacity="0.62" stroke-width="12"/>
    `,
  ),
  wallLibrary: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="libraryWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5b3b28"/>
          <stop offset="100%" stop-color="#211510"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#libraryWall)"/>
      <rect x="0" y="0" width="320" height="12" fill="#0c0907"/>
      <path d="M24 22h272" stroke="#d7be8f" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M42 28v58M106 28v58M170 28v58M234 28v58M288 28v58" stroke="#2b1a12" stroke-opacity="0.82" stroke-width="10"/>
      <path d="M20 42h280M20 66h280" stroke="#e0d0b0" stroke-opacity="0.1" stroke-width="3"/>
      <rect x="136" y="24" width="48" height="42" fill="#c7a670" fill-opacity="0.16" stroke="#f0deb9" stroke-opacity="0.2" stroke-width="2"/>
      <path d="M0 100h320" stroke="#050608" stroke-opacity="0.62" stroke-width="12"/>
    `,
  ),
  wallStudy: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="studyWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#52613f"/>
          <stop offset="100%" stop-color="#1d2316"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#studyWall)"/>
      <rect x="0" y="0" width="320" height="12" fill="#0e0b08"/>
      <path d="M18 18h284" stroke="#dfc58f" stroke-opacity="0.16" stroke-width="3"/>
      <rect x="20" y="24" width="86" height="60" fill="none" stroke="#f0dfba" stroke-opacity="0.16" stroke-width="3"/>
      <rect x="116" y="24" width="92" height="60" fill="none" stroke="#f0dfba" stroke-opacity="0.1" stroke-width="3"/>
      <rect x="218" y="24" width="82" height="60" fill="none" stroke="#f0dfba" stroke-opacity="0.16" stroke-width="3"/>
      <path d="M0 100h320" stroke="#06080a" stroke-opacity="0.62" stroke-width="12"/>
    `,
  ),
  wallBallroom: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="ballroomWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6a2c2a"/>
          <stop offset="100%" stop-color="#250f10"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#ballroomWall)"/>
      <rect x="0" y="0" width="320" height="12" fill="#12070a"/>
      <path d="M20 14c18 24 18 68 0 92M84 14c18 24 18 68 0 92M148 14c18 24 18 68 0 92M212 14c18 24 18 68 0 92M276 14c18 24 18 68 0 92" stroke="#e9b67c" stroke-opacity="0.12" stroke-width="18"/>
      <path d="M0 100h320" stroke="#09080c" stroke-opacity="0.7" stroke-width="12"/>
    `,
  ),
} as const;

const VERTICAL_SLICE_SURFACE_ASSETS = {
  floorGrandHallPremium: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="grandHallPremiumFloor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6a4429"/>
          <stop offset="100%" stop-color="#1f1410"/>
        </linearGradient>
        <linearGradient id="grandHallRunner" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#7e1e2a"/>
          <stop offset="100%" stop-color="#421019"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#grandHallPremiumFloor)"/>
      <path d="M0 40h256M0 80h256M0 120h256M0 160h256M0 200h256" stroke="#9a6942" stroke-opacity="0.16" stroke-width="3"/>
      <path d="M32 0v256M64 0v256M96 0v256M128 0v256M160 0v256M192 0v256M224 0v256" stroke="#d8ab71" stroke-opacity="0.12" stroke-width="2"/>
      <rect x="16" y="16" width="224" height="224" fill="none" stroke="#f2ddb4" stroke-opacity="0.18" stroke-width="5"/>
      <rect x="74" y="24" width="108" height="208" rx="20" fill="url(#grandHallRunner)" stroke="#efcf96" stroke-opacity="0.46" stroke-width="5"/>
      <path d="M86 54h84M86 202h84" stroke="#f7e5c2" stroke-opacity="0.24" stroke-width="4"/>
      <rect x="92" y="92" width="72" height="72" rx="24" fill="#251515" fill-opacity="0.52" stroke="#f0d6a3" stroke-opacity="0.42" stroke-width="4"/>
      <path d="M128 102l10 24 26 8-26 8-10 24-10-24-26-8 26-8z" fill="#ead19f" fill-opacity="0.7"/>
      <ellipse cx="128" cy="132" rx="60" ry="34" fill="#100c0b" fill-opacity="0.24"/>
    `,
  ),
  wallGrandHallPremium: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="grandHallPremiumWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#8d5d38"/>
          <stop offset="100%" stop-color="#2d1c14"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#grandHallPremiumWall)"/>
      <rect x="0" y="0" width="320" height="14" fill="#110d0b"/>
      <path d="M18 18h284" stroke="#e8cb95" stroke-opacity="0.22" stroke-width="4"/>
      <path d="M34 18v72M286 18v72" stroke="#2a150f" stroke-opacity="0.8" stroke-width="12"/>
      <path d="M96 18c20 18 20 56 0 74M224 18c20 18 20 56 0 74" stroke="#efcf96" stroke-opacity="0.18" stroke-width="18"/>
      <rect x="38" y="28" width="62" height="54" fill="none" stroke="#e9d1a8" stroke-opacity="0.18" stroke-width="3"/>
      <rect x="112" y="22" width="96" height="66" rx="10" fill="#56311f" fill-opacity="0.54" stroke="#f2dfbd" stroke-opacity="0.24" stroke-width="3"/>
      <path d="M160 30c18 14 22 34 22 50h-44c0-16 4-36 22-50z" fill="#281510" fill-opacity="0.64"/>
      <circle cx="160" cy="46" r="12" fill="#d8b985" fill-opacity="0.36"/>
      <rect x="220" y="28" width="62" height="54" fill="none" stroke="#e9d1a8" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M0 100h320" stroke="#050608" stroke-opacity="0.68" stroke-width="12"/>
    `,
  ),
  floorLibraryPremium: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="libraryPremiumFloor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#4f3422"/>
          <stop offset="100%" stop-color="#18110e"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#libraryPremiumFloor)"/>
      <path d="M0 36h256M0 72h256M0 108h256M0 144h256M0 180h256M0 216h256" stroke="#7a5438" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M36 0v256M72 0v256M108 0v256M144 0v256M180 0v256M216 0v256" stroke="#c89962" stroke-opacity="0.1" stroke-width="2"/>
      <rect x="18" y="18" width="220" height="220" fill="none" stroke="#e0ca9e" stroke-opacity="0.16" stroke-width="4"/>
      <rect x="28" y="48" width="104" height="156" rx="18" fill="#2e241b" fill-opacity="0.48" stroke="#ccb07d" stroke-opacity="0.38" stroke-width="4"/>
      <rect x="140" y="88" width="88" height="96" rx="16" fill="#3d1f18" fill-opacity="0.56" stroke="#e0c497" stroke-opacity="0.28" stroke-width="4"/>
      <path d="M54 74h52M54 178h52" stroke="#f2deb6" stroke-opacity="0.2" stroke-width="4"/>
      <ellipse cx="182" cy="136" rx="42" ry="26" fill="#191211" fill-opacity="0.34"/>
    `,
  ),
  wallLibraryPremium: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="libraryPremiumWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#614029"/>
          <stop offset="100%" stop-color="#231611"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#libraryPremiumWall)"/>
      <rect x="0" y="0" width="320" height="12" fill="#0c0907"/>
      <path d="M24 18h272" stroke="#dec89b" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M42 22v68M106 22v68M214 22v68M278 22v68" stroke="#281810" stroke-opacity="0.82" stroke-width="12"/>
      <path d="M26 48h82M212 48h82" stroke="#f3dfbc" stroke-opacity="0.12" stroke-width="18"/>
      <path d="M26 72h82M212 72h82" stroke="#f3dfbc" stroke-opacity="0.08" stroke-width="18"/>
      <rect x="122" y="24" width="76" height="58" rx="10" fill="#352219" stroke="#f2deb8" stroke-opacity="0.22" stroke-width="3"/>
      <path d="M160 32c14 10 18 28 18 42h-36c0-14 4-32 18-42z" fill="#d7bb87" fill-opacity="0.2"/>
      <path d="M0 100h320" stroke="#050608" stroke-opacity="0.62" stroke-width="12"/>
    `,
  ),
  floorMeetingWing: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="meetingWingFloor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#563722"/>
          <stop offset="100%" stop-color="#1a110d"/>
        </linearGradient>
        <linearGradient id="meetingWingRunner" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6d1b24"/>
          <stop offset="100%" stop-color="#381018"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#meetingWingFloor)"/>
      <path d="M0 40h256M0 80h256M0 120h256M0 160h256M0 200h256" stroke="#86573a" stroke-opacity="0.16" stroke-width="3"/>
      <path d="M40 0v256M88 0v256M136 0v256M184 0v256" stroke="#d4aa72" stroke-opacity="0.08" stroke-width="3"/>
      <rect x="92" y="12" width="72" height="232" rx="16" fill="url(#meetingWingRunner)" stroke="#edc98f" stroke-opacity="0.42" stroke-width="4"/>
      <path d="M102 44h52M102 212h52" stroke="#f7e4bf" stroke-opacity="0.2" stroke-width="3"/>
      <path d="M28 122h40M188 122h40" stroke="#f0d39f" stroke-opacity="0.16" stroke-width="6" stroke-linecap="round"/>
      <rect x="18" y="18" width="220" height="220" fill="none" stroke="#e5cfa2" stroke-opacity="0.12" stroke-width="4"/>
    `,
  ),
} as const;

const SERVICE_ROOM_SURFACE_ASSETS = {
  floorKitchen: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="kitchen" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#8a4d2e"/>
          <stop offset="100%" stop-color="#3d2418"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#kitchen)"/>
      <path d="M0 32h256M0 64h256M0 96h256M0 128h256M0 160h256M0 192h256M0 224h256" stroke="#efcda5" stroke-opacity="0.16" stroke-width="2"/>
      <path d="M32 0v256M64 0v256M96 0v256M128 0v256M160 0v256M192 0v256M224 0v256" stroke="#ffedce" stroke-opacity="0.18" stroke-width="2"/>
      <rect x="28" y="28" width="200" height="200" fill="none" stroke="#efdec0" stroke-opacity="0.14" stroke-width="4"/>
      <rect x="84" y="144" width="88" height="56" rx="12" fill="#f4efe6" fill-opacity="0.2" stroke="#e0c495" stroke-opacity="0.26" stroke-width="4"/>
    `,
  ),
  floorGreenhouse: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="greenhouse" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#31503d"/>
          <stop offset="100%" stop-color="#14261b"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#greenhouse)"/>
      <path d="M0 40h256M0 88h256M0 136h256M0 184h256" stroke="#a2b99d" stroke-opacity="0.16" stroke-width="3"/>
      <path d="M40 0v256M88 0v256M136 0v256M184 0v256" stroke="#d3e5d1" stroke-opacity="0.16" stroke-width="3"/>
      <rect x="22" y="22" width="212" height="212" fill="none" stroke="#d9edd7" stroke-opacity="0.12" stroke-width="4"/>
      <rect x="34" y="70" width="70" height="132" fill="#395a33" fill-opacity="0.64" stroke="#c7dcbf" stroke-opacity="0.2" stroke-width="3"/>
      <rect x="152" y="70" width="70" height="132" fill="#395a33" fill-opacity="0.64" stroke="#c7dcbf" stroke-opacity="0.2" stroke-width="3"/>
      <rect x="112" y="46" width="32" height="164" fill="#78857c" fill-opacity="0.24"/>
    `,
  ),
  floorSurveillanceHall: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="surveillance" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#2d3237"/>
          <stop offset="100%" stop-color="#12171c"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#surveillance)"/>
      <path d="M0 42h256M0 84h256M0 126h256M0 168h256M0 210h256" stroke="#7fa1b2" stroke-opacity="0.1" stroke-width="2"/>
      <path d="M42 0v256M84 0v256M126 0v256M168 0v256M210 0v256" stroke="#a7d6ee" stroke-opacity="0.08" stroke-width="2"/>
      <rect x="20" y="20" width="216" height="216" fill="none" stroke="#d3c9ac" stroke-opacity="0.08" stroke-width="4"/>
      <path d="M36 198h184" stroke="#86d0e8" stroke-opacity="0.2" stroke-width="6" stroke-linecap="round"/>
      <path d="M58 62h140" stroke="#86d0e8" stroke-opacity="0.12" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  floorGeneratorRoom: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="generator" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#47474f"/>
          <stop offset="100%" stop-color="#16171d"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#generator)"/>
      <path d="M0 52h256M0 104h256M0 156h256M0 208h256" stroke="#8d8d98" stroke-opacity="0.16" stroke-width="3"/>
      <path d="M52 0v256M104 0v256M156 0v256M208 0v256" stroke="#c2c5cf" stroke-opacity="0.08" stroke-width="3"/>
      <rect x="20" y="20" width="216" height="216" fill="none" stroke="#f0d091" stroke-opacity="0.1" stroke-width="4"/>
      <path d="M44 212h72M140 212h72" stroke="#f1b16b" stroke-opacity="0.4" stroke-width="8" stroke-linecap="round"/>
      <path d="M78 148c16-14 28-22 52-22s36 8 48 22" fill="none" stroke="#73db8a" stroke-opacity="0.26" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  floorCellar: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="cellar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#534b43"/>
          <stop offset="100%" stop-color="#1d1a17"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#cellar)"/>
      <path d="M0 48h256M0 96h256M0 144h256M0 192h256" stroke="#9c9080" stroke-opacity="0.15" stroke-width="3"/>
      <path d="M38 0v256M86 0v256M134 0v256M182 0v256M230 0v256" stroke="#c1b39d" stroke-opacity="0.08" stroke-width="2"/>
      <rect x="24" y="24" width="208" height="208" fill="none" stroke="#d1c1a9" stroke-opacity="0.1" stroke-width="4"/>
      <path d="M62 172h132" stroke="#2a2420" stroke-opacity="0.72" stroke-width="18" stroke-linecap="round"/>
      <path d="M72 172h112" stroke="#544b42" stroke-opacity="0.56" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  floorServiceCorridor: surfaceAsset(
    256,
    256,
    `
      <defs>
        <linearGradient id="service" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#61554a"/>
          <stop offset="100%" stop-color="#1b1816"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#service)"/>
      <path d="M0 44h256M0 88h256M0 132h256M0 176h256M0 220h256" stroke="#b1a28f" stroke-opacity="0.14" stroke-width="3"/>
      <path d="M44 0v256M88 0v256M132 0v256M176 0v256M220 0v256" stroke="#d7cdbd" stroke-opacity="0.08" stroke-width="2"/>
      <path d="M54 196h148" stroke="#4b3c30" stroke-opacity="0.6" stroke-width="14" stroke-linecap="round"/>
    `,
  ),
  wallKitchen: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="kitchenWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#d9c7b0"/>
          <stop offset="100%" stop-color="#82705e"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#kitchenWall)"/>
      <path d="M0 24h320M0 48h320M0 72h320" stroke="#f9efe0" stroke-opacity="0.28" stroke-width="2"/>
      <path d="M40 0v96M92 0v96M144 0v96M196 0v96M248 0v96M300 0v96" stroke="#f5e7d1" stroke-opacity="0.22" stroke-width="2"/>
      <rect x="24" y="18" width="272" height="10" rx="5" fill="#c79d68" fill-opacity="0.28"/>
      <path d="M0 100h320" stroke="#342b25" stroke-opacity="0.46" stroke-width="12"/>
    `,
  ),
  wallGreenhouse: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="greenWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5a7269"/>
          <stop offset="100%" stop-color="#22352f"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#greenWall)"/>
      <path d="M0 18h320M0 52h320M0 86h320" stroke="#d7eee3" stroke-opacity="0.22" stroke-width="3"/>
      <path d="M42 0v120M106 0v120M170 0v120M234 0v120M298 0v120" stroke="#e1f3eb" stroke-opacity="0.24" stroke-width="3"/>
      <path d="M0 100h320" stroke="#08110d" stroke-opacity="0.54" stroke-width="12"/>
    `,
  ),
  wallSurveillanceHall: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="survWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#394048"/>
          <stop offset="100%" stop-color="#161a20"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#survWall)"/>
      <rect x="18" y="18" width="284" height="50" fill="#0c1116" stroke="#7dd3ea" stroke-opacity="0.14" stroke-width="3"/>
      <rect x="34" y="30" width="48" height="24" fill="#84cbe3" fill-opacity="0.22"/>
      <rect x="96" y="30" width="48" height="24" fill="#84cbe3" fill-opacity="0.14"/>
      <rect x="158" y="30" width="48" height="24" fill="#84cbe3" fill-opacity="0.18"/>
      <rect x="220" y="30" width="48" height="24" fill="#84cbe3" fill-opacity="0.14"/>
      <path d="M0 100h320" stroke="#06080b" stroke-opacity="0.62" stroke-width="12"/>
    `,
  ),
  wallGeneratorRoom: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="genWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5a5d63"/>
          <stop offset="100%" stop-color="#1c1d22"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#genWall)"/>
      <path d="M0 18h320" stroke="#8d9199" stroke-opacity="0.34" stroke-width="3"/>
      <path d="M40 0v100M104 0v100M168 0v100M232 0v100M296 0v100" stroke="#d7d9df" stroke-opacity="0.08" stroke-width="3"/>
      <path d="M22 78h276" stroke="#f0b266" stroke-opacity="0.18" stroke-width="10" stroke-linecap="round"/>
      <path d="M0 100h320" stroke="#07090b" stroke-opacity="0.62" stroke-width="12"/>
    `,
  ),
  wallCellar: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="cellarWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#686158"/>
          <stop offset="100%" stop-color="#2a2520"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#cellarWall)"/>
      <path d="M0 24h320M0 48h320M0 72h320" stroke="#b7ab99" stroke-opacity="0.14" stroke-width="2"/>
      <path d="M38 0v96M86 0v96M134 0v96M182 0v96M230 0v96M278 0v96" stroke="#d4c5af" stroke-opacity="0.08" stroke-width="2"/>
      <path d="M36 34h248" stroke="#382f29" stroke-opacity="0.68" stroke-width="12" stroke-linecap="round"/>
      <path d="M0 100h320" stroke="#090a0b" stroke-opacity="0.62" stroke-width="12"/>
    `,
  ),
  wallServiceCorridor: surfaceAsset(
    320,
    120,
    `
      <defs>
        <linearGradient id="serviceWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#72695f"/>
          <stop offset="100%" stop-color="#2c2824"/>
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#serviceWall)"/>
      <rect x="18" y="24" width="88" height="56" fill="none" stroke="#d8ccb8" stroke-opacity="0.14" stroke-width="3"/>
      <rect x="118" y="24" width="88" height="56" fill="none" stroke="#d8ccb8" stroke-opacity="0.12" stroke-width="3"/>
      <rect x="218" y="24" width="84" height="56" fill="none" stroke="#d8ccb8" stroke-opacity="0.14" stroke-width="3"/>
      <path d="M0 100h320" stroke="#08090a" stroke-opacity="0.56" stroke-width="12"/>
    `,
  ),
} as const;

export const INLINE_ROOM_SURFACE_ASSETS = {
  ...SOCIAL_ROOM_SURFACE_ASSETS,
  ...VERTICAL_SLICE_SURFACE_ASSETS,
  ...SERVICE_ROOM_SURFACE_ASSETS,
} as const;

const THRESHOLD_ASSETS = {
  doorThresholdSocial: surfaceAsset(
    96,
    160,
    `
      <defs>
        <linearGradient id="socialThreshold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#f0d7aa"/>
          <stop offset="100%" stop-color="#8b6038"/>
        </linearGradient>
      </defs>
      <rect x="14" y="20" width="68" height="120" rx="20" fill="#291711"/>
      <rect x="22" y="28" width="52" height="104" rx="16" fill="url(#socialThreshold)"/>
      <rect x="30" y="40" width="36" height="80" rx="12" fill="#5a261a" fill-opacity="0.88"/>
      <path d="M32 54h32M32 106h32" stroke="#f8e7c6" stroke-opacity="0.34" stroke-width="3"/>
      <path d="M18 136h60" stroke="#d4b27f" stroke-opacity="0.56" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  doorThresholdService: surfaceAsset(
    96,
    160,
    `
      <rect x="14" y="20" width="68" height="120" rx="18" fill="#2d251f"/>
      <rect x="22" y="28" width="52" height="104" rx="14" fill="#b0a38e"/>
      <path d="M24 56h48M24 84h48M24 112h48" stroke="#f2e7d7" stroke-opacity="0.24" stroke-width="3"/>
      <path d="M18 136h60" stroke="#746350" stroke-opacity="0.62" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  doorThresholdGreenhouse: surfaceAsset(
    96,
    160,
    `
      <rect x="14" y="20" width="68" height="120" rx="18" fill="#1a2b28"/>
      <rect x="22" y="28" width="52" height="104" rx="14" fill="#7fb5ab" fill-opacity="0.38" stroke="#dcf2ea" stroke-opacity="0.4" stroke-width="3"/>
      <path d="M48 28v104M22 64h52M22 96h52" stroke="#e1f7f0" stroke-opacity="0.34" stroke-width="2"/>
      <path d="M18 136h60" stroke="#9ec8bb" stroke-opacity="0.54" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  doorThresholdMechanical: surfaceAsset(
    96,
    160,
    `
      <rect x="14" y="20" width="68" height="120" rx="18" fill="#20242a"/>
      <rect x="22" y="28" width="52" height="104" rx="14" fill="#6f7783"/>
      <path d="M24 44h48M24 68h48M24 92h48M24 116h48" stroke="#d5d9e1" stroke-opacity="0.22" stroke-width="3"/>
      <path d="M20 138l16-10 16 10 16-10 12 8" stroke="#efb467" stroke-opacity="0.72" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  ),
  doorThresholdStair: surfaceAsset(
    96,
    160,
    `
      <rect x="14" y="20" width="68" height="120" rx="18" fill="#2f2c32"/>
      <path d="M26 122h42v-16H54V90H40V74H26z" fill="#d5d7dd"/>
      <path d="M26 122h42" stroke="#f2e4bf" stroke-opacity="0.44" stroke-width="5" stroke-linecap="round"/>
      <path d="M58 48c6 0 10 4 10 10s-4 10-10 10" fill="none" stroke="#d7c294" stroke-opacity="0.42" stroke-width="4"/>
    `,
  ),
} as const;

export const INLINE_THRESHOLD_ASSETS = {
  ...THRESHOLD_ASSETS,
} as const;

const SOCIAL_PROP_ASSETS = {
  propGrandStair: surfaceAsset(
    224,
    164,
    `
      <defs>
        <linearGradient id="stairWood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#7c512f"/>
          <stop offset="100%" stop-color="#2a1a13"/>
        </linearGradient>
      </defs>
      <path d="M40 120h144l24 24H16z" fill="#17100e"/>
      <path d="M24 120h76l-14-18H36zM124 120h76l-12-18h-52z" fill="url(#stairWood)"/>
      <path d="M48 102h36l8 18H34zM140 102h36l12 18h-56z" fill="#a4633a"/>
      <path d="M84 46h56v58H84z" fill="#5e402c"/>
      <path d="M74 48h76v10H74z" fill="#d8c09a" fill-opacity="0.34"/>
      <path d="M88 46V18M108 46V12M128 46V12M148 46V18" stroke="#d7c49e" stroke-opacity="0.44" stroke-width="4"/>
      <path d="M72 48h80" stroke="#edddbd" stroke-opacity="0.34" stroke-width="5"/>
    `,
  ),
  propGrandClock: surfaceAsset(
    96,
    192,
    `
      <defs>
        <linearGradient id="clockWood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6b4429"/>
          <stop offset="100%" stop-color="#24150f"/>
        </linearGradient>
      </defs>
      <path d="M22 172h52l8 12H14z" fill="#110b09"/>
      <path d="M26 26h44v148H26z" fill="url(#clockWood)"/>
      <path d="M20 20h56v18H20zM24 158h48v14H24z" fill="#7f5430"/>
      <circle cx="48" cy="62" r="18" fill="#f5ebd0" stroke="#b88e58" stroke-width="4"/>
      <path d="M48 62V50M48 62l8 8" stroke="#4e3523" stroke-width="3" stroke-linecap="round"/>
      <path d="M48 96c10 0 18 8 18 18s-8 18-18 18-18-8-18-18 8-18 18-18z" fill="#34211a"/>
      <path d="M48 102v24" stroke="#d7c08d" stroke-width="4" stroke-linecap="round"/>
    `,
  ),
  propLibraryFireplace: surfaceAsset(
    196,
    156,
    `
      <rect x="20" y="122" width="156" height="14" rx="7" fill="#130d0b"/>
      <rect x="36" y="38" width="124" height="84" rx="10" fill="#6c4930" stroke="#e5c89d" stroke-opacity="0.3" stroke-width="4"/>
      <rect x="52" y="54" width="92" height="56" rx="8" fill="#201411"/>
      <path d="M74 98c6-18 12-26 24-26s18 8 24 26" fill="none" stroke="#f2aa61" stroke-opacity="0.72" stroke-width="8" stroke-linecap="round"/>
      <rect x="62" y="18" width="72" height="22" rx="6" fill="#8c6847" stroke="#f3dfbe" stroke-opacity="0.24" stroke-width="3"/>
    `,
  ),
  propStudySafe: surfaceAsset(
    104,
    136,
    `
      <rect x="18" y="116" width="68" height="12" rx="6" fill="#100f10"/>
      <rect x="22" y="22" width="60" height="94" rx="10" fill="#55585f" stroke="#b8bfca" stroke-opacity="0.26" stroke-width="4"/>
      <circle cx="52" cy="70" r="14" fill="#262b31" stroke="#d9c38f" stroke-opacity="0.56" stroke-width="4"/>
      <path d="M52 56v28M38 70h28" stroke="#d9c38f" stroke-opacity="0.42" stroke-width="3"/>
      <rect x="34" y="34" width="36" height="12" rx="4" fill="#707883"/>
    `,
  ),
  propBallroomOrgan: surfaceAsset(
    204,
    144,
    `
      <rect x="20" y="118" width="164" height="12" rx="6" fill="#120c0d"/>
      <path d="M40 116h110l24-18v18H40z" fill="#221414"/>
      <path d="M46 54h72v62H46z" fill="#2b1b16" stroke="#d2ba92" stroke-opacity="0.22" stroke-width="4"/>
      <path d="M54 28h56v28H54z" fill="#5d3528"/>
      <path d="M58 26V8M70 26V4M82 26V0M94 26V4M106 26V8" stroke="#dfc08d" stroke-opacity="0.42" stroke-width="4"/>
      <rect x="122" y="76" width="38" height="40" rx="8" fill="#4a2e21"/>
      <path d="M48 90h68" stroke="#f1e0c0" stroke-opacity="0.18" stroke-width="4"/>
    `,
  ),
  propBallroomStage: surfaceAsset(
    224,
    154,
    `
      <path d="M20 128h184l14 16H6z" fill="#140d10"/>
      <rect x="26" y="26" width="172" height="102" rx="14" fill="#4e1620" stroke="#d2aa74" stroke-opacity="0.2" stroke-width="4"/>
      <path d="M36 28c18 24 18 66 0 94M84 28c18 24 18 66 0 94M132 28c18 24 18 66 0 94M180 28c18 24 18 66 0 94" stroke="#f0b47a" stroke-opacity="0.14" stroke-width="18"/>
      <circle cx="70" cy="40" r="10" fill="#f6cd84" fill-opacity="0.26"/>
      <circle cx="154" cy="40" r="10" fill="#78b7f0" fill-opacity="0.22"/>
    `,
  ),
} as const;

const VERTICAL_SLICE_PROP_ASSETS = {
  propGrandTribunalChairbank: surfaceAsset(
    304,
    156,
    `
      <path d="M52 108h200" stroke="#180f0e" stroke-opacity="0.7" stroke-width="18" stroke-linecap="round"/>
      <rect x="34" y="62" width="24" height="34" rx="8" fill="#503123" stroke="#ddb987" stroke-opacity="0.22" stroke-width="3"/>
      <rect x="70" y="56" width="22" height="40" rx="8" fill="#5a1d24" stroke="#edca92" stroke-opacity="0.18" stroke-width="3"/>
      <rect x="102" y="54" width="22" height="42" rx="8" fill="#503123" stroke="#ddb987" stroke-opacity="0.18" stroke-width="3"/>
      <rect x="134" y="50" width="36" height="50" rx="10" fill="#6d2430" stroke="#f0d5a2" stroke-opacity="0.2" stroke-width="3"/>
      <rect x="180" y="54" width="22" height="42" rx="8" fill="#503123" stroke="#ddb987" stroke-opacity="0.18" stroke-width="3"/>
      <rect x="212" y="56" width="22" height="40" rx="8" fill="#5a1d24" stroke="#edca92" stroke-opacity="0.18" stroke-width="3"/>
      <rect x="246" y="62" width="24" height="34" rx="8" fill="#503123" stroke="#ddb987" stroke-opacity="0.22" stroke-width="3"/>
      <rect x="22" y="70" width="20" height="38" rx="8" fill="#6f2530" stroke="#f0d7a8" stroke-opacity="0.24" stroke-width="3"/>
      <rect x="262" y="70" width="20" height="38" rx="8" fill="#6f2530" stroke="#f0d7a8" stroke-opacity="0.24" stroke-width="3"/>
      <path d="M42 110h220" stroke="#d9b27c" stroke-opacity="0.16" stroke-width="6" stroke-linecap="round"/>
    `,
  ),
  propGrandTribunalTable: surfaceAsset(
    284,
    140,
    `
      <defs>
        <linearGradient id="tribunalTableWood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#7f4f31"/>
          <stop offset="100%" stop-color="#2c1a14"/>
        </linearGradient>
      </defs>
      <ellipse cx="142" cy="116" rx="110" ry="18" fill="#110c0b" fill-opacity="0.62"/>
      <rect x="34" y="48" width="216" height="44" rx="20" fill="url(#tribunalTableWood)" stroke="#efcf98" stroke-opacity="0.26" stroke-width="5"/>
      <path d="M48 68h188" stroke="#f6e4bf" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round"/>
      <path d="M72 92v16M110 92v18M142 92v18M174 92v18M212 92v16" stroke="#1b1110" stroke-opacity="0.86" stroke-width="6" stroke-linecap="round"/>
      <rect x="78" y="40" width="18" height="14" rx="5" fill="#d4b47f" fill-opacity="0.52"/>
      <rect x="188" y="40" width="18" height="14" rx="5" fill="#d4b47f" fill-opacity="0.52"/>
      <path d="M88 38c6-10 10-18 10-26 0 8 4 16 10 26M198 38c6-10 10-18 10-26 0 8 4 16 10 26" fill="none" stroke="#f4ddb0" stroke-opacity="0.52" stroke-width="3" stroke-linecap="round"/>
      <path d="M118 54h48" stroke="#4b2e21" stroke-opacity="0.7" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  propGrandConsole: surfaceAsset(
    184,
    132,
    `
      <rect x="24" y="108" width="136" height="12" rx="6" fill="#120c0b"/>
      <rect x="42" y="76" width="100" height="26" rx="8" fill="#70462b" stroke="#e0bf8f" stroke-opacity="0.2" stroke-width="4"/>
      <path d="M54 76v-26M130 76v-26" stroke="#e7c892" stroke-opacity="0.3" stroke-width="5" stroke-linecap="round"/>
      <rect x="52" y="18" width="80" height="48" rx="10" fill="#4f261d" stroke="#efdbb7" stroke-opacity="0.24" stroke-width="4"/>
      <path d="M62 28h60M62 56h60" stroke="#f6e4bf" stroke-opacity="0.14" stroke-width="4"/>
      <circle cx="84" cy="74" r="7" fill="#d2b07c" fill-opacity="0.44"/>
      <circle cx="118" cy="74" r="7" fill="#d2b07c" fill-opacity="0.44"/>
    `,
  ),
  propLibraryDesk: surfaceAsset(
    188,
    136,
    `
      <ellipse cx="94" cy="112" rx="74" ry="16" fill="#100c0b" fill-opacity="0.52"/>
      <rect x="34" y="54" width="120" height="30" rx="10" fill="#6a442a" stroke="#e1c291" stroke-opacity="0.26" stroke-width="4"/>
      <path d="M50 84v18M78 84v18M110 84v18M138 84v18" stroke="#281710" stroke-opacity="0.84" stroke-width="6" stroke-linecap="round"/>
      <rect x="46" y="42" width="54" height="16" rx="5" fill="#2c351d" stroke="#d1d992" stroke-opacity="0.22" stroke-width="3"/>
      <rect x="106" y="38" width="28" height="20" rx="5" fill="#54423a" stroke="#d9be8d" stroke-opacity="0.24" stroke-width="3"/>
      <circle cx="120" cy="42" r="4" fill="#86c2f0" fill-opacity="0.52"/>
      <path d="M134 42c8-4 14-10 16-20" fill="none" stroke="#d5c08d" stroke-opacity="0.3" stroke-width="3" stroke-linecap="round"/>
      <path d="M62 58h62" stroke="#f8e9c9" stroke-opacity="0.2" stroke-width="3" stroke-linecap="round"/>
    `,
  ),
  propLibraryStacks: surfaceAsset(
    196,
    164,
    `
      <rect x="22" y="134" width="150" height="12" rx="6" fill="#0f0c0b"/>
      <rect x="30" y="28" width="58" height="106" rx="10" fill="#4c3123" stroke="#dcc59d" stroke-opacity="0.22" stroke-width="4"/>
      <rect x="104" y="18" width="58" height="116" rx="10" fill="#4f3425" stroke="#dcc59d" stroke-opacity="0.22" stroke-width="4"/>
      <path d="M40 52h38M40 78h38M40 104h38" stroke="#2a1a12" stroke-opacity="0.84" stroke-width="10"/>
      <path d="M114 42h38M114 68h38M114 94h38M114 120h38" stroke="#2a1a12" stroke-opacity="0.84" stroke-width="10"/>
      <rect x="78" y="96" width="26" height="34" rx="6" fill="#785439" stroke="#e1c28d" stroke-opacity="0.18" stroke-width="3"/>
      <path d="M84 110h14" stroke="#2b1a13" stroke-opacity="0.7" stroke-width="3"/>
    `,
  ),
  propLibraryLadder: surfaceAsset(
    128,
    172,
    `
      <path d="M28 144l36-112M84 144l16-112" stroke="#c8a775" stroke-opacity="0.8" stroke-width="6" stroke-linecap="round"/>
      <path d="M40 122h44M46 100h36M52 78h28M58 56h20" stroke="#e9d3a7" stroke-opacity="0.54" stroke-width="4" stroke-linecap="round"/>
      <rect x="18" y="140" width="88" height="10" rx="5" fill="#130e0d"/>
      <circle cx="30" cy="146" r="6" fill="#544137"/>
      <circle cx="94" cy="146" r="6" fill="#544137"/>
    `,
  ),
  propLibraryReadingClub: surfaceAsset(
    184,
    124,
    `
      <ellipse cx="92" cy="100" rx="70" ry="16" fill="#120d0c" fill-opacity="0.48"/>
      <rect x="30" y="48" width="38" height="28" rx="14" fill="#5b1c24" stroke="#e4c38f" stroke-opacity="0.18" stroke-width="4"/>
      <rect x="116" y="48" width="38" height="28" rx="14" fill="#5b1c24" stroke="#e4c38f" stroke-opacity="0.18" stroke-width="4"/>
      <circle cx="92" cy="56" r="14" fill="#d0a86e" fill-opacity="0.36"/>
      <path d="M92 42v-14" stroke="#ead7ae" stroke-opacity="0.42" stroke-width="4" stroke-linecap="round"/>
      <path d="M58 78v12M126 78v12" stroke="#231612" stroke-opacity="0.84" stroke-width="6" stroke-linecap="round"/>
      <rect x="74" y="62" width="36" height="18" rx="8" fill="#70462a" stroke="#eccd95" stroke-opacity="0.18" stroke-width="3"/>
    `,
  ),
} as const;

const SERVICE_PROP_ASSETS = {
  propKitchenIsland: surfaceAsset(
    208,
    124,
    `
      <rect x="18" y="98" width="172" height="14" rx="7" fill="#100d0c"/>
      <rect x="32" y="42" width="144" height="56" rx="10" fill="#ece6dc" stroke="#cab393" stroke-width="4"/>
      <rect x="44" y="56" width="52" height="30" rx="6" fill="#d0c3b4"/>
      <rect x="108" y="56" width="56" height="30" rx="6" fill="#d0c3b4"/>
      <path d="M48 42h112" stroke="#ffffff" stroke-opacity="0.42" stroke-width="4" stroke-linecap="round"/>
      <circle cx="72" cy="40" r="8" fill="#597940"/>
      <circle cx="138" cy="38" r="9" fill="#b26d44"/>
    `,
  ),
  propKitchenPantry: surfaceAsset(
    136,
    168,
    `
      <rect x="22" y="146" width="92" height="12" rx="6" fill="#120f0d"/>
      <rect x="28" y="18" width="80" height="128" rx="10" fill="#5d4635" stroke="#d6c29c" stroke-opacity="0.24" stroke-width="4"/>
      <path d="M36 52h64M36 84h64M36 116h64" stroke="#2a1d16" stroke-opacity="0.72" stroke-width="10"/>
      <circle cx="92" cy="82" r="4" fill="#d3b176"/>
    `,
  ),
  propGreenhouseBench: surfaceAsset(
    188,
    136,
    `
      <rect x="20" y="112" width="148" height="12" rx="6" fill="#0d120f"/>
      <rect x="34" y="76" width="120" height="26" rx="8" fill="#6f5c45" stroke="#dfcfb5" stroke-opacity="0.16" stroke-width="4"/>
      <path d="M50 74V42M82 74V32M114 74V38M146 74V28" stroke="#dff2e7" stroke-opacity="0.26" stroke-width="4"/>
      <circle cx="58" cy="36" r="14" fill="#517942" fill-opacity="0.8"/>
      <circle cx="86" cy="28" r="12" fill="#5d8c46" fill-opacity="0.86"/>
      <circle cx="118" cy="34" r="13" fill="#7ab35c" fill-opacity="0.82"/>
      <circle cx="144" cy="24" r="10" fill="#a5c663" fill-opacity="0.82"/>
    `,
  ),
  propSurveillanceScreenwall: surfaceAsset(
    220,
    148,
    `
      <rect x="18" y="118" width="184" height="12" rx="6" fill="#0b0f12"/>
      <rect x="28" y="18" width="164" height="100" rx="10" fill="#121921" stroke="#8fd4e8" stroke-opacity="0.16" stroke-width="4"/>
      <rect x="40" y="32" width="40" height="22" rx="4" fill="#8dd1e6" fill-opacity="0.22"/>
      <rect x="90" y="32" width="40" height="22" rx="4" fill="#8dd1e6" fill-opacity="0.16"/>
      <rect x="140" y="32" width="40" height="22" rx="4" fill="#8dd1e6" fill-opacity="0.22"/>
      <rect x="40" y="64" width="40" height="22" rx="4" fill="#8dd1e6" fill-opacity="0.16"/>
      <rect x="90" y="64" width="40" height="22" rx="4" fill="#8dd1e6" fill-opacity="0.22"/>
      <rect x="140" y="64" width="40" height="22" rx="4" fill="#8dd1e6" fill-opacity="0.16"/>
      <rect x="86" y="92" width="48" height="10" rx="5" fill="#4f6672"/>
    `,
  ),
  propSurveillanceArchive: surfaceAsset(
    156,
    148,
    `
      <rect x="26" y="122" width="104" height="12" rx="6" fill="#0d1012"/>
      <rect x="30" y="26" width="96" height="96" rx="10" fill="#43474f" stroke="#c1c7d2" stroke-opacity="0.16" stroke-width="4"/>
      <path d="M38 52h80M38 76h80M38 100h80" stroke="#2a2f35" stroke-opacity="0.86" stroke-width="12"/>
      <circle cx="104" cy="52" r="4" fill="#cbb07c"/>
      <circle cx="104" cy="76" r="4" fill="#cbb07c"/>
      <circle cx="104" cy="100" r="4" fill="#cbb07c"/>
    `,
  ),
  propGeneratorCore: surfaceAsset(
    204,
    156,
    `
      <rect x="18" y="126" width="168" height="12" rx="6" fill="#0f1012"/>
      <rect x="30" y="38" width="98" height="88" rx="14" fill="#2f343b" stroke="#c3c7d2" stroke-opacity="0.14" stroke-width="4"/>
      <ellipse cx="80" cy="82" rx="34" ry="34" fill="#22342a" stroke="#7ce38e" stroke-opacity="0.52" stroke-width="6"/>
      <ellipse cx="80" cy="82" rx="18" ry="18" fill="#7ce38e" fill-opacity="0.28"/>
      <rect x="134" y="54" width="40" height="72" rx="8" fill="#4b4e55" stroke="#d4b57f" stroke-opacity="0.2" stroke-width="4"/>
      <path d="M128 108c18 0 30 4 44 16" fill="none" stroke="#d45845" stroke-opacity="0.62" stroke-width="8" stroke-linecap="round"/>
    `,
  ),
  propGeneratorPipes: surfaceAsset(
    168,
    128,
    `
      <path d="M18 104h132" stroke="#17191c" stroke-width="12" stroke-linecap="round"/>
      <path d="M28 72h104M54 44h82" stroke="#6a6f78" stroke-width="14" stroke-linecap="round"/>
      <path d="M56 44v60M114 44v60" stroke="#a7adb8" stroke-opacity="0.18" stroke-width="6" stroke-linecap="round"/>
      <circle cx="28" cy="72" r="10" fill="#d5af74" fill-opacity="0.32"/>
      <circle cx="150" cy="104" r="8" fill="#7dd990" fill-opacity="0.28"/>
    `,
  ),
  propCellarCoal: surfaceAsset(
    116,
    96,
    `
      <rect x="18" y="56" width="80" height="22" rx="6" fill="#4a3425" stroke="#c5a171" stroke-opacity="0.18" stroke-width="4"/>
      <path d="M24 54l10-18h48l12 18" fill="#141211"/>
      <path d="M34 48l10-14 14 12 10-14 16 16" stroke="#2f2c2a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  ),
  propCrateStack: surfaceAsset(
    132,
    112,
    `
      <rect x="18" y="74" width="48" height="26" rx="4" fill="#6b4b33" stroke="#c9a16f" stroke-opacity="0.18" stroke-width="4"/>
      <rect x="62" y="48" width="48" height="52" rx="4" fill="#765339" stroke="#d0aa78" stroke-opacity="0.18" stroke-width="4"/>
      <path d="M30 86h24M74 64h24M74 84h24" stroke="#2e1f16" stroke-opacity="0.58" stroke-width="4"/>
    `,
  ),
} as const;

export const INLINE_HERO_PROP_ASSETS = {
  ...SOCIAL_PROP_ASSETS,
  ...VERTICAL_SLICE_PROP_ASSETS,
  ...SERVICE_PROP_ASSETS,
} as const;

export const MANOR_INLINE_ENVIRONMENT_ASSETS = {
  ...INLINE_ROOM_SURFACE_ASSETS,
  ...INLINE_THRESHOLD_ASSETS,
  ...INLINE_HERO_PROP_ASSETS,
} as const;
