import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "@/modules/editor";

export const Route = createFileRoute("/edit")({ component: EditorPage });
