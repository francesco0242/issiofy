<div align="center">

<img src="./assets/issiofy.png" alt="issiofy" height="120" />

# issiofy

### Animated React components that ship as source.

Free React components for motion, AI interfaces, code examples and everyday product workflows.

[![License](https://img.shields.io/github/license/francesco0242/issiofy?style=flat-square&color=a779ff&labelColor=18181b&label=license)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/francesco0242/issiofy?style=flat-square&color=a779ff&labelColor=18181b&logo=github&logoColor=white&label=stars)](https://github.com/francesco0242/issiofy/stargazers)
[![Components](https://img.shields.io/badge/-22-a779ff?style=flat-square&color=a779ff&labelColor=18181b&label=components)](https://issiofy.com/#components)
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
| **[Spotlight Card](https://issiofy.com/components/spotlight-card)** | A soft pointer-following light that brings cards and their edges into focus. | `SpotlightCard` | `spotlight-card.tsx` |
| **[Text Reveal](https://issiofy.com/components/text-reveal)** | Words and lines arrive with a soft blur, a gentle rise and considered timing. | `TextReveal` | `text-reveal.tsx` |
| **[Expandable Cards](https://issiofy.com/components/expandable-cards)** | Open a project in place, with flowing artwork, titles and details. | `ExpandableCards` | `expandable-cards.tsx` |
| **[Magnetic Button](https://issiofy.com/components/magnetic-button)** | A springy call to action with a magnetic surface and a fixed click target. | `MagneticButton` | `magnetic-button.tsx` |
| **[Image Ripple](https://issiofy.com/components/image-ripple)** | A touch sends a wave through the image, like light across water. | `ImageRipple` | `image-ripple.tsx` |
| **[Workflow Steps](https://issiofy.com/components/workflow-steps)** | A readable, animated pipeline for agents, jobs and multi-step tasks. | `WorkflowSteps` | `workflow-steps.tsx` |
| **[Liquid Metal](https://issiofy.com/components/metal)** | A cursor-reactive metallic surface for buttons, badges and controls. | `LiquidMetal` | `liquid-metal.tsx` |
| **[Holographic Card](https://issiofy.com/components/hologram)** | A foil surface that follows your pointer with depth and shifting light. | `Visual` | `interaction.tsx` |
| **[Audio Equalizer](https://issiofy.com/components/equalizer)** | Smooth audio bars for voice agents, players and live input. | `Visual` | `interaction.tsx` |
| **[Code Block](https://issiofy.com/components/code-block)** | Tabbed source files with syntax colors, line numbers and one-click copy. | `CodeBlock` | `code-block.tsx` |
| **[Image Compare](https://issiofy.com/components/image-compare)** | A before-and-after reveal that works with touch, pointer and keyboard. | `ImageCompare` | `image-compare.tsx` |
| **[Upload Queue](https://issiofy.com/components/upload-queue)** | File selection, progress and status — ready for your upload pipeline. | `UploadQueue` | `upload-queue.tsx` |
| **[Thinking Orb](https://issiofy.com/components/orb)** | A particle sphere for agent status: idle, thinking, speaking. | `ThinkingOrb` | `thinking-orb.tsx` |
| **[Voice Blob](https://issiofy.com/components/voice-blob)** | A shaded 3D blob that morphs with your voice pipeline state. | `VoiceBlob` | `voice-blob.tsx` |
| **[Liquid Gradient](https://issiofy.com/components/gradient)** | A grainy mesh gradient with editable palettes. | `Atmosphere` | `atmosphere.tsx` |
| **[Flowing Ribbons](https://issiofy.com/components/ribbons)** | Layered ribbons of light for hero sections. | `Visual` | `visual.tsx` |
| **[Aurora](https://issiofy.com/components/aurora)** | Northern-lights curtains drawn in a fragment shader. | `Visual` | `visual.tsx` |
| **[Stardust](https://issiofy.com/components/particles)** | A drifting starfield with a soft galactic core. | `Visual` | `visual.tsx` |
| **[Wave Grid](https://issiofy.com/components/grid)** | A perspective grid rolling over animated terrain. | `Visual` | `visual.tsx` |
| **[Silk](https://issiofy.com/components/silk)** | A rippling silk sheet with soft specular folds. | `Visual` | `visual.tsx` |

> `visual.tsx` carries five background variants and `atmosphere.tsx` the
> gradient, which is why 22 components live in 17 files.

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
