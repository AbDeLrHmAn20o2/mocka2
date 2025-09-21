"use client";

import { LogIn, Sparkles, Star } from "lucide-react";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

function LoginCard() {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md mx-4 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg mb-2">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome Back!
          </h3>
          <p className="text-slate-600 font-medium">
            Sign in to continue your creative journey with{" "}
            <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Mocko
            </span>
          </p>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-4 py-6 px-6 text-slate-700 border-2 border-slate-200 
              hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 
              group transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl font-semibold text-base shadow-sm hover:shadow-lg"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <div className="bg-white rounded-xl p-2 flex items-center justify-center group-hover:bg-blue-500 group-hover:shadow-lg transition-all duration-300 border border-slate-100 group-hover:border-blue-400">
              <LogIn className="w-5 h-5 group-hover:text-white transition-colors duration-300" />
            </div>
            <span>Continue with Google</span>
          </Button>

          {/* Feature Highlight */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-900" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Premium Features Available
                </p>
                <p className="text-xs text-slate-600">
                  Export designs, access premium templates, and more!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginCard;
