import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/providers/nextauth-provider";
import EnhancedErrorBoundary from "@/components/ui/enhanced-error-boundary";
import { GlobalErrorDisplay } from "@/components/ui/global-error-display";
import { SessionStatus } from "@/components/ui/session-status";
import { SessionMonitor } from "@/components/auth/session-monitor";
import { AuthCleanupGuard } from "@/components/auth/auth-cleanup-guard";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mocko - Design Studio",
  description:
    "Create stunning designs with Mocko Design Studio. Professional design tools for everyone.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <EnhancedErrorBoundary>
          <NextAuthProvider>
            <AuthCleanupGuard>
              <SessionMonitor />
              <GlobalErrorDisplay />
              <SessionStatus />
              {children}
            </AuthCleanupGuard>
          </NextAuthProvider>
        </EnhancedErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
