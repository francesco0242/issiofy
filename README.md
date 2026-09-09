# issiofy components

Free animated React components. Backgrounds, hero visuals, AI chat and border
effects — each one a self-contained TSX file that ships its own renderer
(a WebGL fragment shader or a 2D canvas), is typed, and falls back to a single
static frame when the visitor prefers reduced motion.

Live previews and a live editor: **[issiofy.com](https://issiofy.com)**

## Install

Every component is free and the registry is public — no account, no token:

```bash
npx shadcn@latest add https://issiofy.com/r/beam
```

Swap `beam` for any id from the table below. Or copy the file straight out of
`components/issiofy/` in this repo — that is the whole component.

## Components

| Component | What it is | Export | File |
| --- | --- | --- | --- |
| [AI Chat](https://issiofy.com/components/ai-chat) | A full agent conversation — streaming replies, tool calls and voice. | `AIChat` | `ai-chat.tsx` |
| [Border Beam](https://issiofy.com/components/beam) | An animated gradient border for cards, buttons and inputs. | `BorderBeam` | `border-beam.tsx` |
| [Thinking Orb](https://issiofy.com/components/orb) | A particle sphere for agent status: idle, thinking, speaking. | `ThinkingOrb` | `thinking-orb.tsx` |
| [Voice Blob](https://issiofy.com/components/voice-blob) | A shaded 3D blob that morphs with your voice pipeline state. | `VoiceBlob` | `voice-blob.tsx` |
| [Liquid Gradient](https://issiofy.com/components/gradient) | A grainy mesh gradient with editable palettes. | `Atmosphere` | `atmosphere.tsx` |
| [Flowing Ribbons](https://issiofy.com/components/ribbons) | Layered ribbons of light for hero sections. | `Visual` | `visual.tsx` |
| [Aurora](https://issiofy.com/components/aurora) | Northern-lights curtains drawn in a fragment shader. | `Visual` | `visual.tsx` |
| [Stardust](https://issiofy.com/components/particles) | A drifting starfield with a soft galactic core. | `Visual` | `visual.tsx` |
| [Wave Grid](https://issiofy.com/components/grid) | A perspective grid rolling over animated terrain. | `Visual` | `visual.tsx` |
| [Silk](https://issiofy.com/components/silk) | A rippling silk sheet with soft specular folds. | `Visual` | `visual.tsx` |

`visual.tsx` carries five background variants and `atmosphere.tsx` the
gradient, which is why 10 components live in 6 files.

## Usage

Give the parent an explicit height; the canvas fills it.

```tsx
import Visual from '@/components/issiofy/visual';

<div style={{ height: 400, position: 'relative' }}>
  <Visual variant="ribbons" color="#79baf2" />
</div>
```

Border Beam is the exception — it wraps its children and measures them:

```tsx
import BorderBeam from '@/components/issiofy/border-beam';

<BorderBeam radius={20} color="#a779ff">
  <div style={{ padding: 24 }}>Your content</div>
</BorderBeam>
```

## Requirements

React 19. No other dependency, with one exception: **AI Chat** needs
`motion` and `lucide-react`, plus the shadcn `button` and `select`
primitives. The shadcn command installs all of those for you.

## Accessibility

Every canvas is `aria-hidden` and sets `pointer-events: none` — the visuals
are decorative. Keep meaningful content in semantic HTML, give interactive
controls accessible names, and check text contrast after changing the accent
colour.

## License

MIT — free for personal and commercial projects, no attribution required.

---

Generated from the issiofy app — the components here are the source of truth
for what the registry serves. Found a bug? [Open an issue](https://github.com/francesco0242/issiofy/issues).
