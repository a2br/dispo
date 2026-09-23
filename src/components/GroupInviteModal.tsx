import type { PendingInvite } from "@/lib/groups";
import { answerInviteAction } from "@/app/actions";
import { button } from "@/lib/ui";
import { Avatar } from "./Avatar";
import { getT } from "@/i18n/server";

/** A pending group invitation, shown over Now until it's answered (one at a time). */
export async function GroupInviteModal({ invite, more }: { invite: PendingInvite; more: number }) {
  const t = (await getT()).now.groupInvite;
  const first = (n: string) => n.split(" ")[0];
  const names = invite.people.map((p) => first(p.name));
  return (
    <div className="fixed inset-0 z-40 grid items-end justify-items-center sm:items-center bg-foreground/40 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4 animate-fade" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="w-full max-w-md bg-surface border border-line p-5 space-y-4 animate-in">
        <div className="flex gap-1">
          {invite.people.slice(0, 5).map((p) => (
            <Avatar key={p.id} name={p.name} size={36} />
          ))}
        </div>
        <div className="space-y-1">
          <h2 id="invite-title" className="text-xl font-bold tracking-tight">
            {t.title(invite.inviter.name, invite.group.name)}
          </h2>
          <p className="text-sm text-muted">
            {t.members(names.slice(0, 3), Math.max(0, names.length - 3))} {t.note}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={answerInviteAction} className="flex-1">
            <input type="hidden" name="groupId" value={invite.group.id} />
            <input type="hidden" name="accept" value="0" />
            <button className={button("secondary", "md", "w-full")}>{t.decline}</button>
          </form>
          <form action={answerInviteAction} className="flex-1">
            <input type="hidden" name="groupId" value={invite.group.id} />
            <input type="hidden" name="accept" value="1" />
            <button className={button("primary", "md", "w-full")}>{t.accept}</button>
          </form>
        </div>
        {more > 0 && <p className="text-xs text-muted text-center">{t.more(more)}</p>}
      </div>
    </div>
  );
}
