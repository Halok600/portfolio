import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { site } from "@/lib/content";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: `${site.profile.name} — ${site.profile.role}`,
  description: site.profile.tagline,
};

// Runs before first paint so there is no theme flash. defaultTheme is a
// schema-validated enum, so interpolating it is safe.
const themeScript = `(function(){var d=document.documentElement;try{var s=localStorage.getItem("theme");var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: light)").matches?"light":(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"${site.settings.defaultTheme}"));d.dataset.theme=t}catch(e){d.dataset.theme="${site.settings.defaultTheme}"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme={site.settings.defaultTheme}
      data-accent={site.settings.accent}
      className={`${display.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip mono" href="#main">Skip to content</a>
        <Header />
        {children}
      </body>
    </html>
  );
}
