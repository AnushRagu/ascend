from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.models import (
    DecisionRecord, Campaign, ProductSKU, AnomalyRecord, DecisionStatusEnum, AutonomyTierEnum
)
from app.engine.pipeline import DecisionPipeline
from app.engine.execution_dispatcher import ExecutionDispatcher

router = APIRouter(prefix="/decisions", tags=["Decisions"])

class RejectPayload(BaseModel):
    reason: str

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
            "can_rollback": bool(d.rollback_payload and d.status in [DecisionStatusEnum.EXECUTED, DecisionStatusEnum.AUTO_EXECUTED]),
            "rejection_reason": d.rejection_reason
        })
    return output

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

@router.post("/{decision_id}/reject")
async def reject_decision(
    decision_id: str,
    payload: RejectPayload,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Rejects a pending recommendation with operator justification."""
    res = await db.execute(select(DecisionRecord).where(DecisionRecord.id == decision_id))
    decision = res.scalars().first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.status = DecisionStatusEnum.REJECTED
    decision.rejection_reason = payload.reason
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
