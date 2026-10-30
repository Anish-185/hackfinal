import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";
import "./sections.css";
import { NAME } from "@/lib/site";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: `${NAME}: coding assessments built from the candidate's own work`,
  description:
    "Turns a candidate's portfolio into a validated 60-minute coding assessment in their own stack, runs it in sandboxes and grades it with tests only.",
};

export const viewport: Viewport = {
  themeColor: "#e6e8e3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
