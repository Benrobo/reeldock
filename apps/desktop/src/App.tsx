import { RouterProvider, createHashHistory, createRouter } from "@tanstack/react-router";
import { tippy } from "@tippyjs/react";
import { routeTree } from "./routeTree.gen";

function normalizeDirectPathForHashHistory() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/" || window.location.pathname === "/index.html") return;

  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const path = `${pathname}${window.location.search}`;
  window.location.replace(`${window.location.origin}/#${path}`);
}

normalizeDirectPathForHashHistory();

tippy.setDefaultProps({
  animation: "fade",
  delay: [180, 0],
  duration: [140, 100],
  offset: [0, 9],
  theme: "reeldock",
});

const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
