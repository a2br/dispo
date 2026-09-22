import Link from "next/link";

export default function NotFound() {
  return (
    <main className="py-20 text-center space-y-3">
      <h1 className="text-2xl font-bold">Nothing here</h1>
      <p className="text-muted">This page doesn’t exist, or it isn’t visible to you.</p>
      <Link href="/" className="inline-block link font-medium">Back home</Link>
    </main>
  );
}
