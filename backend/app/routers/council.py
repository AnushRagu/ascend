from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.models import Campaign, ProductSKU, AnomalyRecord, DecisionRecord, PolicyConfig
from app.engine.council_engine import AutonomousCouncilEngine

router = APIRouter(prefix="/council", tags=["Council War Room"])

class DeliberationRequest(BaseModel):
    campaign_id: Optional[str] = None
    scenario_type: Optional[str] = "STOCKOUT_HAZARD" # STOCKOUT_HAZARD, CREATIVE_FATIGUE, CROSS_CHANNEL_DISPARITY, MARGIN_COMPRESSION
    custom_topic: Optional[str] = None

@router.get("/agents")
async def get_council_agents() -> Dict[str, Any]:
    """Returns metadata, avatars, mandates, and weights for all Council agents."""
    return AutonomousCouncilEngine.AGENTS_METADATA

@router.get("/recent")
async def get_recent_debates(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns the most recent multi-agent council deliberations from decision history."""
    query = (
        select(DecisionRecord)
        .where(DecisionRecord.council_debate.isnot(None))
        .order_by(DecisionRecord.created_at.desc())
        .limit(10)
    )
    res = await db.execute(query)
    decisions = res.scalars().all()
    debates = []
    for d in decisions:
        if d.council_debate:
            debate_obj = dict(d.council_debate)
            debate_obj["decision_id"] = d.id
            debate_obj["decision_status"] = d.status.value
            debates.append(debate_obj)
    
    # If empty, generate a demo debate
    if not debates:
        camps_res = await db.execute(select(Campaign).limit(1))
        camp = camps_res.scalars().first()
        skus_res = await db.execute(select(ProductSKU).limit(1))
        sku = skus_res.scalars().first()
        demo = await AutonomousCouncilEngine.deliberate(campaign=camp, sku=sku)
        debates.append(demo)

    return debates

@router.post("/deliberate")
async def trigger_live_deliberation(
    payload: DeliberationRequest,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Triggers an instant, live multi-agent deliberation session between Growth, CFO, and Supply Sentinel.
    Allows judges to simulate conflicts and observe autonomous resolution in real-time.
    """
    camp = None
    if payload.campaign_id:
        camp_res = await db.execute(select(Campaign).where(Campaign.id == payload.campaign_id))
        camp = camp_res.scalars().first()
    
    if not camp:
        # Default to highest spending campaign
        camp_res = await db.execute(select(Campaign).order_by(Campaign.daily_budget.desc()).limit(1))
        camp = camp_res.scalars().first()

    sku = None
    if camp and camp.target_sku_id:
        sku_res = await db.execute(select(ProductSKU).where(ProductSKU.id == camp.target_sku_id))
        sku = sku_res.scalars().first()

    all_skus_res = await db.execute(select(ProductSKU))
    all_skus = all_skus_res.scalars().all()

    # Create mock anomaly matching scenario
    class MockAnomaly:
        def __init__(self, anom_type, camp_id, sku_id):
            self.anomaly_type = anom_type
            self.severity = "CRITICAL" if anom_type == "STOCKOUT_HAZARD" else "HIGH"
            self.campaign_id = camp_id
            self.sku_id = sku_id
            self.metric_name = "ROAS" if anom_type != "CREATIVE_FATIGUE" else "Frequency / CTR"
            self.root_cause_summary = f"Simulated live conflict: {anom_type}"

    mock_anom = MockAnomaly(payload.scenario_type or "STOCKOUT_HAZARD", camp.id if camp else None, sku.id if sku else None)

    policy_res = await db.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
    policy = policy_res.scalars().first()

    debate = await AutonomousCouncilEngine.deliberate(
        campaign=camp,
        anomaly=mock_anom,
        sku=sku,
        alternative_skus=all_skus,
        policy=policy
    )

    return debate
