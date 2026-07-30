import {
  AppleFinderIcon,
  Bug02Icon,
  CameraVideoIcon,
  Copy01Icon,
  Delete02Icon,
  FolderOpenIcon,
  Mic01Icon,
  MoreVerticalIcon,
  SmartPhone01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import {
  ActivitySpinner,
  Button,
  GroupLabel,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  StatusDot,
  SurfaceRow,
  Tag,
} from "@reeldock/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ColorIconTone } from "@/components/color-icon";
import { ColorIcon } from "@/components/color-icon";
import { Logo } from "@/components/logo";
import { timecode } from "@/lib/format";
import { useCaptureSources } from "@/modules/capture";
import { openDesktopDevtools } from "@/modules/devtools";
import { useOnboardingRequirements } from "@/modules/onboarding";
import { useProject } from "@/modules/project";
import { projectFilesService, type ProjectSummary, projectsService } from "@/services";

const sourceIcons = {
  phone: SmartPhone01Icon,
  webcam: CameraVideoIcon,
  microphone: Mic01Icon,
} as const;

const sourceTones = {
  phone: "phone",
  webcam: "camera",
  microphone: "microphone",
} as const satisfies Record<keyof typeof sourceIcons, ColorIconTone>;

export function HomePage() {
  const { sources } = useCaptureSources();
  const onboarding = useOnboardingRequirements();
  const navigate = useNavigate();
  const loadProject = useProject((state) => state.loadProject);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  const loadProjects = () => {
    let cancelled = false;

    projectsService
      .list()
      .then((items) => {
        if (!cancelled) {
          setProjects(items);
          setStorageError(null);
          setLoadingProjects(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStorageError("Open ReelDock in the desktop app to use local SQLite storage.");
          setLoadingProjects(false);
        }
      });

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return loadProjects();
  }, []);

  useEffect(() => {
    if (onboarding.loading || onboarding.complete) return;
    void navigate({ to: "/permissions" });
  }, [navigate, onboarding.complete, onboarding.loading]);

  const startSetup = async () => {
    await navigate({ to: "/setup" });
  };

  const openProject = async (project: ProjectSummary) => {
    try {
      const saved = await projectsService.save(project);
      loadProject(saved);
      await navigate({ to: "/edit" });
    } catch {
      setStorageError("Could not open the project because local SQLite is unavailable.");
    }
  };

  const duplicateProject = async (project: ProjectSummary) => {
    try {
      const copy = await projectsService.duplicate(project);
      setProjects((items) => [copy, ...items]);
      setStorageError(null);
    } catch {
      setStorageError("Could not duplicate the project because local SQLite is unavailable.");
    }
  };

  const revealProject = async (project: ProjectSummary) => {
    try {
      await projectFilesService.revealProjectInFinder(project.path);
      setStorageError(null);
    } catch {
      setStorageError("Could not reveal the project in Finder.");
    }
  };

  const deleteProject = async (project: ProjectSummary) => {
    try {
      await projectsService.delete(project.id);
      setProjects((items) => items.filter((item) => item.id !== project.id));
      setStorageError(null);
    } catch {
      setStorageError("Could not delete the project because local SQLite is unavailable.");
    }
  };

  const statusTone = (status: ProjectSummary["status"]) => {
    if (status === "recording" || status === "failed") return "rec";
    if (status === "exported") return "ok";
    if (status === "draft") return "warn";
    return "neutral";
  };

  return (
    <main className="bg-window flex h-full flex-col overflow-hidden">
      <header className="flex items-end justify-between gap-8 px-12 pt-11">
        <div>
          <Logo />
          <p className="text-fg-3 mt-1.5 text-sm">
            Connect your phone, record your app and camera together.
          </p>
        </div>
        <Button
          leading={<ColorIcon icon={Bug02Icon} size={15} tone="menu" />}
          onClick={() => void openDesktopDevtools()}
          size="mini"
        >
          Devtools
        </Button>
        <Button
          disabled={onboarding.loading}
          leading={
            onboarding.loading ? (
              <ActivitySpinner size={16} />
            ) : (
              <span className="grid size-[18px] place-items-center">
                <span className="block size-[9px] rounded-full bg-white" />
              </span>
            )
          }
          onClick={() => void startSetup()}
          size="md"
          variant="record"
        >
          New recording
        </Button>
      </header>

      <section className="grid grid-cols-3 gap-3.5 px-12 pt-7">
        {sources.map((source) => (
          <SurfaceRow key={source.id} tone={source.state === "available" ? "ok" : "warn"}>
            <ColorIcon badge icon={sourceIcons[source.kind]} tone={sourceTones[source.kind]} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold">{source.label}</div>
              <div className="text-fg-3 mt-0.5 text-xs">
                {source.state === "available" ? "Ready for recording" : "Needs attention"}
              </div>
            </div>
          </SurfaceRow>
        ))}
      </section>

      <section className="flex items-center justify-between px-12 pt-8">
        <GroupLabel>Recent projects</GroupLabel>
        <Link
          onClick={() => {
            const project = projects[0];
            if (project) loadProject(project);
          }}
          to="/edit"
        >
          <Button leading={<ColorIcon icon={FolderOpenIcon} size={15} tone="back" />} size="mini">
            Open from Finder
          </Button>
        </Link>
      </section>

      {storageError ? <div className="text-warn-fg px-12 pt-3 text-sm">{storageError}</div> : null}

      <section className="min-h-0 flex-1 overflow-y-auto px-12 pb-12 pt-4">
        <div className="grid grid-cols-4 gap-4">
          {loadingProjects ? (
            <div className="text-fg-3 col-span-4 flex items-center gap-2 text-sm">
              <ActivitySpinner size={16} />
              Loading projects
            </div>
          ) : null}
          {!loadingProjects && projects.length === 0 ? (
            <div className="text-fg-3 col-span-4 text-sm">No projects yet.</div>
          ) : null}
          {projects.map((project) => (
            <article className="group relative min-w-0" key={project.id}>
              <button
                className="w-full cursor-pointer text-left"
                onClick={() => void openProject(project)}
                type="button"
              >
                <div className="border-group-line bg-hatch relative aspect-video overflow-hidden rounded-[10px] border">
                  <div className="text-fg-key font-ui-mono absolute inset-0 grid place-items-center text-[9.5px] uppercase tracking-[0.1em]">
                    thumbnail
                  </div>
                  <Tag className="absolute bottom-2 right-2">
                    {timecode(project.durationSeconds)}
                  </Tag>
                </div>
                <div className="text-fg group-hover:text-bright-top mt-2.5 truncate text-[13px] font-semibold transition-colors">
                  {project.name}
                </div>
                <div className="text-fg-hint mt-[3px] flex items-center gap-1.5 text-[11.5px]">
                  <StatusDot size={5} tone={statusTone(project.status)} />
                  <span className="truncate">
                    {project.status} - {project.canvasRatio}
                  </span>
                </div>
              </button>
              <div className="absolute right-2 top-2 z-10">
                <Popover
                  closeOnContentClick
                  content={
                    <Menu className="min-w-[188px]">
                      <MenuItem onSelect={() => void revealProject(project)}>
                        <span className="flex items-center gap-2.5">
                          <ColorIcon icon={AppleFinderIcon} size={14} tone="back" />
                          Open in Finder
                        </span>
                      </MenuItem>
                      <MenuItem onSelect={() => void duplicateProject(project)}>
                        <span className="flex items-center gap-2.5">
                          <ColorIcon icon={Copy01Icon} size={14} tone="menu" />
                          Duplicate
                        </span>
                      </MenuItem>
                      <MenuItem danger onSelect={() => void deleteProject(project)}>
                        <span className="flex items-center gap-2.5">
                          <ColorIcon icon={Delete02Icon} size={14} tone="record" />
                          Delete
                        </span>
                      </MenuItem>
                    </Menu>
                  }
                  side="bottom"
                >
                  <IconButton aria-label={`Project options for ${project.name}`} className="size-7">
                    <ColorIcon icon={MoreVerticalIcon} size={15} tone="menu" />
                  </IconButton>
                </Popover>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
