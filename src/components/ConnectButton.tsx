import type { Relation } from "@/lib/access";
import { acceptConnection, removeConnection, requestConnection } from "@/app/actions";
import { ConfirmAction } from "./ConfirmAction";

const base = "rounded-full px-4 py-2 text-sm font-semibold active:opacity-70";

export function ConnectButton({ userId, rel }: { userId: string; rel: Relation }) {
  switch (rel.kind) {
    case "self":
      return null;
    case "none":
      return (
        <form action={requestConnection}>
          <input type="hidden" name="userId" value={userId} />
          <button className={`${base} bg-accent text-white`}>Connect</button>
        </form>
      );
    case "outgoing":
      return (
        <ConfirmAction
          fields={{ userId }}
          action={removeConnection}
          label="Requested"
          question="Cancel request?"
          confirmLabel="Cancel it"
          className={`${base} bg-surface border border-line text-muted`}
        />
      );
    case "incoming":
      return (
        <div className="flex gap-2">
          <form action={acceptConnection}>
            <input type="hidden" name="userId" value={userId} />
            <button className={`${base} bg-free text-white`}>Accept</button>
          </form>
          <form action={removeConnection}>
            <input type="hidden" name="userId" value={userId} />
            <button className={`${base} bg-surface border border-line text-muted`}>Decline</button>
          </form>
        </div>
      );
    case "accepted":
      return (
        <ConfirmAction
          fields={{ userId }}
          action={removeConnection}
          label="Connected ✓"
          question="Remove connection?"
          confirmLabel="Remove"
          className={`${base} bg-surface border border-line`}
        />
      );
  }
}
