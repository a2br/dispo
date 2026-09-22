import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { features } from "@/lib/features";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "dispo", template: "%s · dispo" },
  description: "Who's free? EPFL schedules for the people you pick.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "dispo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f12" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {user && <AppNav me={{ id: user.id, name: user.name, email: user.email, image: user.image }} classmates={features.classmates} />}
        <div className={user ? "pb-24 md:pb-0 md:pl-60" : ""}>
          <div className="mx-auto w-full max-w-6xl px-4 md:px-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
