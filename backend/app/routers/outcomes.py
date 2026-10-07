from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List

from app.database import get_db
from app.models.models import OutcomeMeasurement, DecisionRecord, Campaign
from app.engine.feedback_loop import FeedbackLoopEvaluator

router = APIRouter(prefix="/outcomes", tags=["Outcomes & Learning"])

@router.get("")
async def list_outcomes(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns retrospective outcome measurements of executed decisions (Predicted vs Actual)."""
    res = await db.execute(select(OutcomeMeasurement).order_by(OutcomeMeasurement.evaluated_at.desc()))
    outcomes = res.scalars().all()

    output = []
    for o in outcomes:
        dec_res = await db.execute(select(DecisionRecord).where(DecisionRecord.id == o.decision_id))
        dec = dec_res.scalars().first()

        camp_name = "N/A"
        channel = "meta"
        if dec:
            channel = dec.target_channel.value if dec.target_channel else "meta"
            camp_res = await db.execute(select(Campaign).where(Campaign.id == dec.campaign_id))
            camp = camp_res.scalars().first()
            if camp:
                camp_name = camp.name

        output.append({
            "id": o.id,
            "decision_id": o.decision_id,
            "evaluated_at": o.evaluated_at.isoformat() if o.evaluated_at else None,
            "window_type": o.window_type,
            "campaign_name": camp_name,
            "channel": channel,
            "baseline_roas": o.baseline_roas,
            "post_roas": o.post_roas,
            "actual_roas_lift_pct": o.actual_roas_lift_pct,
            "predicted_roas_lift_pct": round(dec.predicted_roas_lift * 100, 1) if dec else 0.0,
            "baseline_mer": o.baseline_mer,
            "post_mer": o.post_mer,
            "actual_mer_lift_pct": o.actual_mer_lift_pct,
            "contribution_margin_delta": o.contribution_margin_delta,
            "is_success": o.is_success,
            "learning_notes": o.learning_notes
        })
    return output

@router.post("/evaluate")
async def evaluate_outcomes(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Manually triggers evaluation of observation windows (24h/72h/7d) for executed decisions."""
    evaluator = FeedbackLoopEvaluator(db)
    results = await evaluator.evaluate_pending_outcomes()
    return {"success": True, "evaluated_count": len(results), "evaluations": results}
