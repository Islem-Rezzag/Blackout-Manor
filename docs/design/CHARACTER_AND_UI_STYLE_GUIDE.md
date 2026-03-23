# Character And UI Style Guide

This guide locks the visible identity rules for cast presentation and live spectator UI. It applies to runtime-facing presentation only and must remain privacy-safe.

## Character Silhouette Grammar
- Distinguish agents first by silhouette, not by color.
- Silhouette levers:
  - shoulder width and coat structure
  - cape, shawl, tailcoat, overskirt, or fitted jacket shape
  - hemline length and spread
  - mask outline and headwear edge
  - accessory scale and placement
  - posture bias while idle and while moving
- Characters should read as stylized realistic humans at whole-manor scale.
- No bean-body compression, no capsule torso shorthand, no toy-prop proportions.

## Formal Masquerade Costume Grammar
- Base language: late-19th-century-inspired formal masquerade, translated into readable top-down shapes.
- Menswear and masc-presenting silhouettes:
  - tailcoats
  - fitted jackets
  - waistcoats
  - gloves
  - capelets
- Womenswear and femme-presenting silhouettes:
  - layered skirts
  - fitted bodices
  - shawls
  - opera gloves
  - draped overlays
- Neutral presentation options:
  - long coats
  - structured jackets
  - asymmetrical drapes
  - mixed formal tailoring
- Masks should be elegant and individualized, not cartoon-identical.

## Body-Type Variety
- Include visible variety in height, shoulder mass, waist shape, stride length, and garment volume.
- The cast should include slim, broad, short, tall, and medium builds.
- Avoid assigning readability to body shape alone; silhouette must stay respectful and costume-driven.

## Accessory Language
- Each agent gets one primary accessory signal and, optionally, one secondary detail.
- Good primary accessories:
  - cane
  - fan
  - lapel flower
  - brooch
  - key ring
  - monocle chain
  - scarf or sash
  - gloves with distinctive cuff
- Accessories should help recognition in motion and in portraits without becoming comedy props.

## Color-Accent Rules
- Each agent gets one accent color plus a largely neutral base palette.
- Accent colors should live in jewel-tone or muted-gold families, not arcade primaries.
- Do not rely on color alone for identification.
- Interior lighting should push accents warm; storm or surveillance lighting should cool them without erasing identity.

## Public Visible Posture States
- `calm`: grounded stance, even weight, minimal gesture spread
- `alert`: forward attention, slightly raised shoulders, quicker head turns
- `suspicious`: guarded torso angle, reduced openness, more directional facing
- `shaken`: contracted posture, unstable spacing, visible hesitation
- `confident`: open chest, longer stride, controlled gesture range
- `defiant`: squared stance, direct facing, harder stop poses

These states must derive only from public match state and public events.

## Meeting Portrait Style
- Framing: bust or three-quarter bust, centered and mask-visible.
- Lighting: soft directional key with restrained rim light.
- Identity carryover: portrait must repeat the avatar's mask, accessory, silhouette cues, and accent color.
- Meeting portraits should feel theatrical and premium, not like debug roster tiles.

## Speech Bubble Rules
- Public speech only.
- One to two short lines maximum.
- Anchor bubble to the speaking avatar or portrait source.
- Bubble style should feel like a premium broadcast caption, not comic-book chaos.
- Prefer subtitle-strip sync for longer public lines; use bubbles for short interpersonal beats.

## Action Badge Rules
- Use concise, readable symbols or chips for public actions only.
- Core badge families:
  - report
  - sabotage
  - clue
  - accuse
  - reassure
  - protect
  - vote pressure
- Badges should sit near the avatar or portrait without covering the face or pathing lanes.
- Badges are emphasis tools, not replacement UI panels.

## Event-Board Placement Rules
- Primary placement: upper-left or upper-safe margin outside the busiest traversal lanes.
- In room-focus mode, the event board may compress but should not cover the main hotspot.
- In meeting mode, the board must not block portraits, table edges, or vote staging.
- It should feel like a restrained live broadcast overlay, not a dev inspector.

## What Should Feel Sims-Like
- Cutaway room readability
- believable furniture logic
- human-scale walking through doorways
- rooms with social and domestic purpose
- clear spatial hierarchy between hall, private rooms, and service rooms

## What Should Explicitly Not Feel Like Among Us
- bean or capsule silhouettes
- flat sci-fi room identity
- oversized icon-first emergency framing
- empty rooms with only one obvious toy prop
- UI language that implies parody or party-game minimalism

## Privacy And Benchmark Discipline
- No private reasoning text.
- No hidden-role analytics in live play.
- No benchmark or fairness panels in the main spectator runtime.
- Character readability must come from public state, public action, and cinematic staging only.
