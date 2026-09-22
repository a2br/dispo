import type { User } from "@/db/schema";
import { Avatar } from "./Avatar";

/** Tappable rows with a checkbox each; submits as repeated `member` fields. */
export function PeopleChecklist({ people, checked = [] }: { people: User[]; checked?: string[] }) {
  return (
    <ul className="border border-line divide-y divide-line">
      {people.map((p) => (
        <li key={p.id}>
          <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-subtle has-[:checked]:bg-subtle">
            <Avatar name={p.name} image={p.image} size={32} />
            <span className="flex-1 min-w-0 truncate font-bold">{p.name}</span>
            <input type="checkbox" name="member" value={p.id} defaultChecked={checked.includes(p.id)} className="size-5 accent-[var(--accent)]" />
          </label>
        </li>
      ))}
    </ul>
  );
}
