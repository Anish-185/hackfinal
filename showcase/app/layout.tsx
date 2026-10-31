import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cormorant/wght.css";
import "@fontsource-variable/cormorant/wght-italic.css";
import "@fontsource-variable/cinzel/wght.css";
import "@fontsource-variable/eb-garamond/wght.css";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";
import "./sections.css";
import { NAME } from "@/lib/site";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";

export const metadata: Metadata = {
  title: `${NAME}: coding assessments built from the candidate's own work`,
  description:
    "Turns a candidate's portfolio into a validated 60-minute coding assessment in their own stack, runs it in sandboxes and grades it with tests only.",
};

export const viewport: Viewport = {
  themeColor: "#f3eee3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <Cursor />
      </body>
    </html>
  );
}
