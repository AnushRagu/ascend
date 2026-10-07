from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.models import PolicyConfig, AuditLogRecord
import uuid

router = APIRouter(prefix="/policies", tags=["Policies & Guardrails"])

class UpdatePolicyPayload(BaseModel):
    tier1_max_budget_delta_pct: float
    tier1_min_confidence_score: float
    tier2_max_budget_delta_pct: float
    min_contribution_margin_floor: float
    min_inventory_days_buffer: int
    cooldown_hours: int
    auto_rollback_drop_pct: float

class KillSwitchPayload(BaseModel):
    active: bool
    reason: str = "Operator manual kill switch toggle"

@router.get("")
async def get_policies(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns current active policy guardrails and kill switch status."""
    res = await db.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
    policy = res.scalars().first()
    if not policy:
        policy = PolicyConfig(id="default")
        db.add(policy)
        await db.commit()

    return {
        "tier1_max_budget_delta_pct": policy.tier1_max_budget_delta_pct,
        "tier1_min_confidence_score": policy.tier1_min_confidence_score,
        "tier2_max_budget_delta_pct": policy.tier2_max_budget_delta_pct,
        "min_contribution_margin_floor": policy.min_contribution_margin_floor,
        "min_inventory_days_buffer": policy.min_inventory_days_buffer,
        "cooldown_hours": policy.cooldown_hours,
        "auto_rollback_drop_pct": policy.auto_rollback_drop_pct,
        "global_kill_switch_active": policy.global_kill_switch_active,
        "updated_at": policy.updated_at.isoformat() if policy.updated_at else None
    }

@router.put("")
async def update_policies(payload: UpdatePolicyPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Updates policy guardrail parameters."""
    res = await db.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
    policy = res.scalars().first()
    if not policy:
        policy = PolicyConfig(id="default")
        db.add(policy)

    policy.tier1_max_budget_delta_pct = payload.tier1_max_budget_delta_pct
    policy.tier1_min_confidence_score = payload.tier1_min_confidence_score
    policy.tier2_max_budget_delta_pct = payload.tier2_max_budget_delta_pct
    policy.min_contribution_margin_floor = payload.min_contribution_margin_floor
    policy.min_inventory_days_buffer = payload.min_inventory_days_buffer
    policy.cooldown_hours = payload.cooldown_hours
    policy.auto_rollback_drop_pct = payload.auto_rollback_drop_pct
    policy.updated_at = datetime.utcnow()

    # Log audit
    audit = AuditLogRecord(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        actor="OPERATOR_USER",
        action="UPDATE_GUARDRAIL_POLICIES",
        entity_type="POLICY",
        entity_id="default",
        details=payload.model_dump(),
        notes="Updated autonomy threshold boundaries."
    )
    db.add(audit)
    await db.commit()
    return {"success": True, "message": "Policy guardrails updated successfully."}

@router.post("/kill-switch")
async def toggle_kill_switch(payload: KillSwitchPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Master kill switch: Immediately enables or disables all autonomous mutations across platforms."""
    res = await db.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
    policy = res.scalars().first()
    if not policy:
        policy = PolicyConfig(id="default")
        db.add(policy)

    policy.global_kill_switch_active = payload.active
    policy.updated_at = datetime.utcnow()

    audit = AuditLogRecord(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        actor="OPERATOR_USER",
        action="EMERGENCY_KILL_SWITCH_TOGGLE",
        entity_type="POLICY",
        entity_id="default",
        details={"active": payload.active, "reason": payload.reason},
        notes=f"Global Kill Switch set to {payload.active}."
    )
    db.add(audit)
    await db.commit()

    return {
        "success": True,
        "global_kill_switch_active": policy.global_kill_switch_active,
        "message": f"Global Kill Switch {'ENGAGED' if policy.global_kill_switch_active else 'DISENGAGED'}."
    }
