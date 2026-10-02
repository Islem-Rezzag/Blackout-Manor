export const ESTATE_HUD_STYLES = `
.manor-hud {
  --paper: #eee6cf;
  --muted: #a2afa0;
  --brass: #c6ad74;
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  color: var(--paper);
  font:
    12px "Segoe UI",
    sans-serif;
  letter-spacing: 0;
}
.manor-hud[hidden],
.manor-hud [hidden] {
  display: none !important;
}
.manor-hud * {
  box-sizing: border-box;
  letter-spacing: 0;
}
.manor-hud button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  pointer-events: auto;
}
.manor-hud button:focus-visible {
  outline: 2px solid #dbc58c;
  outline-offset: 4px;
}
.manor-hud svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
  flex-shrink: 0;
}
.estate-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 23px 30px 21px;
  background: linear-gradient(#101e19f5, #101e19bf);
  border-bottom: 1px solid #b9b38925;
}
.estate-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}
.estate-crest {
  border: 1px solid #bca77180;
  width: 42px;
  height: 48px;
  display: grid;
  place-items: center;
  clip-path: polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%);
  background: #bda27412;
}
.estate-crest svg {
  width: 27px;
  height: 27px;
  color: var(--brass);
}
.estate-brand h1 {
  font:
    25px Georgia,
    serif;
  margin: 0;
  line-height: 1.12;
  font-weight: normal;
}
.estate-brand p {
  font-size: 10px;
  color: var(--muted);
  margin: 5px 0 0;
  text-transform: uppercase;
}
.estate-phase {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dcc79c;
  font-size: 11px;
}
.estate-phase i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b5c489;
  box-shadow: 0 0 12px #acc78355;
}
.estate-phase span:last-child {
  color: #9aa99b;
  border-left: 1px solid #899d853f;
  padding-left: 12px;
  font-variant-numeric: tabular-nums;
}
.estate-totals {
  justify-self: end;
  display: flex;
  gap: 25px;
  align-items: center;
}
.estate-total {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 8px;
  row-gap: 4px;
  align-items: center;
}
.estate-total svg {
  grid-row: 1 / 3;
  color: var(--brass);
}
.estate-total strong {
  font:
    16px Georgia,
    serif;
  font-weight: normal;
}
.estate-total small {
  font-size: 9px;
  color: var(--muted);
  text-transform: uppercase;
}
.estate-nav {
  position: absolute;
  top: 112px;
  left: 30px;
  display: flex;
  gap: 5px;
  padding: 4px;
  background: #15241edc;
  border: 1px solid #a7a78530;
  border-radius: 4px;
  pointer-events: auto;
}
.estate-nav button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: transparent;
  height: 36px;
  padding: 0 13px;
  border-radius: 2px;
  color: #a7b4a4;
}
.estate-nav button:hover {
  color: #f2e5c5;
  background: #6c795d33;
}
.estate-nav button[aria-pressed="true"] {
  background: #b6a27025;
  color: #e7cf9c;
  box-shadow: inset 0 -2px #b6a270;
}
.estate-nav button[data-command="rooms"] {
  border-left: 1px solid #9b9c7330;
  border-radius: 0;
}
.estate-location {
  position: absolute;
  top: 113px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  text-align: right;
  color: #b4c0ae;
  font-size: 11px;
}
.estate-location svg {
  color: #b8a779;
  width: 16px;
  height: 16px;
}
.estate-room-menu {
  position: absolute;
  top: 168px;
  left: 30px;
  width: 254px;
  padding: 12px;
  background: #13251ff2;
  border: 1px solid #a1a77d48;
  border-radius: 4px;
  pointer-events: auto;
  box-shadow: 0 12px 28px #07140f66;
}
.estate-room-menu h2 {
  font:
    18px Georgia,
    serif;
  font-weight: normal;
  margin: 7px 9px 13px;
  color: #e4d5b4;
}
.estate-room-menu button {
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 11px 9px;
  text-align: left;
  border-top: 1px solid #6d836426;
}
.estate-room-menu button:hover,
.estate-room-menu button[aria-current="true"] {
  background: #9ba27620;
  color: #ead7a3;
}
.estate-room-menu small {
  font-size: 10px;
  color: #b8bea4;
}
.estate-subtitle {
  position: absolute;
  bottom: 113px;
  left: 50%;
  transform: translateX(-50%);
  width: min(590px, calc(100% - 40px));
  background: #14251eee;
  border-left: 2px solid var(--brass);
  padding: 14px 20px;
  box-shadow: 0 8px 24px #05130f33;
}
.estate-subtitle small {
  display: block;
  color: #c4ae7b;
  font-size: 10px;
  margin-bottom: 6px;
}
.estate-subtitle p {
  font:
    15px Georgia,
    serif;
  line-height: 1.5;
  margin: 0;
  color: #ebe3cd;
}
.estate-subtitle[data-tone="alert"] {
  border-color: #d69483;
}
.estate-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(#101f1bd9, #10221dfa);
  border-top: 1px solid #9caa8533;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 12px 30px 15px;
  min-height: 96px;
}
.estate-cast-heading {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 80px;
}
.estate-cast-heading strong {
  font:
    17px Georgia,
    serif;
  font-weight: normal;
}
.estate-cast-heading small {
  font-size: 10px;
  color: #9eae9e;
}
.estate-cast {
  display: flex;
  gap: 5px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #78866c transparent;
  flex: 1;
}
.estate-guest {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 4px;
  min-width: 64px;
  flex: 1;
  border: 0;
  background: transparent;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  padding: 2px 4px 5px;
  transition: background 0.15s;
  position: relative;
}
.estate-guest:hover,
.estate-guest[aria-pressed="true"] {
  background: #9b9c6c1e;
  border-bottom-color: var(--brass);
}
.estate-guest canvas {
  width: 35px;
  height: 39px;
  object-fit: contain;
}
.estate-guest span {
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 10px;
  color: #d7d8bd;
}
.estate-guest i {
  position: absolute;
  top: 31px;
  left: calc(50% + 12px);
  width: 4px;
  height: 4px;
  background: #b3c484;
  border-radius: 50%;
}
.estate-guest[data-alive="false"] {
  opacity: 0.48;
}
.estate-guest[data-alive="false"] i {
  background: #c38877;
}
.estate-tools {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  padding-left: 17px;
  border-left: 1px solid #9eac8230;
}
.estate-tools button {
  width: 36px;
  height: 38px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 0;
  border-radius: 3px;
  color: #bbc3ab;
}
.estate-tools button:hover {
  color: #edddb2;
  background: #b1b17a20;
}
.estate-tools button[aria-pressed="true"] {
  color: #d9bd7e;
}
.estate-tool-error {
  position: absolute;
  right: 30px;
  bottom: 113px;
  margin: 0;
  padding: 10px 14px;
  background: #1c2b20;
  color: #ead9b7;
  border: 1px solid #a8aa7a45;
  max-width: 260px;
}
@media (min-width: 1700px) {
  .estate-header {
    padding-left: 42px;
    padding-right: 42px;
  }
  .estate-nav {
    left: 42px;
  }
  .estate-bottom {
    padding-left: 42px;
    padding-right: 42px;
  }
  .estate-guest canvas {
    width: 42px;
    height: 46px;
  }
  .estate-bottom {
    min-height: 104px;
  }
  .estate-cast {
    max-width: 1200px;
    margin: auto;
  }
  .estate-guest {
    min-width: 80px;
  }
}
@media (max-width: 800px) {
  .estate-header {
    padding: 17px 16px;
    grid-template-columns: 1fr auto;
    gap: 10px;
  }
  .estate-brand h1 {
    font-size: 21px;
  }
  .estate-crest {
    width: 32px;
    height: 39px;
  }
  .estate-brand p {
    font-size: 9px;
  }
  .estate-phase {
    position: absolute;
    right: 16px;
    top: 78px;
  }
  .estate-totals {
    gap: 13px;
  }
  .estate-total strong {
    font-size: 14px;
  }
  .estate-total svg {
    display: none;
  }
  .estate-nav {
    top: 100px;
    left: 16px;
  }
  .estate-nav button {
    padding: 0 10px;
    height: 33px;
  }
  .estate-location {
    top: 147px;
    left: 18px;
    right: auto;
    font-size: 10px;
  }
  .estate-room-menu {
    top: 149px;
    left: 16px;
  }
  .estate-bottom {
    padding: 10px 12px;
    gap: 8px;
    min-height: 91px;
  }
  .estate-cast-heading {
    display: none;
  }
  .estate-guest {
    min-width: 56px;
  }
  .estate-guest canvas {
    width: 30px;
    height: 35px;
  }
  .estate-tools {
    padding-left: 5px;
    flex-direction: column;
    gap: 0;
  }
  .estate-tools button {
    height: 23px;
    width: 27px;
  }
  .estate-tools svg {
    width: 15px;
    height: 15px;
  }
  .estate-subtitle {
    bottom: 105px;
  }
  .estate-total small {
    font-size: 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .manor-hud * {
    transition: none !important;
  }
}
.estate-room-menu {
  max-height: calc(100% - 285px);
  overflow-y: auto;
}
.estate-header {
  height: 100px;
  background: linear-gradient(#101b18fa, #101b18de);
}
.estate-clock {
  display: grid;
  width: 280px;
  grid-template-columns: 1fr 96px;
  column-gap: 12px;
  align-items: center;
}
.estate-clock small {
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
}
.estate-clock strong {
  font-size: 28px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  grid-row: 1 / 3;
  grid-column: 2;
}
.estate-clock span {
  font-size: 11px;
  color: var(--brass);
  line-height: 1.7;
}
.manor-hud button:disabled {
  opacity: 0.4;
  cursor: default;
}
.manor-hud select,
.manor-hud input {
  font: inherit;
  color: inherit;
  pointer-events: auto;
  cursor: pointer;
}
.manor-hud select:focus-visible,
.manor-hud input:focus-visible {
  outline: 2px solid #dbc58c;
  outline-offset: 3px;
}
.estate-transport {
  position: absolute;
  top: 112px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: #15211eea;
  border: 1px solid #a7a78530;
  border-radius: 4px;
  pointer-events: auto;
}
.estate-transport button,
.estate-activity header button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  height: 36px;
  width: 36px;
  padding: 0;
  border-radius: 2px;
  color: #bdc7b6;
}
.estate-transport button:hover:not(:disabled),
.estate-activity header button:hover {
  color: #f2e5c5;
  background: #6c795d33;
}
.estate-session-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-size: 11px;
  color: #acbca9;
}
.estate-session-status svg {
  width: 12px;
  height: 12px;
  color: #b6c58a;
}
.estate-transport select {
  background: #25302a;
  border: 1px solid #83927040;
  border-radius: 2px;
  height: 32px;
  width: 62px;
  padding: 0 5px;
}
.estate-transport input {
  width: 100px;
  height: 32px;
  accent-color: var(--brass);
}
.estate-phase-track {
  position: absolute;
  top: 172px;
  left: 30px;
  right: 30px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 3px;
}
.estate-phase-track > div {
  position: relative;
  padding: 0 4px 10px;
  border-bottom: 2px solid #81907935;
  color: #8d9e8d;
  font-size: 11px;
}
.estate-phase-track > div[aria-current="true"] {
  color: #e9ce93;
  border-bottom-color: #ad997646;
}
.estate-phase-track i {
  position: absolute;
  bottom: -2px;
  left: 0;
  height: 2px;
  background: var(--brass);
}
.estate-location {
  top: 214px;
  padding: 8px 12px;
  font-size: 12px;
  background: #13201ac4;
  border-left: 1px solid #c6ad7455;
}
.manor-hud[data-directed="true"] .estate-location {
  display: none;
}
.estate-room-menu {
  top: 164px;
  z-index: 2;
  width: 270px;
}
.estate-ready {
  position: absolute;
  left: 30px;
  bottom: 145px;
  padding: 18px 24px 18px 0;
  background: linear-gradient(90deg, #101b18ee, #101b1800);
}
.estate-ready > small {
  font-size: 10px;
  color: var(--brass);
}
.estate-ready h2 {
  font:
    34px Georgia,
    serif;
  margin: 10px 0 20px;
}
.estate-ready button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 22px;
  color: #18231b;
  background: #d6c38c;
  border: 1px solid #eadbb3;
  border-radius: 3px;
  font-size: 13px;
}
.estate-ready button:hover {
  background: #e6d4a0;
}
.estate-subtitle {
  bottom: 136px;
}
.estate-subtitle small {
  font-size: 11px;
}
.estate-subtitle p {
  font-size: 16px;
}
.estate-bottom {
  height: 124px;
  min-height: 124px;
  background: linear-gradient(#101b18eb, #101b18fa);
}
.estate-guest {
  min-width: 76px;
}
.estate-guest span {
  font-size: 11px;
  color: #e2e3cf;
  white-space: normal;
  text-align: center;
  line-height: 1.25;
  height: 28px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.manor-hud .estate-guest:disabled { opacity: 1; cursor: default; }
.manor-hud .estate-guest[data-alive=false] { opacity: .5; }
.estate-guest small {
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 10px;
  color: #9fac97;
}
.estate-guest[data-speaking="true"] {
  background: #ad9a6925;
  border-bottom-color: #e3cb91;
}
.estate-cast {
  pointer-events: auto;
}
.estate-activity {
  position: absolute;
  z-index: 2;
  right: 30px;
  top: 260px;
  width: 300px;
  max-height: calc(100% - 400px);
  overflow-y: auto;
  background: #14201df5;
  border: 1px solid #9d987344;
  pointer-events: auto;
  padding: 12px 16px;
  border-radius: 4px;
}
.estate-activity header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.estate-activity h2 {
  font:
    18px Georgia,
    serif;
  margin: 8px 0;
}
.estate-activity ol {
  list-style: none;
  padding: 0;
  margin: 0;
}
.estate-activity li {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #9d987329;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.estate-activity li small {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--brass);
  padding-top: 2px;
}
.estate-activity-empty {
  color: var(--muted);
  margin: 12px 0;
}
@media (max-width: 800px) {
  .estate-brand h1 {
    white-space: nowrap;
    font-size: 21px;
  }
  .estate-totals {
    gap: 12px;
  }
  .estate-total {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
  }
  .estate-total svg {
    display: block;
    width: 14px;
    height: 14px;
  }
  .estate-total strong {
    white-space: nowrap;
    font-size: 14px;
  }
  .estate-total small {
    display: none;
  }
  .estate-header {
    padding: 12px 16px;
    height: 136px;
  }
  .estate-brand {
    gap: 9px;
  }
  .estate-crest {
    width: 30px;
    height: 38px;
  }
  .estate-crest svg {
    width: 22px;
  }
  .estate-clock {
    grid-row: 2;
    grid-column: 1 / 3;
    grid-template-columns: auto 1fr;
    column-gap: 12px;
    width: 100%;
  }
  .estate-clock strong {
    grid-column: 1;
    font-size: 25px;
  }
  .estate-clock small {
    grid-column: 2;
    font-size: 9px;
  }
  .estate-clock span {
    grid-column: 2;
    font-size: 10px;
  }
  .estate-nav {
    top: 144px;
    left: 12px;
  }
  .estate-transport {
    top: 194px;
    left: 12px;
    right: 12px;
  }
  .estate-session-status {
    padding: 0 6px;
    margin-right: auto;
  }
  .estate-transport select {
    width: 56px;
  }
  .estate-transport input {
    width: 62px;
  }
  .estate-phase-track {
    top: 248px;
    left: 12px;
    right: 12px;
    gap: 6px 2px;
    grid-template-columns: repeat(4, 1fr);
  }
  .estate-phase-track > div {
    padding: 0 0 8px;
    text-align: center;
    font-size: 10px;
  }
  .estate-location {
    top: 310px;
    left: 12px;
    right: auto;
    max-width: calc(100% - 24px);
    font-size: 11px;
  }
  .estate-location span {
    overflow-wrap: anywhere;
  }
  .estate-room-menu {
    top: 190px;
    left: 12px;
    max-height: calc(100% - 340px);
  }
  .estate-bottom {
    min-height: 108px;
  }
  .estate-guest {
    min-width: 72px;
  }
  .estate-tools button {
    height: 36px;
    width: 36px;
  }
  .estate-subtitle {
    bottom: 124px;
    width: calc(100% - 24px);
    padding: 12px 16px;
  }
  .estate-ready {
    left: 18px;
    right: 18px;
    bottom: 136px;
  }
  .estate-ready h2 {
    font-size: 28px;
  }
  .estate-activity {
    top: 354px;
    right: 12px;
    width: min(300px, calc(100% - 24px));
    max-height: calc(100% - 482px);
  }
}
`;
