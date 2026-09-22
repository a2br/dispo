import type { StatusView } from "@/lib/present";

export function StatusDot({ state }: { state: StatusView["state"] }) {
  const color = state === "free" ? "bg-free" : state === "busy" ? "bg-busy" : "bg-muted/50";
  return <span className={`inline-block size-2.5 rounded-full ${color}`} />;
}

export function StatusPill({ status, big = false }: { status: StatusView; big?: boolean }) {
  const tone =
    status.state === "free"
      ? "text-free"
      : status.state === "busy"
        ? "text-busy"
        : "text-muted";
  return (
    <div className={`flex items-center gap-x-2 flex-wrap min-w-0 ${big ? "text-base" : "text-sm"}`}>
      <StatusDot state={status.state} />
      <span className={`font-medium whitespace-nowrap ${tone}`}>{status.label}</span>
      {status.detail && <span className="text-muted truncate max-w-full">· {status.detail}</span>}
    </div>
  );
}
