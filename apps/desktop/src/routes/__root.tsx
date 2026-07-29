import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { openDesktopDevtools } from "@/modules/devtools";

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.key.toLowerCase() !== "d") {
        return;
      }

      event.preventDefault();
      void openDesktopDevtools();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="bg-canvas text-fg font-ui flex h-screen flex-col overflow-hidden antialiased">
      <Outlet />
    </div>
  );
}
