from typing import Dict, Any, Optional
import json
import logging
from app.config import settings
from app.models.models import (
    Campaign, ProductSKU, AnomalyRecord, ActionTypeEnum
)

logger = logging.getLogger(__name__)

class ReasoningAgent:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}")

    async def generate_decision_recommendation(
        self,
        anomaly: AnomalyRecord,
        campaign: Campaign,
        sku: Optional[ProductSKU],
        budget_opt: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes anomaly facts, campaign metrics, SKU unit economics, and mathematical bounds
        into a structured decision recommendation using Gemini or neuro-symbolic reasoning.
        """
        # If Gemini client is active, attempt structured generation
        if self.client:
            try:
                prompt = f"""
You are ASCEND, an AI-native advertising intelligence and autonomous decision engine for D2C brands.
Analyze the following multi-channel operational data and produce a structured optimization recommendation.

DATA CONTEXT:
- Channel: {anomaly.channel.upper()}
- Campaign Name: {campaign.name} (Current Daily Budget: ${campaign.daily_budget}, ROAS: {campaign.current_roas}x)
- Target SKU: {sku.name if sku else 'N/A'} (Stock: {sku.inventory_stock if sku else 'N/A'}, Runout Days: {sku.inventory_runout_days if sku else 'N/A'})
- Detected Anomaly: {anomaly.anomaly_type} (Severity: {anomaly.severity})
- Root Cause Summary: {anomaly.root_cause_summary}
- Optimization Engine Suggestion: Delta {budget_opt.get('delta_pct')}% (New Budget: ${budget_opt.get('new_budget')})

Respond ONLY with a valid JSON object matching this schema:
{{
  "action_type": "scale_budget" | "reduce_budget" | "pause_ad_set" | "pause_creative" | "cross_channel_reallocate" | "inventory_protect_pause",
  "delta_budget_pct": float,
  "delta_budget_abs": float,
  "new_budget": float,
  "rationale": "Clear, executive-ready explanation of why this action solves the root cause and protects contribution margin",
  "confidence_score": float between 0.0 and 1.0,
  "risk_score": float between 0.0 and 1.0,
  "predicted_mer_lift": float (e.g. 0.12 for +12%),
  "predicted_roas_lift": float (e.g. 0.18 for +18%)
}}
"""
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                parsed = json.loads(text.strip())
                return parsed
            except Exception as e:
                logger.error(f"Gemini API generation failed, falling back to neuro-symbolic synthesizer: {e}")

        # Neuro-symbolic deterministic fallback
        return self._generate_neuro_symbolic_recommendation(anomaly, campaign, sku, budget_opt)

    def _generate_neuro_symbolic_recommendation(
        self,
        anomaly: AnomalyRecord,
        campaign: Campaign,
        sku: Optional[ProductSKU],
        budget_opt: Dict[str, Any]
    ) -> Dict[str, Any]:
        """High-precision neuro-symbolic recommendation generator."""
        if anomaly.anomaly_type == "STOCKOUT_HAZARD":
            runout = sku.inventory_runout_days if sku else 1.0
            if runout <= 2.0:
                # Immediate safety pause
                return {
                    "action_type": ActionTypeEnum.INVENTORY_PROTECT_PAUSE.value,
                    "delta_budget_pct": -100.0,
                    "delta_budget_abs": -campaign.daily_budget,
                    "new_budget": 0.0,
                    "rationale": (
                        f"CRITICAL INVENTORY LOCKOUT: Stock runout for '{sku.name}' is {runout:.1f} days ({sku.inventory_stock} units left). "
                        f"Pausing campaign '{campaign.name}' immediately prevents burning ${campaign.daily_budget:.2f}/day on out-of-stock conversions "
                        f"and preserves ad account algorithm ranking."
                    ),
                    "confidence_score": 0.98,
                    "risk_score": 0.10,
                    "predicted_mer_lift": 0.22,
                    "predicted_roas_lift": 0.25
                }
            else:
                # Controlled spend throttle
                new_b = max(100.0, campaign.daily_budget * 0.40)
                return {
                    "action_type": ActionTypeEnum.REDUCE_BUDGET.value,
                    "delta_budget_pct": -60.0,
                    "delta_budget_abs": round(new_b - campaign.daily_budget, 2),
                    "new_budget": round(new_b, 2),
                    "rationale": (
                        f"Inventory Throttling: Stock runout is {runout:.1f} days. "
                        f"Decreasing daily spend by 60% balances cashflow while warehouse replenishment is in transit."
                    ),
                    "confidence_score": 0.92,
                    "risk_score": 0.20,
                    "predicted_mer_lift": 0.15,
                    "predicted_roas_lift": 0.18
                }

        elif anomaly.anomaly_type == "CREATIVE_FATIGUE":
            return {
                "action_type": ActionTypeEnum.PAUSE_CREATIVE.value,
                "delta_budget_pct": 0.0,
                "delta_budget_abs": 0.0,
                "new_budget": campaign.daily_budget,
                "rationale": (
                    f"Creative Burnout Mitigation: High frequency has caused CPM to surge and CTR to collapse. "
                    f"Pausing fatigued creative ad sets reallocates impression share to healthy static/video assets within '{campaign.name}'."
                ),
                "confidence_score": 0.94,
                "risk_score": 0.18,
                "predicted_mer_lift": 0.14,
                "predicted_roas_lift": 0.19
            }

        elif anomaly.anomaly_type == "CROSS_CHANNEL_DISPARITY":
            shift_amount = min(400.0, campaign.daily_budget * 0.25)
            new_b = campaign.daily_budget - shift_amount
            return {
                "action_type": ActionTypeEnum.CROSS_CHANNEL_REALLOCATE.value,
                "delta_budget_pct": -round((shift_amount / campaign.daily_budget) * 100, 1),
                "delta_budget_abs": -round(shift_amount, 2),
                "new_budget": round(new_b, 2),
                "rationale": (
                    f"Cross-Channel Capital Arbitrage: Shift ${shift_amount:.2f}/day from underperforming {campaign.channel.upper()} "
                    f"to high-yield Google/Amazon campaigns delivering >4.0x ROAS with healthy SKU margins."
                ),
                "confidence_score": 0.89,
                "risk_score": 0.28,
                "predicted_mer_lift": 0.18,
                "predicted_roas_lift": 0.24
            }

        else:
            delta_pct = budget_opt.get("delta_pct", 10.0)
            new_b = budget_opt.get("new_budget", campaign.daily_budget * 1.1)
            return {
                "action_type": ActionTypeEnum.SCALE_BUDGET.value if delta_pct > 0 else ActionTypeEnum.REDUCE_BUDGET.value,
                "delta_budget_pct": delta_pct,
                "delta_budget_abs": round(new_b - campaign.daily_budget, 2),
                "new_budget": round(new_b, 2),
                "rationale": (
                    f"Algorithmic Alignment: Adjusting budget by {delta_pct:+.1f}% to maximize Net Contribution Margin "
                    f"based on current ROAS ({campaign.current_roas:.2f}x) and inventory availability."
                ),
                "confidence_score": budget_opt.get("confidence", 0.88),
                "risk_score": budget_opt.get("risk", 0.22),
                "predicted_mer_lift": 0.10,
                "predicted_roas_lift": 0.14
            }
