"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoginCard from "@/components/login/login-card";
import { Palette, AlertCircle, CheckCircle } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error === "session_expired") {
      setMessage({
        type: "warning",
        title: "Session Expired",
        description:
          "Your session has expired. Please sign in again to continue.",
      });
    } else if (error === "token_invalid") {
      setMessage({
        type: "error",
        title: "Authentication Error",
        description:
          "Your authentication token is invalid. Please sign in again.",
      });
    } else if (error === "access_denied") {
      setMessage({
        type: "error",
        title: "Access Denied",
        description: "Authentication was cancelled or access was denied.",
      });
    } else if (message === "signed_out") {
      setMessage({
        type: "success",
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Geometric grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              x="0"
              y="0"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
              />
            </pattern>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="50" cy="50" r="1.5" fill="rgba(255,255,255,0.2)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Floating design elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left design elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400/40 rounded-full animate-bounce delay-500"></div>
        <div
          className="absolute top-32 left-40 w-6 h-6 border-2 border-indigo-400/40 rounded-lg rotate-45 animate-spin delay-1000"
          style={{ animationDuration: "8s" }}
        ></div>

        {/* Top right design elements */}
        <div className="absolute top-24 right-32 w-8 h-8 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-40 right-16 w-3 h-12 bg-cyan-400/30 rounded-full rotate-12 animate-pulse delay-1500"></div>

        {/* Bottom design elements */}
        <div className="absolute bottom-32 left-16 w-5 h-5 bg-yellow-400/40 rotate-45 animate-bounce delay-300"></div>
        <div className="absolute bottom-20 right-40 w-10 h-2 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-full animate-pulse delay-2000"></div>
      </div>

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Modern Mocko Brand Header */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent leading-none tracking-tight">
              Mocko
            </h1>
            <span className="text-sm font-medium text-blue-200/80 leading-none mt-0.5">
              Design Studio
            </span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 border border-blue-400/30 backdrop-blur-sm">
            <Palette className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-6">
          {/* Status message */}
          {message && (
            <div
              className={`rounded-2xl p-4 mb-6 flex items-start gap-3 ${
                message.type === "error"
                  ? "bg-red-500/10 border border-red-500/20"
                  : message.type === "warning"
                  ? "bg-yellow-500/10 border border-yellow-500/20"
                  : "bg-green-500/10 border border-green-500/20"
              }`}
            >
              {message.type === "error" && (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              {message.type === "warning" && (
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              )}
              {message.type === "success" && (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3
                  className={`font-semibold ${
                    message.type === "error"
                      ? "text-red-300"
                      : message.type === "warning"
                      ? "text-yellow-300"
                      : "text-green-300"
                  }`}
                >
                  {message.title}
                </h3>
                <p className="text-slate-300 text-sm mt-1">
                  {message.description}
                </p>
              </div>
            </div>
          )}

          <LoginCard />
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60"></div>

      {/* Corner decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
    </div>
  );
}

function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

export default Login;
