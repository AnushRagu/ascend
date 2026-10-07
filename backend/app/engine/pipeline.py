from typing import List, Dict, Any
from datetime import datetime
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import (
    Campaign, ProductSKU, AnomalyRecord, DecisionRecord, PolicyConfig,
    AutonomyTierEnum, DecisionStatusEnum, ActionTypeEnum
)
from app.engine.anomaly_detector import AnomalyDetector
from app.engine.budget_optimizer import BudgetOptimizer
from app.engine.reasoning_agent import ReasoningAgent
from app.engine.risk_evaluator import RiskEvaluator
from app.engine.execution_dispatcher import ExecutionDispatcher

logger = logging.getLogger(__name__)

class DecisionPipeline:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.detector = AnomalyDetector(session)
        self.agent = ReasoningAgent()
        self.dispatcher = ExecutionDispatcher(session)

    async def run_cycle(self) -> Dict[str, Any]:
        """
        Executes one full autonomous intelligence & decision cycle:
        1. Run Anomaly Detection
        2. For each anomaly, calculate math bounds & reasoning
        3. Evaluate 3-tier risk & policy guardrails
        4. Auto-execute Tier 1; route Tier 2/3 to Approval Inbox
        """
        policy_res = await self.session.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
        policy = policy_res.scalars().first()

        anomalies = await self.detector.run_detection_pipeline()
        generated_decisions = []
        auto_executed_count = 0
        pending_approval_count = 0

        for anom in anomalies:
            # Check if there is already an active unresolved decision for this anomaly/campaign
            existing_dec = await self.session.execute(
                select(DecisionRecord).where(
                    DecisionRecord.campaign_id == anom.campaign_id,
                    DecisionRecord.status.in_([DecisionStatusEnum.PENDING_APPROVAL])
                )
            )
            if existing_dec.scalars().first():
                continue

            camp_res = await self.session.execute(select(Campaign).where(Campaign.id == anom.campaign_id))
            camp = camp_res.scalars().first()
            if not camp:
                continue

            sku = None
            if camp.target_sku_id:
                sku_res = await self.session.execute(select(ProductSKU).where(ProductSKU.id == camp.target_sku_id))
                sku = sku_res.scalars().first()

            # Mathematical allocation bounds
            budget_opt = BudgetOptimizer.calculate_optimal_allocation(
                current_budget=camp.daily_budget,
                current_roas=camp.current_roas,
                target_roas=2.5,
                contribution_margin_pct=sku.contribution_margin_pct if sku else 0.40,
                inventory_runout_days=sku.inventory_runout_days if sku else 30.0
            )

            # AI / Neuro-symbolic synthesis
            rec = await self.agent.generate_decision_recommendation(anom, camp, sku, budget_opt)

            action_type_str = rec.get("action_type", ActionTypeEnum.REDUCE_BUDGET.value)
            try:
                action_type = ActionTypeEnum(action_type_str)
            except ValueError:
                action_type = ActionTypeEnum.REDUCE_BUDGET

            delta_pct = float(rec.get("delta_budget_pct", 0.0))
            delta_abs = float(rec.get("delta_budget_abs", 0.0))
            new_budget = float(rec.get("new_budget", camp.daily_budget))
            confidence = float(rec.get("confidence_score", 0.85))
            risk = float(rec.get("risk_score", 0.20))
            rationale = rec.get("rationale", "Autonomous performance optimization.")
            pred_mer = float(rec.get("predicted_mer_lift", 0.12))
            pred_roas = float(rec.get("predicted_roas_lift", 0.15))

            # 3-Tier Risk & Guardrail Evaluation
            tier, initial_status, tier_note = RiskEvaluator.evaluate_decision_tier(
                action_type=action_type,
                delta_budget_pct=delta_pct,
                confidence_score=confidence,
                risk_score=risk,
                campaign=camp,
                sku=sku,
                policy=policy
            )

            decision = DecisionRecord(
                id=f"dec_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}",
                created_at=datetime.utcnow(),
                tier=tier,
                status=initial_status,
                anomaly_id=anom.id,
                campaign_id=camp.id,
                action_type=action_type,
                delta_budget_pct=delta_pct,
                delta_budget_abs=delta_abs,
                new_budget=new_budget,
                target_channel=camp.channel,
                proposed_by="ASCEND_AUTONOMOUS_ENGINE",
                rationale=f"{rationale} [{tier_note}]",
                confidence_score=confidence,
                risk_score=risk,
                predicted_mer_lift=pred_mer,
                predicted_roas_lift=pred_roas
            )
            self.session.add(decision)
            await self.session.commit()

            # If Tier 1 Auto-Executed, trigger execution dispatcher immediately
            if initial_status == DecisionStatusEnum.AUTO_EXECUTED:
                try:
                    await self.dispatcher.execute_decision(decision.id, actor="ASCEND_AUTOPILOT")
                    auto_executed_count += 1
                except Exception as e:
                    logger.error(f"Auto-execution failed for decision {decision.id}: {e}")
            else:
                pending_approval_count += 1

            generated_decisions.append({
                "id": decision.id,
                "tier": decision.tier.value,
                "status": decision.status.value,
                "campaign": camp.name,
                "delta_pct": delta_pct,
                "action_type": action_type.value
            })

        return {
            "anomalies_detected": len(anomalies),
            "decisions_generated": len(generated_decisions),
            "tier1_auto_executed": auto_executed_count,
            "tier2_tier3_pending_approval": pending_approval_count,
            "decisions": generated_decisions
        }
