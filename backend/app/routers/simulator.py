from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.models import (
    Campaign, ProductSKU, AdSetCreative, MetricRecord, AnomalyRecord, DecisionRecord, PolicyConfig, DecisionStatusEnum
)
from app.connectors.simulator import ScenarioSimulator
from app.engine.feedback_loop import FeedbackLoopEvaluator

router = APIRouter(prefix="/simulator", tags=["Simulator"])

class ScenarioPayload(BaseModel):
    scenario_id: str  # "FATIGUE", "STOCKOUT", "ARBITRAGE", "MARGIN_COMPRESSION"

class FastForwardPayload(BaseModel):
    hours: int = 24  # 24, 72, 168 (7 days)

@router.post("/seed")
async def seed_data(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Reseeds initial products, campaigns, ad sets, and historical telemetry deterministically."""
    await ScenarioSimulator.seed_initial_state(db, force_reset=True)
    return {"success": True, "message": "Baseline enterprise D2C state deterministically initialized."}

@router.post("/fast-forward")
async def fast_forward_time(payload: FastForwardPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Advances time by N hours and evaluates observation windows for executed decisions."""
    evaluator = FeedbackLoopEvaluator(db)
    
    # Fetch executed decisions
    res = await db.execute(
        select(DecisionRecord).where(
            DecisionRecord.status.in_([DecisionStatusEnum.AUTO_EXECUTED, DecisionStatusEnum.EXECUTED]),
            DecisionRecord.executed_at.is_not(None)
        )
    )
    decisions = res.scalars().all()

    if not decisions:
        return {
            "success": True,
            "hours_advanced": payload.hours,
            "evaluations_run": 0,
            "results": [],
            "message": "Fast-forwarded telemetry by " + str(payload.hours) + " hours. No executed decisions are active yet. (Run an Autonomous Cycle or Approve a decision first so ASCEND can measure its counterfactual outcome in CRM & Outcomes!)."
        }

    # Simulate time passing by shifting decision execution timestamps backward
    from datetime import timedelta
    for d in decisions:
        d.executed_at = d.executed_at - timedelta(hours=payload.hours)
    await db.commit()

    target_window = "24H" if payload.hours <= 36 else ("72H" if payload.hours <= 96 else "7D")
    evaluation_results = await evaluator.evaluate_pending_outcomes(force_window=target_window)
    return {
        "success": True,
        "hours_advanced": payload.hours,
        "evaluations_run": len(evaluation_results),
        "results": evaluation_results,
        "message": f"Fast-forwarded telemetry by {payload.hours}h. Evaluated {len(evaluation_results)} closed-loop outcomes in CRM & Outcomes tab."
    }

@router.post("/trigger-scenario")
async def trigger_scenario(payload: ScenarioPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Injects real-time crisis or opportunity events into the underlying operational state."""
    scenario = payload.scenario_id.upper()

    if scenario == "FATIGUE":
        # Spike creative fatigue and CPM on Meta
        res = await db.execute(select(AdSetCreative).where(AdSetCreative.id == "ad_meta_hero_vid1"))
        ad = res.scalars().first()
        if ad:
            ad.fatigue_score = 0.94
            ad.frequency = 5.2
            ad.cpm = 52.0
            ad.ctr = 0.65

        camp_res = await db.execute(select(Campaign).where(Campaign.id == "camp_meta_01"))
        camp = camp_res.scalars().first()
        if camp:
            camp.current_roas = 1.25
            camp.current_cpa = 58.00

        await db.commit()
        return {
            "success": True,
            "scenario": "CREATIVE_FATIGUE_CPM_SURGE",
            "impact": "Meta Video Hook #1 fatigue surged to 0.94; CPM climbed to $52.00; ROAS crashed to 1.25x."
        }

    elif scenario == "STOCKOUT":
        # Drop Hero Lumen Serum inventory to 8 units (< 1 day of runout)
        res = await db.execute(select(ProductSKU).where(ProductSKU.id == "sku_lumen_serum"))
        sku = res.scalars().first()
        if sku:
            sku.inventory_stock = 8
            sku.sales_velocity_7d = 16.0

        await db.commit()
        return {
            "success": True,
            "scenario": "HERO_SKU_STOCKOUT_THREAT",
            "impact": "Hero Lumen Serum stock collapsed to 8 units (0.5 days runout). Active spend still at $1,250/day!"
        }

    elif scenario == "ARBITRAGE":
        # Surge Google & Amazon efficiency while Meta drops
        g_res = await db.execute(select(Campaign).where(Campaign.id == "camp_goog_01"))
        g_camp = g_res.scalars().first()
        if g_camp:
            g_camp.current_roas = 4.85

        a_res = await db.execute(select(Campaign).where(Campaign.id == "camp_amz_01"))
        a_camp = a_res.scalars().first()
        if a_camp:
            a_camp.current_roas = 5.10

        m_res = await db.execute(select(Campaign).where(Campaign.id == "camp_meta_01"))
        m_camp = m_res.scalars().first()
        if m_camp:
            m_camp.current_roas = 1.35

        await db.commit()
        return {
            "success": True,
            "scenario": "CROSS_CHANNEL_ARBITRAGE",
            "impact": "Amazon and Google ROAS surged to 5.1x and 4.85x while Meta decayed to 1.35x. Reallocation window open."
        }

    elif scenario == "MARGIN_COMPRESSION":
        # Uncoordinated discount code cuts net contribution margin to 8%
        res = await db.execute(select(ProductSKU).where(ProductSKU.id == "sku_spf_drops"))
        sku = res.scalars().first()
        if sku:
            sku.contribution_margin_pct = 0.08

        await db.commit()
        return {
            "success": True,
            "scenario": "MARGIN_COMPRESSION_DISCOUNT",
            "impact": "Discount code cannibalization dropped Glow SPF Drops contribution margin to 8% (below 15% floor)."
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario {scenario}")
