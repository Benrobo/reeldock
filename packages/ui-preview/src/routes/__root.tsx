import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { Icon } from "@benrobo/iconary/react";
import type { IconData } from "@benrobo/iconary/core";
import {
  Layout01Icon,
  LayoutTable01Icon,
  MessageMultiple01Icon,
  SlidersHorizontalIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import { Badge } from "@reeldock/ui";

export const Route = createRootRoute({ component: RootLayout });

const NAV: { to: string; label: string; icon: IconData; hint: string }[] = [
  {
    to: "/",
    label: "Controls",
    icon: SlidersHorizontalIcon,
    hint: "Buttons, segments, switches, sliders",
  },
  {
    to: "/surfaces",
    label: "Surfaces",
    icon: LayoutTable01Icon,
    hint: "Panels, rows, banners, wells",
  },
  {
    to: "/selection",
    label: "Selection",
    icon: Layout01Icon,
    hint: "Pills, cards, swatches, fields",
  },
  {
    to: "/overlays",
    label: "Overlays",
    icon: MessageMultiple01Icon,
    hint: "Popovers, menus, dialogs",
  },
];

function RootLayout() {
  return (
    <div className="bg-canvas font-ui text-fg grid min-h-dvh grid-cols-[248px_minmax(0,1fr)] antialiased max-md:grid-cols-1">
      <aside className="border-surface-line bg-window sticky top-0 h-dvh overflow-y-auto border-r px-5 py-7 max-md:static max-md:h-auto">
        <div className="flex items-center gap-2.5">
          <div className="text-fg-label text-[11px] font-semibold uppercase tracking-[0.14em]">
            ReelDock
          </div>
          <Badge>UI kit</Badge>
        </div>
        <div className="mt-[7px] text-[19px] font-semibold tracking-[-0.022em]">
          Soft flat controls
        </div>
        <p className="text-fg-3 mt-1.5 text-[12.5px] leading-[1.5]">
          Every primitive in <code className="font-ui-mono text-fg-control">@reeldock/ui</code>,
          ported from the design specification.
        </p>

        <nav className="mt-7 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{
                className:
                  "border-accent bg-linear-to-b from-accent/[18%] to-accent/[7%] text-fg shadow-selected",
              }}
              className="flex items-start gap-3 rounded-[10px] border border-transparent px-3 py-2.5 transition-colors hover:bg-white/[5.5%]"
              inactiveProps={{ className: "text-fg-2" }}
              key={item.to}
              to={item.to}
            >
              <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
                <Icon color="currentColor" icon={item.icon} size={18} />
              </span>
              <span>
                <span className="block text-[13px] font-semibold">{item.label}</span>
                <span className="text-fg-label mt-0.5 block text-[11.5px]">{item.hint}</span>
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 px-11 pb-20 pt-11 max-md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
