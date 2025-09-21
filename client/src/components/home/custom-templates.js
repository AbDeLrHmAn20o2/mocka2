"use client";

import { useEditorStore } from "@/store";
import { isPremiumUser } from "@/lib/premium-utils";
import TemplateList from "./template-list";

function CustomTemplates() {
  const { setShowTemplatesModal, userSubscription } = useEditorStore();
  const isUserPremium = isPremiumUser(userSubscription);

  return (
    <div className="flex justify-center mt-16">
      <div className="w-full max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">
            Choose a Template
          </h2>
          <p className="text-slate-600 text-lg">
            Start with a professionally designed template
          </p>
          {!isUserPremium && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Free Plan:</strong> Create up to 5 designs • 
                <span className="text-blue-600 ml-1">Upgrade for unlimited designs</span>
              </p>
            </div>
          )}
        </div>

        {/* Templates Grid */}
        <TemplateList
          setShowTemplatesModal={setShowTemplatesModal}
          isModalView={false}
          showAll={false}
        />

        {/* Call to Action */}
      </div>
    </div>
  );
}

export default CustomTemplates;
