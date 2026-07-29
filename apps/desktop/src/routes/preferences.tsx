import { createFileRoute } from "@tanstack/react-router";
import { PreferencesPage } from "@/modules/preferences";

export const Route = createFileRoute("/preferences")({ component: PreferencesPage });
