"use client";

import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Sparkles } from "lucide-react";
import CanzatList from "./canzat-list";

function CanzatModal({ isOpen, onClose, setShowCanzatModal }) {
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
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              All Canzat Items
            </DialogTitle>
          </div>
          <CanzatList
            setShowCanzatModal={setShowCanzatModal}
            isModalView={true}
            showAll={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CanzatModal;
