import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelDock - Record polished mobile app demos",
  description:
    "Connect your phone, record your app and camera together, adjust the layout, and export a polished product demo.",
  applicationName: "ReelDock",
  openGraph: {
    title: "ReelDock",
    description: "Record polished mobile-app demos with your phone, webcam, and voice.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReelDock",
    description: "Record polished mobile-app demos with your phone, webcam, and voice.",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
