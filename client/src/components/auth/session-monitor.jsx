"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { tokenManager } from "@/services/token-manager";
import { checkForStaleSession, emergencyAuthCleanup } from "@/utils/auth-cleanup";

export function SessionMonitor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const lastSessionCheck = useRef(Date.now());
  const sessionInitialized = useRef(false);

  useEffect(() => {
    // Skip monitoring on login page
    if (pathname === "/login") return;

    // Check for extremely stale sessions on mount
    if (checkForStaleSession()) {
      return; // Function will handle redirect
    }

    // Initialize token manager when session is available
    if (session && !sessionInitialized.current) {
      sessionInitialized.current = true;
      tokenManager.initialize().catch(console.error);
    }

    // Handle session loss
    if (status === "unauthenticated" && pathname !== "/login") {
      console.log("Session lost, redirecting to login...");
      router.push("/login?message=session_expired");
      return;
    }

    // Set up periodic session health check
    const healthCheckInterval = setInterval(async () => {
      try {
        // Only check if we haven't checked recently (prevent spam)
        const now = Date.now();
        if (now - lastSessionCheck.current < 30000) return; // 30 seconds minimum
        
        lastSessionCheck.current = now;

        // If session exists but no ID token, something is wrong
        if (session && !session.idToken) {
          console.warn("🚨 Session exists but no ID token found - forcing cleanup");
          emergencyAuthCleanup();
          return;
        }

        // Check if session is about to expire
        if (session?.expires) {
          const expiryTime = new Date(session.expires).getTime();
          const timeUntilExpiry = expiryTime - now;
          
          // If expired, force cleanup immediately
          if (timeUntilExpiry <= 0) {
            console.warn("🚨 Session expired during health check - forcing cleanup");
            emergencyAuthCleanup();
            return;
          }
          
          // If less than 5 minutes remaining, show warning
          if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
            toast.warning("Session Expiring Soon", {
              description: "Your session will expire in less than 5 minutes.",
              duration: 5000,
              action: {
                label: "Extend Session",
                onClick: () => {
                  tokenManager.refreshToken().catch(() => {
                    console.warn("Failed to extend session, forcing cleanup");
                    emergencyAuthCleanup();
                  });
                },
              },
            });
          }
        }
      } catch (error) {
        console.error("Session health check failed:", error);
        // If health check fails consistently, something is wrong
        if (session) {
          console.warn("🚨 Session health check failed - may need cleanup");
        }
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [session, status, pathname, router]);

  // Handle app visibility changes (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && session) {
        try {
          // Check for stale session when tab becomes visible
          if (checkForStaleSession()) {
            return; // Function will handle redirect
          }

          // Check session health when user returns to tab
          const now = Date.now();
          const sessionExpiry = session.expires ? new Date(session.expires).getTime() : 0;
          
          // If session expired while tab was hidden
          if (sessionExpiry > 0 && now > sessionExpiry) {
            console.log("🚨 Session expired while tab was inactive - forcing cleanup");
            emergencyAuthCleanup();
            return;
          }
          
          // If session is about to expire, proactively refresh
          if (sessionExpiry > 0 && (sessionExpiry - now) < 10 * 60 * 1000) { // 10 minutes
            console.log("Proactively refreshing session after tab focus");
            try {
              await tokenManager.refreshTokenSilently();
            } catch (error) {
              console.error("Failed to refresh session on tab focus:", error);
              emergencyAuthCleanup();
            }
          }
        } catch (error) {
          console.error("Error checking session on tab focus:", error);
          if (session) {
            emergencyAuthCleanup();
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, router]);

  // Handle page unload (save work if needed)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // If in editor with unsaved changes, warn user
      if (pathname.includes("/editor/")) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
