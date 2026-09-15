"use client";

import { useState, useRef, useEffect } from "react";
import type { ScoreResponse, CopilotResponse } from "@/lib/types";
import { credxApi } from "@/lib/api";
import { SUGGESTED_QUESTIONS } from "@/lib/personas";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  keyPoints?: string[];
  isAiGenerated?: boolean;
  disclaimer?: string;
}

interface CopilotPanelProps {
  scoreContext: ScoreResponse | null;
}

function TypingIndicator() {
  return (
    <div className="chat-bubble-ai flex items-center gap-1.5">
      <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
      <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
      <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
    </div>
  );
}

export default function CopilotPanel({ scoreContext }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Reset messages when persona changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [scoreContext?.credx_score]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || !scoreContext || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response: CopilotResponse = await credxApi.copilot({
        question,
        score_context: scoreContext,
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.answer,
        keyPoints: response.key_points,
        isAiGenerated: response.is_ai_generated,
        disclaimer: response.disclaimer,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError("Copilot is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const noContext = !scoreContext;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
        >
          ✦
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            AI Credit Copilot
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Powered by Gemini Flash · Explains the model
          </div>
        </div>
        <div
          className="ml-auto text-xs px-2 py-1 rounded-full"
          style={{
            background: noContext ? "rgba(248,113,113,0.1)" : "rgba(34,211,165,0.1)",
            color: noContext ? "#F87171" : "#22D3A5",
            border: `1px solid ${noContext ? "rgba(248,113,113,0.2)" : "rgba(34,211,165,0.2)"}`,
          }}
        >
          {noContext ? "No score loaded" : "Ready"}
        </div>
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={noContext || loading}
                className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  cursor: noContext ? "not-allowed" : "pointer",
                  opacity: noContext ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!noContext) {
                    (e.target as HTMLElement).style.borderColor = "rgba(59,130,246,0.5)";
                    (e.target as HTMLElement).style.color = "#3B82F6";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--border-subtle)";
                  (e.target as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1"
        style={{ minHeight: 160, maxHeight: 280 }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="chat-bubble-user text-sm text-white">
                {msg.text}
              </div>
            ) : (
              <div className="chat-bubble-ai text-sm" style={{ color: "var(--text-primary)" }}>
                <p className="leading-relaxed">{msg.text}</p>

                {msg.keyPoints && msg.keyPoints.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {msg.keyPoints.map((kp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "#3B82F6", marginTop: 2 }}>•</span>
                        {kp}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  {msg.isAiGenerated ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}>
                      AI · Gemini
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                      Deterministic
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Not financial advice
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}

        {error && (
          <div
            className="text-xs p-3 rounded-xl"
            style={{ background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={noContext ? "Load a persona to start..." : "Ask about your score..."}
          disabled={noContext || loading}
          className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            opacity: noContext ? 0.5 : 1,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(59,130,246,0.5)";
            e.target.style.boxShadow = "0 0 0 2px rgba(59,130,246,0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border-subtle)";
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          type="submit"
          disabled={noContext || loading || !input.trim()}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "Ask"}
        </button>
      </form>
    </div>
  );
}
