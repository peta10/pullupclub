import React from "react";

export default function MinimalHome() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#9b9b6f] mb-4">
          Pull-Up Club - Test Mode
        </h1>
        <p className="text-gray-300">
          Basic Next.js functionality test
        </p>
        <div className="mt-6 text-sm text-gray-500">
          ✅ React rendering working<br/>
          ✅ CSS classes working<br/>
          ✅ No webpack errors
        </div>
      </div>
    </div>
  );
}