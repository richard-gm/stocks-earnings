"use client";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="border border-red-400 bg-red-50 text-red-800 rounded p-4 text-sm">
      {message}
    </div>
  );
}
