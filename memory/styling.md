# Styling

ReelDock uses Tailwind CSS v4 through `@reeldock/tailwind-config`, and composes screens from
`@reeldock/ui` primitives.

## Source of Truth

The visual language is ported 1:1 from `docs/ReelDock design specification` (the `ReelDock UI Kit`
and `ReelDock` HTML files in the default worktree). **Do not re-tune those values.** If a screen
needs something the spec does not cover, add it as a token first, then build the primitive.

The recipe underneath everything: a 1px border, a top-to-bottom gradient of about 8% lightness, a
hairline highlight along the top edge, and a 1–2px drop shadow. Raised things gradient down and cast
a shadow; recessed things — tracks, wells, fields — invert both.

## Shared Package

- `packages/tailwind-config/globals.css` is the single stylesheet: it imports Tailwind, declares the
  full `@theme` token set, the `bg-hatch` utility, base element styles, and the `.rd-press` recipe.
  There is no second CSS file to keep in sync.
- `packages/tailwind-config/theme.ts` mirrors the same colour values for TypeScript consumers.
- `packages/tailwind-config/fonts.ts` exports the `ui` and `mono` stacks.

## Token Families

| Prefix                                          | Use                                                 |
| ----------------------------------------------- | --------------------------------------------------- |
| `canvas`, `surface`, `window`                   | App background, panel, chrome                       |
| `raised-*`, `raised-alt-*`                      | Rows and chips one step above the panel             |
| `control-*`, `bright-*`                         | Button fills (dark control, white primary)          |
| `accent-*`, `rec-*`, `ok-*`, `warn-*`           | Blue accent, record red, ready green, warning amber |
| `well-*`, `track-*`, `thumb-*`, `knob-*`        | Recessed surfaces and the parts that ride in them   |
| `fg`, `fg-2`, `fg-3`, `fg-label`, `fg-faint`, … | Text ramp, brightest to dimmest                     |
| `shadow-*`                                      | Complete composite shadows — never hand-roll one    |
| `ease-glide`, `ease-spring`                     | The two curves the spec uses                        |

## Rules

- Compose from `@reeldock/ui` before writing new markup. Reach for raw utilities only for layout.
- Use tokens, not raw hex. Arbitrary values are fine for one-off spacing and the spec's half-pixel
  type sizes (`text-[12.5px]`), not for colour or shadow.
- Put pressable surfaces on `rd-press`. It carries the whole press feel; do not add per-component
  active states.
- Keep press motion free of overshoot. A springy curve reads as a wobble on release.
- Do not create local Tailwind configs per app unless a framework requires a tiny adapter.
- Do not add app-specific CSS files for normal layout or component styling.

## App Wiring

- `apps/desktop/src/styles.css` imports `@reeldock/tailwind-config/globals.css`.
- `apps/desktop/vite.config.ts` registers `@tailwindcss/vite`.
- `apps/marketing/src/app/globals.css` imports the same file.
- `apps/marketing/postcss.config.mjs` registers `@tailwindcss/postcss`.
- `packages/ui-preview` registers `@tailwindcss/vite` and imports the same file.

## Previewing

`bun run dev:ui-preview` serves the kit on `http://localhost:7196` across four routes: Controls,
Surfaces, Selection, and Overlays. Add a specimen there whenever you add a primitive.
