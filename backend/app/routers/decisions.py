from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.models import (
    DecisionRecord, Campaign, ProductSKU, AnomalyRecord, DecisionStatusEnum,
    AutonomyTierEnum, PolicyConfig, CycleRunRecord, AuditLogRecord
)
from app.engine.pipeline import DecisionPipeline
from app.engine.execution_dispatcher import ExecutionDispatcher
from app.engine.risk_evaluator import RiskEvaluator

router = APIRouter(prefix="/decisions", tags=["Decisions"])

class RejectPayload(BaseModel):
    reason: str

class ModifyPayload(BaseModel):
    new_budget: float
    target_sku_id: Optional[str] = None

@router.get("")
async def list_decisions(
    tier: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List decisions with campaign details, anomaly context, and 3-tier classification."""
    query = select(DecisionRecord).order_by(DecisionRecord.created_at.desc())
    if tier:
        query = query.where(DecisionRecord.tier == tier)
    if status:
        query = query.where(DecisionRecord.status == status)

    res = await db.execute(query)
    decisions = res.scalars().all()

    output = []
    for d in decisions:
        camp_res = await db.execute(select(Campaign).where(Campaign.id == d.campaign_id))
        camp = camp_res.scalars().first()
        sku_name = "N/A"
        if camp and camp.target_sku_id:
            sku_res = await db.execute(select(ProductSKU).where(ProductSKU.id == camp.target_sku_id))
            sku = sku_res.scalars().first()
            if sku:
                sku_name = sku.name

        anom_desc = "Scheduled Strategy Optimization"
        if d.anomaly_id:
            anom_res = await db.execute(select(AnomalyRecord).where(AnomalyRecord.id == d.anomaly_id))
            anom = anom_res.scalars().first()
            if anom:
                anom_desc = anom.root_cause_summary

        output.append({
            "id": d.id,
            "cycle_id": d.cycle_id,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "executed_at": d.executed_at.isoformat() if d.executed_at else None,
            "tier": d.tier.value,
            "status": d.status.value,
            "campaign_id": d.campaign_id,
            "campaign_name": camp.name if camp else d.campaign_id,
            "channel": d.target_channel.value if d.target_channel else "meta",
            "target_sku": sku_name,
            "action_type": d.action_type.value,
            "delta_budget_pct": d.delta_budget_pct,
            "delta_budget_abs": d.delta_budget_abs,
            "current_budget": camp.daily_budget if camp else 0.0,
            "new_budget": d.new_budget,
            "rationale": d.rationale,
            "confidence_score": d.confidence_score,
            "risk_score": d.risk_score,
            "predicted_mer_lift": d.predicted_mer_lift,
            "predicted_roas_lift": d.predicted_roas_lift,
            "expected_contribution_profit": d.expected_contribution_profit,
            "guardrails_evaluated": d.guardrails_evaluated or [],
            "can_rollback": bool(d.rollback_payload and d.status in [DecisionStatusEnum.EXECUTED, DecisionStatusEnum.AUTO_EXECUTED]),
            "rejection_reason": d.rejection_reason,
            "council_debate": d.council_debate
        })
    return output

@router.get("/{decision_id}/debate")
async def get_decision_council_debate(
    decision_id: str,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Returns the full multi-agent council debate transcript and quorum votes for a decision."""
    res = await db.execute(select(DecisionRecord).where(DecisionRecord.id == decision_id))
    decision = res.scalars().first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    if not decision.council_debate:
        # Generate on-demand if legacy record didn't have one cached
        camp_res = await db.execute(select(Campaign).where(Campaign.id == decision.campaign_id))
        camp = camp_res.scalars().first()
        from app.engine.council_engine import AutonomousCouncilEngine
        debate = await AutonomousCouncilEngine.deliberate(campaign=camp)
        decision.council_debate = debate
        await db.commit()
        return debate

    return decision.council_debate

@router.get("/latest-cycle")
async def get_latest_cycle(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns the latest autonomous cycle run with full stage progression."""
    res = await db.execute(select(CycleRunRecord).order_by(CycleRunRecord.started_at.desc()))
    cycle = res.scalars().first()
    if not cycle:
        return {"active": False, "message": "No cycle has run yet."}

    return {
        "active": True,
        "id": cycle.id,
        "started_at": cycle.started_at.isoformat() if cycle.started_at else None,
        "completed_at": cycle.completed_at.isoformat() if cycle.completed_at else None,
        "status": cycle.status,
        "stages_log": cycle.stages_log or [],
        "anomalies_detected": cycle.anomalies_detected,
        "root_causes_evaluated": cycle.root_causes_evaluated,
        "opportunities_discovered": cycle.opportunities_discovered,
        "decisions_generated": cycle.decisions_generated,
        "tier1_auto_executed": cycle.tier1_auto_executed,
        "tier2_pending_approval": cycle.tier2_pending_approval,
        "tier3_escalated": cycle.tier3_escalated,
        "summary_message": cycle.summary_message
    }

@router.post("/run-cycle")
async def trigger_decision_cycle(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Runs the autonomous intelligence & decision cycle on demand."""
    pipeline = DecisionPipeline(db)
    result = await pipeline.run_cycle()
    return result

@router.post("/{decision_id}/approve")
async def approve_and_execute_decision(
    decision_id: str,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """1-Click operator approval and execution of a Tier 2 or Tier 3 decision."""
    dispatcher = ExecutionDispatcher(db)
    try:
        result = await dispatcher.execute_decision(decision_id, actor="OPERATOR_USER")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{decision_id}/modify")
async def modify_decision(
    decision_id: str,
    payload: ModifyPayload,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Modifies parameters of a pending decision and re-evaluates guardrails and tier."""
    res = await db.execute(select(DecisionRecord).where(DecisionRecord.id == decision_id))
    decision = res.scalars().first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if decision.status != DecisionStatusEnum.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Only pending decisions can be modified.")

    camp_res = await db.execute(select(Campaign).where(Campaign.id == decision.campaign_id))
    camp = camp_res.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Recalculate deltas
    old_budget = camp.daily_budget
    new_b = max(10.0, float(payload.new_budget))
    delta_abs = round(new_b - old_budget, 2)
    delta_pct = round((delta_abs / max(1.0, old_budget)) * 100, 1)

    policy_res = await db.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
    policy = policy_res.scalars().first()

    sku = None
    if payload.target_sku_id:
        decision.target_sku_id = payload.target_sku_id
    if decision.target_sku_id:
        sku_res = await db.execute(select(ProductSKU).where(ProductSKU.id == decision.target_sku_id))
        sku = sku_res.scalars().first()

    # Re-evaluate guardrails and tier
    tier, status, note, guardrails = RiskEvaluator.evaluate_decision_tier(
        action_type=decision.action_type,
        delta_budget_pct=delta_pct,
        confidence_score=decision.confidence_score,
        risk_score=decision.risk_score,
        campaign=camp,
        sku=sku,
        policy=policy
    )

    decision.new_budget = new_b
    decision.delta_budget_abs = delta_abs
    decision.delta_budget_pct = delta_pct
    decision.tier = tier
    decision.guardrails_evaluated = guardrails
    decision.rationale = f"{decision.rationale} [Modified by operator to ${new_b:,.2f}/day]"

    await db.commit()
    return {
        "success": True,
        "decision_id": decision.id,
        "new_budget": new_b,
        "delta_pct": delta_pct,
        "tier": tier.value,
        "guardrails_evaluated": guardrails
    }

@router.post("/{decision_id}/reject")
async def reject_decision(
    decision_id: str,
    payload: RejectPayload,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Rejects a pending recommendation with operator justification and audit record."""
    res = await db.execute(select(DecisionRecord).where(DecisionRecord.id == decision_id))
    decision = res.scalars().first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.status = DecisionStatusEnum.REJECTED
    decision.rejection_reason = payload.reason

    import uuid
    audit = AuditLogRecord(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        actor="OPERATOR_USER",
        action="REJECT_DECISION",
        entity_type="DECISION",
        entity_id=decision.id,
        details={"reason": payload.reason, "campaign_id": decision.campaign_id},
        notes=f"Operator rejected recommendation: {payload.reason}"
    )
    db.add(audit)
    await db.commit()
    return {"success": True, "decision_id": decision_id, "status": "REJECTED"}

@router.post("/{decision_id}/rollback")
async def rollback_executed_decision(
    decision_id: str,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """1-Click rollback to reverse an executed mutation atomically."""
    dispatcher = ExecutionDispatcher(db)
    try:
        result = await dispatcher.rollback_decision(decision_id, actor="OPERATOR_USER", reason="Operator 1-click rollback")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
