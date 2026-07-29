import { canUseLocalDb } from "@/db/local";

const DEVTOOLS_WINDOW_LABEL = "reeldock-devtools";
const DEVTOOLS_ROUTE = "/#/devtools";

export async function openDesktopDevtools() {
  if (!canUseLocalDb()) {
    window.location.assign(DEVTOOLS_ROUTE);
    return;
  }

  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const existing = await WebviewWindow.getByLabel(DEVTOOLS_WINDOW_LABEL);

  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }

  const devtoolsWindow = new WebviewWindow(DEVTOOLS_WINDOW_LABEL, {
    title: "ReelDock Devtools",
    url: DEVTOOLS_ROUTE,
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 620,
  });

  await new Promise<void>((resolve, reject) => {
    void devtoolsWindow.once("tauri://created", () => resolve());
    void devtoolsWindow.once("tauri://error", (event) => reject(event.payload));
  });

  await devtoolsWindow.setFocus();
}
