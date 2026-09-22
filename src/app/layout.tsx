import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "dispo: who’s free at EPFL?", template: "%s · dispo" },
  description: "See your friends’ EPFL timetables side by side and find a time in one look.",
  openGraph: { siteName: "dispo", type: "website", title: "dispo: who’s free at EPFL?", description: "See your friends’ EPFL timetables side by side and find a time in one look." },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "dispo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {user && <AppNav me={{ id: user.id, name: user.name, email: user.email, image: user.image }} />}
        <div className={user ? "pb-[var(--nav-h)] md:pl-64" : ""}>
          <div className="mx-auto w-full max-w-6xl px-4 md:px-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
