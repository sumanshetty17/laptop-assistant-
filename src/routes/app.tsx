import { createFileRoute } from "@tanstack/react-router";
import { OrbitApp } from "@/components/orbit-app";

export const Route = createFileRoute("/app")({ component: AppPage });

function AppPage() {
  return <OrbitApp />;
}
