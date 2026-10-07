from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.models import (
    Campaign, ProductSKU, AdSetCreative, MetricRecord, AnomalyRecord, DecisionRecord
)
from app.connectors.simulator import ScenarioSimulator

router = APIRouter(prefix="/simulator", tags=["Simulator"])

class ScenarioPayload(BaseModel):
    scenario_id: str  # "FATIGUE", "STOCKOUT", "ARBITRAGE", "MARGIN_COMPRESSION"

@router.post("/seed")
async def seed_data(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Reseeds initial products, campaigns, ad sets, and historical telemetry."""
    await ScenarioSimulator.seed_initial_state(db)
    return {"success": True, "message": "Baseline enterprise D2C state initialized."}

@router.post("/trigger-scenario")
async def trigger_scenario(payload: ScenarioPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Injects real-time crisis or opportunity events into the telemetry data."""
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
        # Drop Hero Lumen Serum inventory to 8 units
        res = await db.execute(select(ProductSKU).where(ProductSKU.id == "sku_lumen_serum"))
        sku = res.scalars().first()
        if sku:
            sku.inventory_stock = 8  # Under 1 day of stock!
            sku.sales_velocity_7d = 16.0

        await db.commit()
        return {
            "success": True,
            "scenario": "HERO_SKU_STOCKOUT_THREAT",
            "impact": "Hero Lumen Serum stock collapsed to 8 units (0.5 days runout). Active spend still at $1,250/day!"
        }

    elif scenario == "ARBITRAGE":
        # Surge Google & Amazon efficiency
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
        # Uncoordinated discount code cuts net contribution margin
        res = await db.execute(select(ProductSKU).where(ProductSKU.id == "sku_spf_drops"))
        sku = res.scalars().first()
        if sku:
            sku.contribution_margin_pct = 0.08  # Drops to 8% margin!

        await db.commit()
        return {
            "success": True,
            "scenario": "MARGIN_COMPRESSION_DISCOUNT",
            "impact": "Discount code cannibalization dropped Glow SPF Drops contribution margin to 8% (below 15% floor)."
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario {scenario}")
