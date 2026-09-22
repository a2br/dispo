import type { PendingInvite } from "@/lib/groups";
import { answerInviteAction } from "@/app/actions";
import { button } from "@/lib/ui";
import { Avatar } from "./Avatar";

/** A pending group invitation, shown over Now until it's answered (one at a time). */
export function GroupInviteModal({ invite, more }: { invite: PendingInvite; more: number }) {
  const first = (n: string) => n.split(" ")[0];
  const names = invite.people.map((p) => first(p.name));
  return (
    <div className="fixed inset-0 z-40 grid place-items-end sm:place-items-center bg-foreground/40 p-4 pb-[calc(var(--nav-h)+1rem)] sm:pb-4 animate-fade" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="w-full max-w-md bg-surface border border-line p-5 space-y-4 animate-in">
        <div className="flex gap-1">
          {invite.people.slice(0, 5).map((p) => (
            <Avatar key={p.id} name={p.name} image={p.image} size={36} />
          ))}
        </div>
        <div className="space-y-1">
          <h2 id="invite-title" className="text-xl font-bold tracking-tight">
            {invite.inviter.name} invited you to “{invite.group.name}”
          </h2>
          <p className="text-sm text-muted">
            {names.slice(0, 3).join(", ")}
            {names.length > 3 ? ` and ${names.length - 3} more` : ""} {names.length === 1 ? "is" : "are"} in it. If you join, the group can see when you’re free (free/busy only).
          </p>
        </div>
        <div className="flex gap-2">
          <form action={answerInviteAction} className="flex-1">
            <input type="hidden" name="groupId" value={invite.group.id} />
            <input type="hidden" name="accept" value="0" />
            <button className={button("secondary", "md", "w-full")}>Decline</button>
          </form>
          <form action={answerInviteAction} className="flex-1">
            <input type="hidden" name="groupId" value={invite.group.id} />
            <input type="hidden" name="accept" value="1" />
            <button className={button("primary", "md", "w-full")}>Accept</button>
          </form>
        </div>
        {more > 0 && <p className="text-xs text-muted text-center">{more} more invitation{more === 1 ? "" : "s"} after this one</p>}
      </div>
    </div>
  );
}
