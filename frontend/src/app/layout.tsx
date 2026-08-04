import type { Metadata } from "next";
import "./globals.css";
import SessionSyncProvider from "@/components/common/SessionSyncProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";

export const metadata: Metadata = {
  title: "NexClinic | Connected Healthcare Management Platform",
  description: "Streamline hospital operations, improve patient care, and enhance overall healthcare efficiency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <SessionSyncProvider />
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
