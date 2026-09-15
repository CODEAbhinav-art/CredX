"use client";

import { useState, useRef, useEffect } from "react";
import { Send, AlertCircle } from "lucide-react";
import type { ScoreResponse } from "@/lib/types";

// The shape our mock/future backend uses
interface CopilotMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  keyPoints?: string[];
  suggestedAction?: string;
  isDisclaimer?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Why is my score this way?",
  "What is helping my score?",
  "What is hurting my score?",
  "How can I improve?",
  "What if I improve payment consistency?"
];

interface CopilotPanelProps {
  scoreContext: ScoreResponse | null;
}

export default function CopilotPanel({ scoreContext }: CopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const noContext = !scoreContext || !scoreContext.credx_score;

  // Auto-scroll
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    setMessages([
      {
        id: "init",
        role: "ai",
        text: scoreContext 
          ? "Hello! I'm CredX AI. I can help you understand your alternative credit profile and suggest ways to improve."
          : "Hello! Please complete your assessment first so I can analyze your credit profile.",
      },
    ]);
    setError(null);
  }, [scoreContext?.credx_score]);

  async function send(text: string) {
    if (!text.trim() || noContext || loading) return;
    
    const userMsg: CopilotMessage = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    // Mock response for now (since backend is out of scope)
    setTimeout(() => {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: "This is a mock response from CredX AI. Once the Gemini API is connected, this will provide contextual answers based on your SHAP values.",
          isDisclaimer: true
        }
      ]);
    }, 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "20px 24px" }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "user" ? (
              <div className="chat-bubble-user">{msg.text}</div>
            ) : (
              <div className="chat-bubble-ai">
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>CredX AI</div>
                <p style={{ margin: "0 0 6px" }}>{msg.text}</p>
                {msg.isDisclaimer && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--amber)", marginTop: 8 }}>
                    <AlertCircle size={12} />
                    <span>Mock response</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div className="chat-bubble-ai" style={{ width: 60, display: "flex", justifyContent: "center", alignItems: "center", height: 36 }}>
              <div style={{ display: "flex", gap: 4 }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && scoreContext && (
        <div style={{ padding: "0 24px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                background: "var(--bg-muted)",
                border: "1px solid var(--border)",
                borderRadius: 99,
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontWeight: 500
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "var(--blue)"; (e.target as HTMLElement).style.color = "var(--blue)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 24px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            type="text"
            className="input-field"
            placeholder={noContext ? "Waiting for credit profile..." : "Ask CredX about your score..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={noContext || loading}
            style={{ borderRadius: 99, padding: "12px 16px" }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || noContext || loading}
            style={{ padding: "12px", borderRadius: "50%", flexShrink: 0, width: 44, height: 44 }}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
