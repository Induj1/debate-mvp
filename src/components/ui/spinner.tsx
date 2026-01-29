// Simple Spinner component for loading states
import React from "react";
import { cn } from "@/lib/utils";

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("animate-spin", className)}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="#888"
      strokeWidth="4"
      opacity="0.25"
    />
    <path
      d="M22 12a10 10 0 0 1-10 10"
      stroke="#555"
      strokeWidth="4"
      strokeLinecap="round"
      className="opacity-75"
    />
  </svg>
);
