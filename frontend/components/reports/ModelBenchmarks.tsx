"use client";

import { useEffect, useState } from "react";
import { credxApi } from "@/lib/api";
import { Cpu, Award, BarChart2 } from "lucide-react";

export default function ModelBenchmarks() {
  const [metrics, setMetrics] = useState<any>(null);
  const [globalFeatures, setGlobalFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, fRes] = await Promise.all([
          credxApi.metrics(),
          credxApi.globalFeatures()
        ]);
        setMetrics(mRes);
        setGlobalFeatures(fRes.global_feature_importance || []);
      } catch (err) {
        console.warn("Failed to load model benchmarks", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />;
  }

  const benchmarks = metrics?.benchmark_comparison || {
    "Logistic Regression": { accuracy: 0.812, precision: 0.61, recall: 0.49, f1: 0.54, roc_auc: 0.825 },
    "Random Forest": { accuracy: 0.875, precision: 0.68, recall: 0.52, f1: 0.59, roc_auc: 0.898 },
    "XGBoost": { accuracy: 0.8975, precision: 0.7004, recall: 0.5533, f1: 0.6182, roc_auc: 0.9231 }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Model Performance Comparison Card */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Cpu size={20} color="var(--blue)" />
            <h3 className="section-title" style={{ margin: 0 }}>Model Benchmarks & Governance</h3>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: "var(--blue-faint)", color: "var(--blue)" }}>
            Selected: XGBoost
          </span>
        </div>

        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
          CredX evaluates multiple machine learning classifiers to minimize default risk while maximizing inclusion for new-to-credit applicants.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "8px 12px" }}>Algorithm</th>
                <th style={{ padding: "8px 12px" }}>Accuracy</th>
                <th style={{ padding: "8px 12px" }}>Precision</th>
                <th style={{ padding: "8px 12px" }}>Recall</th>
                <th style={{ padding: "8px 12px" }}>F1 Score</th>
                <th style={{ padding: "8px 12px" }}>ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(benchmarks).map(([modelName, m]: [string, any]) => {
                const isSelected = modelName === "XGBoost";
                return (
                  <tr 
                    key={modelName}
                    style={{ 
                      borderBottom: "1px solid var(--border-light)",
                      background: isSelected ? "var(--blue-faint)" : "transparent",
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    <td style={{ padding: "12px", color: isSelected ? "var(--blue)" : "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                      {modelName} {isSelected && <Award size={14} color="var(--blue)" />}
                    </td>
                    <td style={{ padding: "12px" }}>{(m.accuracy * 100).toFixed(1)}%</td>
                    <td style={{ padding: "12px" }}>{(m.precision * 100).toFixed(1)}%</td>
                    <td style={{ padding: "12px" }}>{(m.recall * 100).toFixed(1)}%</td>
                    <td style={{ padding: "12px" }}>{(m.f1 * 100).toFixed(1)}%</td>
                    <td style={{ padding: "12px", color: "var(--green)" }}>{(m.roc_auc * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Feature Importance */}
      {globalFeatures.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <BarChart2 size={20} color="var(--blue)" />
            <h3 className="section-title" style={{ margin: 0 }}>Global Feature Importance (XGBoost)</h3>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
            Top overall financial indicators driving model decisions across all applicants.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {globalFeatures.slice(0, 5).map((f, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                  <span>{f.title || f.feature}</span>
                  <span style={{ color: "var(--blue)" }}>{(f.importance * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, width: "100%", background: "var(--bg-muted)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, f.importance * 300)}%`, background: "var(--blue)", borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
