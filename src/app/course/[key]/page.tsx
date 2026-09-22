import { redirect } from "next/navigation";

export default async function CourseRedirect({ params }: PageProps<"/course/[key]">) {
  const { key } = await params;
  redirect(`/discover/${key}`);
}
