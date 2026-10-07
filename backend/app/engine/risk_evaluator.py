from typing import Dict, Any, Tuple, List
from datetime import datetime
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
    ) -> Tuple[AutonomyTierEnum, DecisionStatusEnum, str, List[Dict[str, Any]]]:
        """
        Evaluates risk & policy guardrails to assign Autonomy Tier, initial Decision Status,
        and structured guardrail evaluation breakdown:
        - Tier 1 Auto: Low risk (<=0.25), high confidence (>=0.85), delta <=10%, cooldown elapsed.
        - Tier 2 Approval: Moderate impact (10-30% delta, 1-click approval inbox).
        - Tier 3 Escalation: High impact/risk (>30% delta or risk >0.55 or kill switch active).
        """
        t1_max_delta = policy.tier1_max_budget_delta_pct if policy else 10.0
        t1_min_conf = policy.tier1_min_confidence_score if policy else 0.85
        t2_max_delta = policy.tier2_max_budget_delta_pct if policy else 30.0
        min_margin_floor = policy.min_contribution_margin_floor if policy else 0.15
        min_stock_buffer = policy.min_inventory_days_buffer if policy else 5
        cooldown_hours = policy.cooldown_hours if policy else 24
        kill_switch = policy.global_kill_switch_active if policy else False

        abs_delta = abs(delta_budget_pct)
        guardrails_evaluated = []

        # Guardrail 1: Global Kill Switch
        kill_switch_pass = not kill_switch
        guardrails_evaluated.append({
            "name": "Global Kill Switch Safety",
            "passed": kill_switch_pass,
            "detail": "Normal operation" if kill_switch_pass else "KILL SWITCH ACTIVE"
        })

        # Guardrail 2: Inventory Protection Floor
        sku_runout = sku.inventory_runout_days if sku else 30.0
        inventory_pass = not (sku_runout < min_stock_buffer and action_type == ActionTypeEnum.SCALE_BUDGET)
        guardrails_evaluated.append({
            "name": "Inventory Stockout Buffer",
            "passed": inventory_pass,
            "detail": f"{sku_runout:.1f} days remaining (buffer floor {min_stock_buffer}d)"
        })

        # Guardrail 3: Contribution Margin Floor
        sku_margin = sku.contribution_margin_pct if sku else 0.40
        margin_pass = not (sku_margin < min_margin_floor and action_type == ActionTypeEnum.SCALE_BUDGET)
        guardrails_evaluated.append({
            "name": "Contribution Margin Floor",
            "passed": margin_pass,
            "detail": f"Margin {sku_margin * 100:.1f}% (floor {min_margin_floor * 100:.1f}%)"
        })

        # Guardrail 4: Cooldown Window
        now = datetime.utcnow()
        hours_elapsed = ((now - campaign.last_adjusted_at).total_seconds() / 3600.0) if campaign.last_adjusted_at else 999.0
        cooldown_pass = hours_elapsed >= cooldown_hours or abs_delta == 0
        guardrails_evaluated.append({
            "name": "Cooldown Window (24h Safety)",
            "passed": cooldown_pass,
            "detail": f"{hours_elapsed:.1f}h elapsed since last mutation"
        })

        # Guardrail 5: Budget Shift Ceiling
        guardrails_evaluated.append({
            "name": "Budget Movement Limit",
            "passed": abs_delta <= t2_max_delta,
            "detail": f"Delta {abs_delta:.1f}% (Tier 1 limit {t1_max_delta}%, Tier 2 limit {t2_max_delta}%)"
        })

        # Evaluation Decision Logic:
        # 1. Kill switch forces Escalation
        if not kill_switch_pass:
            return (
                AutonomyTierEnum.TIER_3_ESCALATION,
                DecisionStatusEnum.PENDING_APPROVAL,
                "Global execution kill switch is ACTIVE. All autonomous operations are halted; manual review mandatory.",
                guardrails_evaluated
            )

        # 2. Inventory / Margin violation on scale forces Escalation
        if not inventory_pass or not margin_pass:
            return (
                AutonomyTierEnum.TIER_3_ESCALATION,
                DecisionStatusEnum.PENDING_APPROVAL,
                f"Blocked by Policy Guardrails: Economics or inventory floor breached. Scaling ad spend prohibited.",
                guardrails_evaluated
            )

        # 3. Active Cooldown routes to Tier 2 Approval
        if not cooldown_pass:
            return (
                AutonomyTierEnum.TIER_2_APPROVAL,
                DecisionStatusEnum.PENDING_APPROVAL,
                f"Cooldown window active ({hours_elapsed:.1f}h / {cooldown_hours}h elapsed). Routed to 1-Click Approval to prevent learning phase disruption.",
                guardrails_evaluated
            )

        # 4. Tier 1 Autonomous Execution
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
                f"Autonomous Execution: Low risk ({risk_score:.2f}), high confidence ({confidence_score:.2f}), delta ({abs_delta:.1f}%) within {t1_max_delta}% guardrail.",
                guardrails_evaluated
            )

        # 5. Tier 2 One-Click Approval
        is_tier_2_eligible = (
            abs_delta <= t2_max_delta and
            confidence_score >= 0.70 and
            risk_score <= 0.55
        )

        if is_tier_2_eligible:
            return (
                AutonomyTierEnum.TIER_2_APPROVAL,
                DecisionStatusEnum.PENDING_APPROVAL,
                f"Moderate Impact: Delta is {abs_delta:.1f}% (above {t1_max_delta}% auto ceiling). Routed to One-Click Approval Inbox.",
                guardrails_evaluated
            )

        # 6. Tier 3 Strategic Escalation
        return (
            AutonomyTierEnum.TIER_3_ESCALATION,
            DecisionStatusEnum.PENDING_APPROVAL,
            f"Mandatory Escalation: High impact/risk score ({risk_score:.2f}) or large delta ({abs_delta:.1f}%). Requires formal operator sign-off.",
            guardrails_evaluated
        )
