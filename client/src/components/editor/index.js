"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import of the actual editor with no SSR
const EditorComponent = dynamic(() => import("./editor-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Design Editor...</p>
      </div>
    </div>
  ),
});

function MainEditor() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Editor...</p>
        </div>
      </div>
    );
  }

  return <EditorComponent />;
}

export default MainEditor;
