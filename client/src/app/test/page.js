"use client";

import { Button } from "@/components/ui/button";
import { saveDesign } from "@/services/design-service";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TestPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createTestDesign = async () => {
    setIsCreating(true);
    try {
      const designData = {
        name: "Test Design",
        canvasData: null,
        width: 800,
        height: 600,
        category: "Test",
      };

      const newDesign = await saveDesign(designData);
      
      if (newDesign?.success) {
        router.push(`/editor/${newDesign?.data?._id}`);
      } else {
        alert("Failed to create test design");
      }
    } catch (e) {
      console.error("Error creating test design:", e);
      alert("Error creating test design");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Test Design Creation</h1>
        <p className="text-gray-600 mb-6">
          Create a test design to test the editor and import functionality.
        </p>
        <Button 
          onClick={createTestDesign}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Creating..." : "Create Test Design"}
        </Button>
      </div>
    </div>
  );
}
