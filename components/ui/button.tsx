"use client";

import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-slate-800"
      : variant === "secondary"
      ? "border bg-white hover:bg-slate-50"
      : "hover:bg-slate-100";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
