import Link from "next/link";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const t = (await getT()).pages.notFound;
  return (
    <main className="py-20 text-center space-y-3">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p className="text-muted">{t.text}</p>
      <Link href="/" className="inline-block link font-medium">{t.home}</Link>
    </main>
  );
}
