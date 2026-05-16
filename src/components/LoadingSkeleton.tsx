"use client";

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-gray-300 rounded p-4 h-52 bg-gray-100" />
        <div className="border border-gray-300 rounded p-4 h-52 bg-gray-100" />
      </div>
      <div className="border border-gray-300 rounded p-4 h-80 bg-gray-100" />
    </div>
  );
}
