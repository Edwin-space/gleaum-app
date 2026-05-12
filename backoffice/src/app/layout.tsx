import type { Metadata } from "next";
import "./globals.css";

import ConditionalSidebar from "@/components/ConditionalSidebar";
import { SessionProvider } from "@/components/SessionProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "Gleaum Admin Backoffice",
  description: "글리움 관리자 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body className="antialiased min-h-screen bg-background font-sans">
        {GA4_ID && <GoogleAnalytics measurementId={GA4_ID} />}
        <SessionProvider>
          <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            <ConditionalSidebar />
            <div className="flex-1 overflow-y-auto bg-muted/40">
              {children}
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
