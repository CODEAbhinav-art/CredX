import httpx
import json
import asyncio

async def test():
    req = {
      "question": "What is hurting my score?",
      "score_context": {
        "credx_score": 640,
        "risk_band": "High",
        "approval_likelihood": 0.5,
        "sub_scores": {
          "income_stability": 75,
          "payment_reliability": 80,
          "digital_behaviour": 70
        },
        "top_positive_contributors": [
          {"feature": "income", "feature_label": "Income", "shap_value": 0.1, "feature_value": 0.8, "impact_direction": "positive"}
        ],
        "top_negative_contributors": [
          {"feature": "delay", "feature_label": "Payment Delay", "shap_value": -0.15, "feature_value": 5.0, "impact_direction": "negative"}
        ],
        "base_shap_value": 0.5,
        "disclaimer": "..."
      }
    }
    
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post("http://localhost:8000/api/copilot", json=req)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                print("ANSWER:", data.get("answer", "")[:200])
                print("IS_AI:", data.get("is_ai_generated"))
            else:
                print(res.json())
    except Exception as e:
        print("Exception:", type(e).__name__, str(e))

if __name__ == "__main__":
    asyncio.run(test())
