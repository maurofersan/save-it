import * as React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`c-skeleton rounded-xl ${className}`} />;
}

