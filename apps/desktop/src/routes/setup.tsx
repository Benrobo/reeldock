import { createFileRoute } from "@tanstack/react-router";
import { SetupPage } from "@/modules/setup";

export const Route = createFileRoute("/setup")({ component: SetupPage });
