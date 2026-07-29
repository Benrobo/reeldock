import { createFileRoute } from "@tanstack/react-router";
import { DevtoolsPage } from "@/modules/devtools";

export const Route = createFileRoute("/devtools")({ component: DevtoolsPage });
