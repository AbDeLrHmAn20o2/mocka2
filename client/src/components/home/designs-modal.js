"use client";

import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Sparkles } from "lucide-react";
import DesignList from "./design-list";

function DesignModal({
  isOpen,
  onClose,
  userDesigns,
  setShowDesignsModal,
  userDesignsLoading,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={
          "sm:max-w-[1400px] h-[600px] p-0 gap-0 overflow-auto bg-white/95 backdrop-blur-md border-slate-200 shadow-2xl rounded-3xl"
        }
      >
        <div className="flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <DialogTitle
              className={
                "text-2xl font-bold mb-4 flex items-center text-slate-800"
              }
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              All Designs
            </DialogTitle>
          </div>
          <DesignList
            setShowDesignsModal={setShowDesignsModal}
            isModalView={true}
            listOfDesigns={userDesigns}
            isLoading={userDesignsLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DesignModal;
