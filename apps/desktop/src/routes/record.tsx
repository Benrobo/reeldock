import { createFileRoute } from "@tanstack/react-router";
import { RecordingPage } from "@/modules/recording";

export const Route = createFileRoute("/record")({ component: RecordingPage });
