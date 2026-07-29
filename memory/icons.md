# Icons

ReelDock uses `@benrobo/iconary` for product icons.

## Imports

Use the web renderer from `@benrobo/iconary/react` in both `apps/desktop` and `apps/marketing`.

```tsx
import { Icon } from "@benrobo/iconary/react";
import { CameraVideoIcon } from "@benrobo/iconary/core/duotone-rounded";

<Icon icon={CameraVideoIcon} size={20} color="currentColor" />;
```

Use the same renderer with icon data from any approved style:

- `@benrobo/iconary/core/duotone-rounded`
- `@benrobo/iconary/core/solid-rounded`
- `@benrobo/iconary/core/twotone-rounded`

## Rules

- Read `.agents/skills/benrobo-iconary/SKILL.md` before adding or changing icons.
- Use `duotone-rounded`, `solid-rounded`, or `twotone-rounded` based on the visual weight and context.
- Prefer `duotone-rounded` for default product UI, `solid-rounded` for filled emphasis states, and `twotone-rounded` for brand, social, or more expressive moments.
- Style icon size, alignment, and color through Tailwind wrapper classes plus Iconary `size` and `color="currentColor"`.
- Verify icon exports in `~/projects/iconary/dist/generated/core/<style>/index.d.ts`.
- Do not use `lucide-react`, inline SVG, `@app/icons`, or local icon registries.
- Do not copy files from `~/projects/design-icons` into this repo.

## Current Examples

- `apps/desktop/src/App.tsx` uses `MonitorDotIcon`, `RecordIcon`, `Scissor01Icon`, `Settings01Icon`, `Plug01Icon`, `SmartPhone01Icon`, `CameraVideoIcon`, and `Mic01Icon`.
- `apps/marketing/src/app/page.tsx` uses Iconary for navigation, workflow cards, proof points, canvas ratios, and call-to-action controls.
- `packages/ui-preview/src/routes/*` uses Iconary for the sidebar nav and every button, transport, and row specimen.

`@reeldock/ui` primitives never import icons themselves. They accept icons as `ReactNode` props
(`leading`, `trailing`, `children`, `glyph`) so the consumer picks the style.
