import type { Relation } from "@/lib/access";
import { acceptConnection, removeConnection, requestConnection } from "@/app/actions";
import { button } from "@/lib/ui";
import { ConfirmAction } from "./ConfirmAction";

export function ConnectButton({ userId, rel }: { userId: string; rel: Relation }) {
  switch (rel.kind) {
    case "self":
      return null;
    case "none":
      return (
        <form action={requestConnection}>
          <input type="hidden" name="userId" value={userId} />
          <button className={button("primary")}>Connect</button>
        </form>
      );
    case "outgoing":
      return <ConfirmAction fields={{ userId }} action={removeConnection} label="Requested" question="Cancel request?" confirmLabel="Cancel it" className={button("secondary", "sm", "text-muted")} />;
    case "incoming":
      return (
        <div className="flex gap-2">
          <form action={acceptConnection}>
            <input type="hidden" name="userId" value={userId} />
            <button className={button("success")}>Accept</button>
          </form>
          <form action={removeConnection}>
            <input type="hidden" name="userId" value={userId} />
            <button className={button("secondary")}>Decline</button>
          </form>
        </div>
      );
    case "accepted":
      return <ConfirmAction fields={{ userId }} action={removeConnection} label="Connected ✓" question="Remove connection?" confirmLabel="Remove" className={button("secondary")} />;
  }
}
