"use client";

import { Info } from "lucide-react";

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
  width?: number;
}

export default function Tooltip({ text, children, width = 220 }: TooltipProps) {
  return (
    <span className="tooltip-trigger" style={{ display: "inline-flex", alignItems: "center" }}>
      {children ?? <Info size={13} style={{ color: "var(--text-muted)", cursor: "help" }} />}
      <span className="tooltip-content" style={{ maxWidth: width, minWidth: 160, left: "auto", transform: "translateY(4px)" }}>
        {text}
      </span>
    </span>
  );
}
