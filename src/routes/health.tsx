import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/health")({
  component: HealthComponent,
});

function HealthComponent() {
  const data = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">Health Status</h1>
        <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
