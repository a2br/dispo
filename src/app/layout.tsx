import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { getLocale, getT } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/client";
import { LOCALE_TAGS } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title: { default: t.meta.title, template: "%s · dispo" },
    description: t.meta.description,
    openGraph: { siteName: "dispo", type: "website", title: t.meta.title, description: t.meta.description },
    twitter: { card: "summary_large_image" },
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: "dispo", statusBarStyle: "default" },
  };
}

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
  const [user, locale] = await Promise.all([getUser(), getLocale()]);
  return (
    <html lang={LOCALE_TAGS[locale]} className="h-full antialiased">
      <body className="min-h-full">
        <LocaleProvider locale={locale}>
          {user && <AppNav me={{ id: user.id, name: user.name, email: user.email }} />}
          <div className={user ? "pb-[var(--nav-h)] md:pl-64" : ""}>
            <div className="mx-auto w-full max-w-6xl px-4 md:px-8">{children}</div>
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
