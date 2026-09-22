import { redirect } from "next/navigation";

/** Old address of Find a time, now part of Calendar. Keeps bookmarks and shared links working. */
export default async function GroupRedirect({ searchParams }: PageProps<"/group">) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") params.set(k, v);
  redirect(`/calendar${params.size ? `?${params}` : ""}`);
}
