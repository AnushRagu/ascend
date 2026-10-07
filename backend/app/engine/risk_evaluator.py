from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
import logging

from app.models.models import (
    Campaign, ProductSKU, PolicyConfig, AutonomyTierEnum, DecisionStatusEnum, ActionTypeEnum
)

logger = logging.getLogger(__name__)

class RiskEvaluator:
    @staticmethod
    def evaluate_decision_tier(
        action_type: ActionTypeEnum,
        delta_budget_pct: float,
        confidence_score: float,
        risk_score: float,
        campaign: Campaign,
        sku: ProductSKU = None,
        policy: PolicyConfig = None
    ) -> Tuple[AutonomyTierEnum, DecisionStatusEnum, str]:
        """
        Evaluates risk & policy guardrails to assign Autonomy Tier and initial Decision Status:
        - Tier 1 Auto: Low risk, high confidence, within guardrails, cooldown respected.
        - Tier 2 Approval: Moderate impact (1-click approval inbox).
        - Tier 3 Escalation: High risk, large budget delta, low confidence, or policy violation.
        """
        # Load or use default policy values
        t1_max_delta = policy.tier1_max_budget_delta_pct if policy else 10.0
        t1_min_conf = policy.tier1_min_confidence_score if policy else 0.85
        t2_max_delta = policy.tier2_max_budget_delta_pct if policy else 30.0
        cooldown_hours = policy.cooldown_hours if policy else 24
        kill_switch = policy.global_kill_switch_active if policy else False

        abs_delta = abs(delta_budget_pct)

        # 1. Global Kill Switch Check
        if kill_switch:
            return (
                AutonomyTierEnum.TIER_3_ESCALATION,
                DecisionStatusEnum.PENDING_APPROVAL,
                "Global execution kill switch is ACTIVE. All autonomous operations are halted; manual review mandatory."
            )

        # 2. Inventory Protection Check
        if sku and sku.inventory_runout_days < (policy.min_inventory_days_buffer if policy else 5):
            if action_type in [ActionTypeEnum.SCALE_BUDGET]:
                return (
                    AutonomyTierEnum.TIER_3_ESCALATION,
                    DecisionStatusEnum.PENDING_APPROVAL,
                    f"Blocked: Target SKU '{sku.sku}' has only {sku.inventory_runout_days} days stock. Scaling ad spend prohibited."
                )

        # 3. Cooldown Window Check (Prevents ad network learning phase reset thrashing)
        now = datetime.utcnow()
        if campaign.last_adjusted_at:
            hours_since_last_edit = (now - campaign.last_adjusted_at).total_seconds() / 3600.0
            if hours_since_last_edit < cooldown_hours and abs_delta > 0:
                return (
                    AutonomyTierEnum.TIER_2_APPROVAL,
                    DecisionStatusEnum.PENDING_APPROVAL,
                    f"Cooldown window active ({hours_since_last_edit:.1f}h / {cooldown_hours}h elapsed). Routed to 1-Click Approval to prevent learning phase disruption."
                )

        # 4. Tier 1 Autonomous Execution Criteria:
        # - Small budget adjustment (<= t1_max_delta, e.g. 10%)
        # - High confidence (>= t1_min_conf, e.g. 0.85)
        # - Low calculated risk (<= 0.25)
        # - Not a destructive campaign termination
        is_tier_1_eligible = (
            abs_delta <= t1_max_delta and
            confidence_score >= t1_min_conf and
            risk_score <= 0.25 and
            action_type in [ActionTypeEnum.SCALE_BUDGET, ActionTypeEnum.REDUCE_BUDGET, ActionTypeEnum.PAUSE_CREATIVE]
        )

        if is_tier_1_eligible:
            return (
                AutonomyTierEnum.TIER_1_AUTO,
                DecisionStatusEnum.AUTO_EXECUTED,
                f"Autonomous Execution: Low risk ({risk_score:.2f}), high confidence ({confidence_score:.2f}), and delta ({abs_delta:.1f}%) within {t1_max_delta}% guardrail."
            )

        # 5. Tier 2 One-Click Approval Criteria:
        # - Moderate budget delta (<= t2_max_delta, e.g. 30%)
        # - Moderate risk (<= 0.55)
        # - Confidence >= 0.70
        is_tier_2_eligible = (
            abs_delta <= t2_max_delta and
            confidence_score >= 0.70 and
            risk_score <= 0.55
        )

        if is_tier_2_eligible:
            return (
                AutonomyTierEnum.TIER_2_APPROVAL,
                DecisionStatusEnum.PENDING_APPROVAL,
                f"Moderate Impact: Delta is {abs_delta:.1f}% (above {t1_max_delta}% auto ceiling). Routed to One-Click Approval Inbox."
            )

        # 6. Tier 3 Strategic Escalation:
        # - Large budget shifts (> 30%)
        # - High risk (> 0.55) or low confidence (< 0.70)
        # - Major campaign structural mutations
        return (
            AutonomyTierEnum.TIER_3_ESCALATION,
            DecisionStatusEnum.PENDING_APPROVAL,
            f"Mandatory Human Escalation: High impact/risk score ({risk_score:.2f}) or large delta ({abs_delta:.1f}%). Requires formal operator sign-off."
        )
