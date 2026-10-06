import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { site } from "@/lib/content";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${site.profile.name} — ${site.profile.headline}`,
  description: site.profile.tagline,
};

// Sets data-theme before first paint so there is no flash. defaultTheme is a
// schema-validated enum ("dark" | "light"), so interpolating it is safe.
const themeScript = `(function(){var d=document.documentElement;try{var s=localStorage.getItem("theme");var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: light)").matches?"light":(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"${site.settings.defaultTheme}"));d.dataset.theme=t}catch(e){d.dataset.theme="${site.settings.defaultTheme}"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme={site.settings.defaultTheme}
      data-accent={site.settings.accent}
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-text">
        <Header />
        {children}
        <footer className="border-t border-line py-8 text-center text-sm text-muted">
          © 2026 {site.profile.name}
        </footer>
      </body>
    </html>
  );
}
