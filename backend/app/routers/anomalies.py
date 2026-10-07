from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List

from app.database import get_db
from app.models.models import AnomalyRecord, Campaign, ProductSKU

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

@router.get("")
async def list_anomalies(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """List detected performance anomalies with root cause summaries, statistical detectors, and evidence packages."""
    res = await db.execute(select(AnomalyRecord).order_by(AnomalyRecord.timestamp.desc()))
    anomalies = res.scalars().all()

    output = []
    for a in anomalies:
        camp_res = await db.execute(select(Campaign).where(Campaign.id == a.campaign_id))
        camp = camp_res.scalars().first()

        sku_res = await db.execute(select(ProductSKU).where(ProductSKU.id == a.sku_id))
        sku = sku_res.scalars().first()

        output.append({
            "id": a.id,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "channel": a.channel.value if a.channel else "meta",
            "campaign_name": camp.name if camp else (a.campaign_id or "N/A"),
            "sku_name": sku.name if sku else "N/A",
            "anomaly_type": a.anomaly_type,
            "severity": a.severity.value if a.severity else "medium",
            "metric_name": a.metric_name,
            "current_value": a.current_value,
            "baseline_value": a.baseline_value,
            "deviation_pct": a.deviation_pct,
            "z_score": a.z_score,
            "detector_name": a.detector_name or "Rolling Z-score",
            "root_cause_summary": a.root_cause_summary,
            "evidence_package": a.evidence_package,
            "is_resolved": a.is_resolved
        })
    return output
