import React from "react";

export default function ProgressBar({ percent = 0, indeterminate = false }) {
  if (indeterminate) {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
    );
  }
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
