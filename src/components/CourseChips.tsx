import Link from "next/link";
import type { Course } from "@/lib/classmates";
import { toneFor } from "@/lib/present";

export function CourseChip({ course, link = true }: { course: Course; link?: boolean }) {
  const t = toneFor(course.name);
  const cls = "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap";
  const style = { background: t.bg, borderColor: t.border, color: t.text } as const;
  const label = course.code ?? course.name;
  if (!link) return <span className={cls} style={style} title={course.name}>{label}</span>;
  return (
    <Link href={`/discover/${encodeURIComponent(course.key)}`} className={`${cls} active:opacity-70`} style={style} title={course.name}>
      {label}
    </Link>
  );
}

export function CourseChips({ courses, max, link = true }: { courses: Course[]; max?: number; link?: boolean }) {
  const shown = max ? courses.slice(0, max) : courses;
  const rest = courses.length - shown.length;
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle">
      {shown.map((c) => (
        <CourseChip key={c.key} course={c} link={link} />
      ))}
      {rest > 0 && <span className="text-[11px] text-muted self-center">+{rest}</span>}
    </span>
  );
}
