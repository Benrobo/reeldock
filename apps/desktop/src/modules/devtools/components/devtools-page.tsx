import { Link } from "@tanstack/react-router";
import { ArrowLeft01Icon } from "@benrobo/iconary/core/duotone-rounded";
import { StorageDevtools } from "@reeldock/devtools";
import { Button } from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import { storageInspector } from "@/modules/devtools/lib/storage-inspector";

export function DevtoolsPage() {
  return (
    <div className="bg-canvas flex h-full flex-col">
      <header className="border-titlebar-line bg-titlebar flex h-[52px] items-center justify-between border-b px-5">
        <div>
          <div className="text-[13px] font-semibold">ReelDock Devtools</div>
          <div className="text-fg-3 mt-0.5 text-[11.5px]">
            Storage inspector runs outside onboarding.
          </div>
        </div>
        <Link to="/">
          <Button leading={<ColorIcon icon={ArrowLeft01Icon} size={15} tone="back" />} size="mini">
            Back to app
          </Button>
        </Link>
      </header>
      <div className="min-h-0 flex-1">
        <StorageDevtools adapter={storageInspector} />
      </div>
    </div>
  );
}
