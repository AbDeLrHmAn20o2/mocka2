"use client";

import { useEditorStore } from "@/store";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import DesignList from "./design-list";

function RecentDesigns() {
  const { userDesigns, userDesignsLoading } = useEditorStore();

  return (
    <div className="mt-24">
      {/* Modern Section Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-5">
          <div className="relative">
            <div className="bg-gradient-to-r from-slate-700 to-blue-700 rounded-2xl p-4 shadow-xl border border-slate-200">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Your Creations
            </h2>
            <div className="flex items-center space-x-3 mt-2">
              <p className="text-slate-600 text-lg">
                {userDesigns?.length || 0} creative{" "}
                {userDesigns?.length === 1 ? "project" : "projects"}
              </p>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
              <span className="text-base text-blue-600 font-semibold">
                Keep building!
              </span>
            </div>
          </div>
        </div>

        {userDesigns && userDesigns.length > 8 && (
          <button className="group flex items-center space-x-3 bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-200 hover:to-blue-200 text-slate-700 font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg border border-slate-200">
            <span className="text-lg">View All</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        )}
      </div>

      <DesignList
        listOfDesigns={
          userDesigns && userDesigns.length > 0 ? userDesigns.slice(0, 8) : []
        }
        isLoading={userDesignsLoading}
        isModalView={false}
      />
    </div>
  );
}

export default RecentDesigns;
