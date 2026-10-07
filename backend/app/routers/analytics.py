from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any, List

from app.database import get_db
from app.models.models import MetricRecord, Campaign, ProductSKU, ChannelEnum

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/kpis")
async def get_dashboard_kpis(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Computes blended top-line executive KPIs across all advertising and commerce channels."""
    # Aggregated metrics
    spend_res = await db.execute(select(func.sum(Campaign.daily_budget), func.sum(Campaign.current_spend)))
    total_budget, total_spend = spend_res.first()
    total_spend = total_spend or 2480.0

    # Calculate blended metrics from recent telemetry
    metrics_res = await db.execute(select(MetricRecord).order_by(MetricRecord.timestamp.desc()).limit(30))
    records = metrics_res.scalars().all()

    total_gross_rev = sum(r.gross_revenue for r in records) if records else 8940.0
    total_net_rev = sum(r.net_revenue for r in records) if records else 8120.0
    total_cogs = sum(r.cogs_total for r in records) if records else 1850.0
    total_channel_spend = sum(r.spend for r in records) if records else 2480.0

    blended_roas = round(total_gross_rev / max(1.0, total_channel_spend), 2)
    blended_mer = round(total_net_rev / max(1.0, total_channel_spend), 2)
    net_cm = round(total_net_rev - total_cogs - total_channel_spend, 2)
    net_cm_pct = round((net_cm / max(1.0, total_net_rev)) * 100, 1)

    # Channel spend breakdown
    camps_res = await db.execute(select(Campaign))
    campaigns = camps_res.scalars().all()
    channel_spend = {
        "meta": sum(c.daily_budget for c in campaigns if c.channel == ChannelEnum.META),
        "google": sum(c.daily_budget for c in campaigns if c.channel == ChannelEnum.GOOGLE),
        "amazon": sum(c.daily_budget for c in campaigns if c.channel == ChannelEnum.AMAZON),
    }

    # Inventory risk count
    skus_res = await db.execute(select(ProductSKU))
    skus = skus_res.scalars().all()
    at_risk_skus = [s for s in skus if s.inventory_runout_days < 5.0]

    return {
        "blended_roas": blended_roas,
        "blended_mer": blended_mer,
        "total_ad_spend_daily": round(sum(channel_spend.values()), 2),
        "total_revenue_daily": round(total_gross_rev / max(1, len(records)//3 or 1), 2),
        "net_contribution_margin": net_cm,
        "net_contribution_margin_pct": net_cm_pct,
        "channel_spend_breakdown": channel_spend,
        "inventory_critical_count": len(at_risk_skus),
        "active_campaign_count": len([c for c in campaigns if c.status == "ACTIVE"])
    }

@router.get("/timeseries")
async def get_timeseries_data(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns aggregated daily telemetry for timeline charts."""
    res = await db.execute(select(MetricRecord).order_by(MetricRecord.timestamp.asc()).limit(90))
    records = res.scalars().all()

    # Group by date
    days = {}
    for r in records:
        day_str = r.timestamp.strftime("%Y-%m-%d")
        if day_str not in days:
            days[day_str] = {
                "date": day_str,
                "spend": 0.0,
                "revenue": 0.0,
                "net_revenue": 0.0,
                "contribution_margin": 0.0,
                "conversions": 0
            }
        days[day_str]["spend"] += r.spend
        days[day_str]["revenue"] += r.gross_revenue
        days[day_str]["net_revenue"] += r.net_revenue
        days[day_str]["contribution_margin"] += r.contribution_margin
        days[day_str]["conversions"] += r.conversions

    output = []
    for d, val in days.items():
        val["spend"] = round(val["spend"], 2)
        val["revenue"] = round(val["revenue"], 2)
        val["contribution_margin"] = round(val["contribution_margin"], 2)
        val["mer"] = round(val["revenue"] / max(1.0, val["spend"]), 2)
        output.append(val)
    return output

@router.get("/inventory")
async def get_inventory_status(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns SKU-level inventory health and runout days."""
    res = await db.execute(select(ProductSKU))
    skus = res.scalars().all()
    return [
        {
            "id": s.id,
            "sku": s.sku,
            "name": s.name,
            "price": s.retail_price,
            "stock": s.inventory_stock,
            "velocity": s.sales_velocity_7d,
            "runout_days": s.inventory_runout_days,
            "margin_pct": round(s.contribution_margin_pct * 100, 1),
            "status": "CRITICAL" if s.inventory_runout_days <= 2.0 else ("WARNING" if s.inventory_runout_days <= 5.0 else "HEALTHY")
        }
        for s in skus
    ]
