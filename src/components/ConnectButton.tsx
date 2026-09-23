import type { Relation } from "@/lib/access";
import { acceptConnection, removeConnection, requestConnection } from "@/app/actions";
import { button } from "@/lib/ui";
import { ConfirmAction } from "./ConfirmAction";
import { getT } from "@/i18n/server";

export async function ConnectButton({ userId, rel }: { userId: string; rel: Relation }) {
  const t = (await getT()).people.connect;
  switch (rel.kind) {
    case "self":
      return null;
    case "none":
      return (
        <form action={requestConnection}>
          <input type="hidden" name="userId" value={userId} />
          <button className={button("primary")}>{t.connect}</button>
        </form>
      );
    case "outgoing":
      return <ConfirmAction fields={{ userId }} action={removeConnection} label={t.requested} question={t.cancelQuestion} confirmLabel={t.cancelConfirm} className={button("secondary", "sm", "text-muted")} />;
    case "incoming":
      return (
        <div className="flex gap-2">
          <form action={acceptConnection}>
            <input type="hidden" name="userId" value={userId} />
            <button className={button("success")}>{t.accept}</button>
          </form>
          <form action={removeConnection}>
            <input type="hidden" name="userId" value={userId} />
            <button className={button("secondary")}>{t.decline}</button>
          </form>
        </div>
      );
    case "accepted":
      return <ConfirmAction fields={{ userId }} action={removeConnection} label={t.connected} question={t.removeQuestion} confirmLabel={t.removeConfirm} className={button("secondary")} />;
  }
}
