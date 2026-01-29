// Simple Avatar component for user profile images
import React from "react";
import { cn } from "@/lib/utils";

// Inline grey circle placeholder (no 404)
const PLACEHOLDER_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%239ca3af" cx="50" cy="50" r="50"/><circle fill="%236b7280" cx="50" cy="45" r="18"/><path fill="%236b7280" d="M20 95c0-25 13-40 30-40s30 15 30 40z"/></svg>'
  );

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = "Avatar", size = 40, className }) => (
  <img
    src={src || PLACEHOLDER_SVG}
    alt={alt}
    width={size}
    height={size}
    style={{ borderRadius: "50%", objectFit: "cover" }}
    className={cn(className)}
  />
);
