import {
  ArrowLeft01Icon,
  FolderExportIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import { Button } from "@reeldock/ui";
import { Link } from "@tanstack/react-router";
import { ColorIcon } from "@/components/color-icon";

type EditorHeaderProps = {
  projectName?: string;
  isEdited: boolean;
  storageError: string | null;
  onOpenExport: () => void;
};

export function EditorHeader({
  projectName,
  isEdited,
  storageError,
  onOpenExport,
}: EditorHeaderProps) {
  return (
    <header className="border-titlebar-line bg-titlebar flex h-[52px] items-center gap-3.5 border-b px-[18px]">
      <Link to="/">
        <Button
          leading={<ColorIcon icon={ArrowLeft01Icon} size={15} tone="back" />}
          size="mini"
        >
          Projects
        </Button>
      </Link>
      <div className="text-[13px] font-semibold">
        {projectName ?? "ReelDock project"}
      </div>
      <div className="text-fg-hint text-xs">
        {isEdited ? "Edited" : "Saved"}
      </div>
      {storageError ? (
        <div className="text-warn-fg text-xs">{storageError}</div>
      ) : null}
      <div className="flex-1" />
      <Button
        leading={<ColorIcon icon={FolderExportIcon} size={15} tone="export" />}
        onClick={onOpenExport}
        variant="accent"
        size="sm"
      >
        Export
      </Button>
    </header>
  );
}
