"use client";

import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "0px",
  sm:   "16px",
  md:   "24px",
  lg:   "32px",
};

export default function Card({ children, className, hover, style, padding = "md" }: CardProps) {
  return (
    <div
      className={clsx("card", hover && "card-hover", className)}
      style={{ padding: paddingMap[padding], ...style }}
    >
      {children}
    </div>
  );
}
