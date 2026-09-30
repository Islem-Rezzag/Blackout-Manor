export const ESTATE_HUD_STYLES = `
.manor-hud{--paper:#eee6cf;--muted:#a2afa0;--brass:#c6ad74;position:absolute;inset:0;z-index:3;pointer-events:none;color:var(--paper);font:12px 'Segoe UI',sans-serif;letter-spacing:0}
.manor-hud[hidden],.manor-hud [hidden]{display:none!important}
.manor-hud *{box-sizing:border-box;letter-spacing:0}
.manor-hud button{font:inherit;color:inherit;cursor:pointer;pointer-events:auto}
.manor-hud button:focus-visible{outline:2px solid #dbc58c;outline-offset:4px}
.manor-hud svg{width:18px;height:18px;stroke-width:1.5;flex-shrink:0}
.estate-header{position:absolute;top:0;left:0;right:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;padding:23px 30px 21px;background:linear-gradient(#101e19f5,#101e19bf);border-bottom:1px solid #b9b38925}
.estate-brand{display:flex;align-items:center;gap:13px}
.estate-crest{border:1px solid #bca77180;width:42px;height:48px;display:grid;place-items:center;clip-path:polygon(0 0,100% 0,100% 72%,50% 100%,0 72%);background:#bda27412}
.estate-crest svg{width:27px;height:27px;color:var(--brass)}
.estate-brand h1{font:25px Georgia,serif;margin:0;line-height:1.12;font-weight:normal}
.estate-brand p{font-size:10px;color:var(--muted);margin:5px 0 0;text-transform:uppercase}
.estate-phase{display:flex;align-items:center;gap:12px;color:#dcc79c;font-size:11px}
.estate-phase i{width:6px;height:6px;border-radius:50%;background:#b5c489;box-shadow:0 0 12px #acc78355}
.estate-phase span:last-child{color:#9aa99b;border-left:1px solid #899d853f;padding-left:12px;font-variant-numeric:tabular-nums}
.estate-totals{justify-self:end;display:flex;gap:25px;align-items:center}
.estate-total{display:grid;grid-template-columns:auto auto;column-gap:8px;row-gap:4px;align-items:center}
.estate-total svg{grid-row:1/3;color:var(--brass)}
.estate-total strong{font:16px Georgia,serif;font-weight:normal}
.estate-total small{font-size:9px;color:var(--muted);text-transform:uppercase}
.estate-nav{position:absolute;top:112px;left:30px;display:flex;gap:5px;padding:4px;background:#15241edc;border:1px solid #a7a78530;border-radius:4px;pointer-events:auto}
.estate-nav button{display:flex;align-items:center;justify-content:center;gap:8px;border:0;background:transparent;height:36px;padding:0 13px;border-radius:2px;color:#a7b4a4}
.estate-nav button:hover{color:#f2e5c5;background:#6c795d33}
.estate-nav button[aria-pressed=true]{background:#b6a27025;color:#e7cf9c;box-shadow:inset 0 -2px #b6a270}
.estate-nav button[data-command=rooms]{border-left:1px solid #9b9c7330;border-radius:0}
.estate-location{position:absolute;top:113px;right:30px;display:flex;align-items:center;gap:10px;padding:12px 0;text-align:right;color:#b4c0ae;font-size:11px}
.estate-location svg{color:#b8a779;width:16px;height:16px}
.estate-room-menu{position:absolute;top:168px;left:30px;width:254px;padding:12px;background:#13251ff2;border:1px solid #a1a77d48;border-radius:4px;pointer-events:auto;box-shadow:0 12px 28px #07140f66}
.estate-room-menu h2{font:18px Georgia,serif;font-weight:normal;margin:7px 9px 13px;color:#e4d5b4}
.estate-room-menu button{width:100%;border:0;background:transparent;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 9px;text-align:left;border-top:1px solid #6d836426}
.estate-room-menu button:hover,.estate-room-menu button[aria-current=true]{background:#9ba27620;color:#ead7a3}
.estate-room-menu small{font-size:10px;color:#b8bea4}
.estate-subtitle{position:absolute;bottom:113px;left:50%;transform:translateX(-50%);width:min(590px,calc(100% - 40px));background:#14251eee;border-left:2px solid var(--brass);padding:14px 20px;box-shadow:0 8px 24px #05130f33}
.estate-subtitle small{display:block;color:#c4ae7b;font-size:10px;margin-bottom:6px}
.estate-subtitle p{font:15px Georgia,serif;line-height:1.5;margin:0;color:#ebe3cd}
.estate-subtitle[data-tone=alert]{border-color:#d69483}
.estate-bottom{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#101f1bd9,#10221dfa);border-top:1px solid #9caa8533;display:flex;align-items:center;gap:22px;padding:12px 30px 15px;min-height:96px}
.estate-cast-heading{flex-shrink:0;display:flex;flex-direction:column;gap:6px;width:80px}
.estate-cast-heading strong{font:17px Georgia,serif;font-weight:normal}
.estate-cast-heading small{font-size:10px;color:#9eae9e}
.estate-cast{display:flex;gap:5px;min-width:0;overflow-x:auto;scrollbar-width:thin;scrollbar-color:#78866c transparent;flex:1}
.estate-guest{display:flex;align-items:center;flex-direction:column;gap:4px;min-width:64px;flex:1;border:0;background:transparent;border-bottom:1px solid transparent;border-radius:0;padding:2px 4px 5px;transition:background .15s;position:relative}
.estate-guest:hover,.estate-guest[aria-pressed=true]{background:#9b9c6c1e;border-bottom-color:var(--brass)}
.estate-guest canvas{width:35px;height:39px;object-fit:contain}
.estate-guest span{max-width:100%;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;font-size:10px;color:#d7d8bd}
.estate-guest i{position:absolute;top:31px;left:calc(50% + 12px);width:4px;height:4px;background:#b3c484;border-radius:50%}
.estate-guest[data-alive=false]{opacity:.48}
.estate-guest[data-alive=false] i{background:#c38877}
.estate-tools{display:flex;gap:4px;flex-shrink:0;padding-left:17px;border-left:1px solid #9eac8230}
.estate-tools button{width:36px;height:38px;display:grid;place-items:center;background:transparent;border:0;border-radius:3px;color:#bbc3ab}
.estate-tools button:hover{color:#edddb2;background:#b1b17a20}
.estate-tools button[aria-pressed=true]{color:#d9bd7e}
.estate-tool-error{position:absolute;right:30px;bottom:113px;margin:0;padding:10px 14px;background:#1c2b20;color:#ead9b7;border:1px solid #a8aa7a45;max-width:260px}
@media(min-width:1700px){.estate-header{padding-left:42px;padding-right:42px}.estate-nav{left:42px}.estate-bottom{padding-left:42px;padding-right:42px}.estate-guest canvas{width:42px;height:46px}.estate-bottom{min-height:104px}.estate-cast{max-width:1200px;margin:auto}.estate-guest{min-width:80px}}
@media(max-width:800px){.estate-header{padding:17px 16px;grid-template-columns:1fr auto;gap:10px}.estate-brand h1{font-size:21px}.estate-crest{width:32px;height:39px}.estate-brand p{font-size:9px}.estate-phase{position:absolute;right:16px;top:78px}.estate-totals{gap:13px}.estate-total strong{font-size:14px}.estate-total svg{display:none}.estate-nav{top:100px;left:16px}.estate-nav button{padding:0 10px;height:33px}.estate-location{top:147px;left:18px;right:auto;font-size:10px}.estate-room-menu{top:149px;left:16px}.estate-bottom{padding:10px 12px;gap:8px;min-height:91px}.estate-cast-heading{display:none}.estate-guest{min-width:56px}.estate-guest canvas{width:30px;height:35px}.estate-tools{padding-left:5px;flex-direction:column;gap:0}.estate-tools button{height:23px;width:27px}.estate-tools svg{width:15px;height:15px}.estate-subtitle{bottom:105px}.estate-total small{font-size:8px}}
@media(prefers-reduced-motion:reduce){.manor-hud *{transition:none!important}}
.estate-room-menu{max-height:calc(100% - 285px);overflow-y:auto}
@media(max-width:800px){
  .estate-brand h1{white-space:nowrap;font-size:21px}
  .estate-totals{gap:12px}
  .estate-total{display:flex;flex-direction:column;gap:5px;align-items:center}
  .estate-total svg{display:block;width:14px;height:14px}
  .estate-total strong{white-space:nowrap;font-size:14px}
  .estate-total small{display:none}
}
`;
