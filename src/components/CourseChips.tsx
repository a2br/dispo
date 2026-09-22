import Link from "next/link";
import type { Course } from "@/lib/classmates";
import { hueFor } from "@/lib/present";

export function CourseChip({ course, link = true }: { course: Course; link?: boolean }) {
  const h = hueFor(course.name);
  const cls = "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap";
  const style = { background: `hsl(${h} 70% 92%)`, borderColor: `hsl(${h} 60% 75%)`, color: `hsl(${h} 45% 25%)` } as const;
  const label = course.code ?? course.name;
  if (!link) return <span className={cls} style={style} title={course.name}>{label}</span>;
  return (
    <Link href={`/course/${encodeURIComponent(course.key)}`} className={`${cls} active:opacity-70`} style={style} title={course.name}>
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
