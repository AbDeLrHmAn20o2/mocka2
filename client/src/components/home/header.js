"use client";

import { LogOut, Palette, Crown, Sparkles, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useEditorStore } from "@/store";
import { isPremiumUser, getSubscriptionStatus } from "@/lib/premium-utils";
import { getUserSubscription } from "@/services/subscription-service";
import SubscriptionModal from "@/components/subscription/premium-modal";
import { useState } from "react";
import { toast } from "sonner";

function Header() {
  const { data: session } = useSession();
  const { userSubscription, setUserSubscription } = useEditorStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isUserPremium = isPremiumUser(userSubscription);
  const subscriptionStatus = getSubscriptionStatus(userSubscription);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center px-6 fixed top-0 right-0 left-[72px] z-40 shadow-sm">
        {/* Modern Mocko Brand Logo - Left Aligned */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          {/* Brand Name with Modern Typography */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none tracking-tight">
              Mocko
            </h1>
            <span className="text-xs font-medium text-slate-500 leading-none mt-0.5">
              Design Studio
            </span>
          </div>

          {/* Modern Icon with Gradient Background */}
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 border border-blue-400/20">
            <Palette className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Spacer to push content to the right */}
        <div className="flex-1"></div>

        <div className="flex items-center gap-4 ml-4">
          {/* Premium Status / Upgrade Button */}
          {isUserPremium ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-800">
                Premium
              </span>
            </div>
          ) : (
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-2 rounded-xl"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {subscriptionStatus.isRenewal
                ? "Renew Premium"
                : "Upgrade to Premium"}
            </Button>
          )}

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-1 cursor-pointer">
            <DropdownMenu>
              <DropdownMenuTrigger aschild="true">
                <div className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-300">
                  <Avatar className="ring-2 ring-slate-200 hover:ring-blue-300 transition-all duration-300">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                      {session?.user?.name?.[0] || "U"}
                    </AvatarFallback>
                    <AvatarImage
                      src={session?.user?.image || "/placeholder-user.jpg"}
                    />
                  </Avatar>
                  <span className="text-sm font-bold hidden lg:block text-slate-700">
                    {session?.user?.name || "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white/95 backdrop-blur-md border-slate-200 shadow-xl rounded-2xl"
              >
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer hover:bg-slate-50 rounded-xl mx-1 my-1"
                >
                  <LogOut className="mr-3 w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-700">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}

export default Header;
