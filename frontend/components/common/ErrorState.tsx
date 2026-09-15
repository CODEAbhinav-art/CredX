"use client";

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: "api" | "llm" | "generic";
}

export default function ErrorState({
  title, message, onRetry,
  variant = "generic"
}: ErrorStateProps) {
  const defaultTitles = {
    api:     "Service Temporarily Unavailable",
    llm:     "AI Explanation Unavailable",
    generic: "Something Went Wrong",
  };

  const icons = {
    api:     <WifiOff size={22} style={{ color: "var(--text-muted)" }} />,
    llm:     <AlertCircle size={22} style={{ color: "var(--amber)" }} />,
    generic: <AlertCircle size={22} style={{ color: "var(--text-muted)" }} />,
  };

  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-muted)",
        border: "1px solid var(--border)",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        {icons[variant]}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
        {title ?? defaultTitles[variant]}
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16, maxWidth: 360, margin: "0 auto 16px" }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-outline btn-sm" onClick={onRetry} style={{ margin: "0 auto" }}>
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}
