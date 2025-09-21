"use client";

import { useEditorStore } from "@/store";
import { isPremiumUser } from "@/lib/premium-utils";
import CanzatList from "./canzat-list";

function CustomCanzat() {
  const { setShowCanzatModal, userSubscription } = useEditorStore();
  const isUserPremium = isPremiumUser(userSubscription);

  return (
    <div className="flex justify-center mt-16">
      <div className="w-full max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">
            Explore Canzat Designs
          </h2>
          <p className="text-slate-600 text-lg">
            Unique designs from our curated Canzat collection
          </p>
          {!isUserPremium && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-indigo-800">
                <span className="text-indigo-600 ml-1">Upgrade for unlimited designs</span>
              </p>
            </div>
          )}
        </div>

        {/* Canzat Grid */}
        <CanzatList
          setShowCanzatModal={setShowCanzatModal}
          isModalView={false}
          showAll={false}
        />

        {/* Call to Action */}
      </div>
    </div>
  );
}

export default CustomCanzat;
