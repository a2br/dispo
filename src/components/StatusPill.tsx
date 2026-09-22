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
    <div className={`min-w-0 ${big ? "text-base" : "text-sm"}`}>
      <div className="flex items-center gap-2 min-w-0">
        <StatusDot state={status.state} />
        <span className={`font-medium truncate ${tone}`}>{status.label}</span>
      </div>
      {/* Detail sits on its own line (aligned with the label), so a wrap never starts with "·". */}
      {status.detail && <div className="pl-[1.125rem] text-muted truncate">{status.detail}</div>}
    </div>
  );
}
