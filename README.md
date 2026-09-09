<div align="center">

<img src="./assets/issiofy.png" alt="issiofy" height="120" />

# issiofy

### Animated React components that ship as source.

Ten free WebGL and canvas components for backgrounds, hero visuals, AI chat and border effects.

[![License](https://img.shields.io/github/license/francesco0242/issiofy?style=flat-square&color=a779ff&labelColor=18181b&label=license)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/francesco0242/issiofy?style=flat-square&color=a779ff&labelColor=18181b&logo=github&logoColor=white&label=stars)](https://github.com/francesco0242/issiofy/stargazers)
[![Components](https://img.shields.io/badge/-10-a779ff?style=flat-square&color=a779ff&labelColor=18181b&label=components)](https://issiofy.com/#components)
[![React](https://img.shields.io/badge/-19-a779ff?style=flat-square&color=a779ff&labelColor=18181b&logo=react&logoColor=white&label=react)](https://react.dev)

**[🌐 Live previews](https://issiofy.com)** · **[⚡ Quick start](#install)** · **[🎛️ Studio](https://issiofy.com/#components)** · **[🤖 llms.txt](https://issiofy.com/llms.txt)**

</div>

---

Every component is a single self-contained TSX file. It ships its own renderer —
a WebGL fragment shader or a 2D canvas — is fully typed, has no build step, and
falls back to one static frame when the visitor prefers reduced motion.

## Install

The registry is public. No account, no token, no API key:

```bash
npx shadcn@latest add https://issiofy.com/r/beam
```

Swap `beam` for any id from the table below. Or just copy the file out of
`components/issiofy/` — that is the entire component.

## Components

| Component | What it is | Export | File |
| --- | --- | --- | --- |
| **[AI Chat](https://issiofy.com/components/ai-chat)** | A full agent conversation — streaming replies, tool calls and voice. | `AIChat` | `ai-chat.tsx` |
| **[Border Beam](https://issiofy.com/components/beam)** | An animated gradient border for cards, buttons and inputs. | `BorderBeam` | `border-beam.tsx` |
| **[Thinking Orb](https://issiofy.com/components/orb)** | A particle sphere for agent status: idle, thinking, speaking. | `ThinkingOrb` | `thinking-orb.tsx` |
| **[Voice Blob](https://issiofy.com/components/voice-blob)** | A shaded 3D blob that morphs with your voice pipeline state. | `VoiceBlob` | `voice-blob.tsx` |
| **[Liquid Gradient](https://issiofy.com/components/gradient)** | A grainy mesh gradient with editable palettes. | `Atmosphere` | `atmosphere.tsx` |
| **[Flowing Ribbons](https://issiofy.com/components/ribbons)** | Layered ribbons of light for hero sections. | `Visual` | `visual.tsx` |
| **[Aurora](https://issiofy.com/components/aurora)** | Northern-lights curtains drawn in a fragment shader. | `Visual` | `visual.tsx` |
| **[Stardust](https://issiofy.com/components/particles)** | A drifting starfield with a soft galactic core. | `Visual` | `visual.tsx` |
| **[Wave Grid](https://issiofy.com/components/grid)** | A perspective grid rolling over animated terrain. | `Visual` | `visual.tsx` |
| **[Silk](https://issiofy.com/components/silk)** | A rippling silk sheet with soft specular folds. | `Visual` | `visual.tsx` |

> `visual.tsx` carries five background variants and `atmosphere.tsx` the
> gradient, which is why 10 components live in 6 files.

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

React 19, and nothing else — with one exception. **AI Chat** needs `motion`
and `lucide-react` plus the shadcn `button` and `select` primitives; the
install command pulls all of them in for you.

## Building with an AI agent

[`https://issiofy.com/llms.txt`](https://issiofy.com/llms.txt) describes every component, its
import path and its props in a form an agent can act on. Point Claude, Cursor
or ChatGPT at it and ask for what you want.

## Accessibility

Every canvas is `aria-hidden` and sets `pointer-events: none` — these
visuals are decorative. Keep meaningful content in semantic HTML, give
interactive controls accessible names, and re-check text contrast after
changing the accent colour.

## Contributing

Bug reports and component ideas are welcome — see
[CONTRIBUTING.md](./CONTRIBUTING.md). These files are generated from the
issiofy app, so please open an issue rather than a pull request against
`components/`.

## License

[MIT](./LICENSE) — free for personal and commercial projects, no attribution
required.

<div align="center">

**[issiofy.com](https://issiofy.com)**

</div>
