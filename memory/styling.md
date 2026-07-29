# Styling

ReelDock uses Tailwind CSS v4 through `@reeldock/tailwind-config`.

## Shared Package

- `packages/tailwind-config/globals.css` imports Tailwind, defines `@theme` tokens, sets source scanning for `apps/*` and `packages/*`, and owns base element styles.
- `packages/tailwind-config/theme.ts` exports matching token values for TypeScript consumers.
- `packages/tailwind-config/fonts.ts` exports the shared font stacks.

## App Wiring

- `apps/desktop/src/styles.css` imports `@reeldock/tailwind-config/globals.css`.
- `apps/desktop/vite.config.ts` registers `@tailwindcss/vite`.
- `apps/marketing/src/app/globals.css` imports `@reeldock/tailwind-config/globals.css`.
- `apps/marketing/postcss.config.mjs` registers `@tailwindcss/postcss`.

## Rules

- Prefer Tailwind utilities in components.
- Add reusable visual tokens to the shared Tailwind package.
- Do not create local Tailwind configs per app unless a framework requires a tiny adapter.
- Do not add large app-specific CSS files for normal layout or component styling.
