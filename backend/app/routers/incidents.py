from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.models import Campaign, ProductSKU

router = APIRouter(prefix="/incidents", tags=["Advertising War Room Incidents"])

class IncidentMitigationPayload(BaseModel):
    action_type: str = "FULL_CONTAINMENT"
    operator_note: Optional[str] = "Coordinated incident protocol deployed by operator"

INCIDENTS_DATABASE = [
    {
        "id": "INC-8092",
        "title": "Hero Lumen Serum Viral Demand Surge",
        "severity": "CRITICAL_P1",
        "status": "ACTIVE_INVESTIGATION",
        "category": "VIRAL_VELOCITY",
        "detected_at": "2026-10-08T08:14:20Z",
        "product_target": "Hero Lumen Serum (SKU-LUMEN-01)",
        "summary": "Product X went viral on social media causing a 240% demand surge while 23 ad campaigns continue aggressive acquisition spend.",
        "metrics": {
            "sales_delta": "+240%",
            "inventory_delta": "-68%",
            "competitor_price_delta": "-15%",
            "active_campaigns_count": 23,
            "daily_ad_spend": "$2,450/day",
            "hours_to_stockout": 18.4
        },
        "what_happened": {
            "event_description": "Unpredicted viral UGC surge on TikTok and Meta Reels triggered a massive spike in purchase velocity.",
            "signals": [
                "Shopify checkout volume surged from 14 to 52 orders/hour (+271%)",
                "Meta Ad Set #4 frequency jumped to 4.8x with conversion rate spiking to 6.2%",
                "Warehouse inventory depleted from 620 units down to 18 units in 36 hours",
                "Top competitor dropped price by 15% to defend market share"
            ]
        },
        "what_is_affected": {
            "campaigns": {
                "count": 23,
                "names": ["Meta Prospecting Broad", "Google Performance Max Serum", "TikTok Video Retargeting", "Amazon Sponsored Brand"]
            },
            "creatives": {
                "count": 4,
                "items": ["UGC_Hook_Serum_BeforeAfter.mp4", "Doctor_Dermatology_Review.mp4", "Serum_Static_Bundle.png", "Reels_SpeedReview.mp4"]
            },
            "audiences": {
                "count": 3,
                "names": ["US Women 25-45 Skincare (1.2M)", "Shopify Past 60D Purchasers Lookalike (850k)", "Google High-Intent Search In-Market"]
            },
            "inventory": {
                "current_stock": 18,
                "baseline_stock": 620,
                "runout_hours": 18,
                "status": "IMMINENT_STOCKOUT"
            }
        },
        "what_could_happen_next": {
            "stockout_window": "Complete stockout in ~18 hours at current acquisition rate",
            "ad_account_risk": "Shopify fulfillment delay warnings, Meta pixel out-of-stock ad penalty",
            "financial_risk": "$8,400 in backorders, cancellation refunds, and lost customer goodwill",
            "organic_penalty": "Amazon & Google organic search ranking drop if inventory goes to 0"
        },
        "affected_decisions": [
            {
                "area": "Campaign Messaging",
                "status": "ACTION_REQUIRED",
                "recommendation": "Update copy immediately from 'Ships within 24h' to 'Limited Batch Reserve — Next Drop Ships Monday'.",
                "action_type": "UPDATE_CREATIVE_COPY"
            },
            {
                "area": "Ad Spend & Channels",
                "status": "ACTION_REQUIRED",
                "recommendation": "Throttle top-of-funnel daily spend by 40% on Meta, shift $500/day into Night Cream (SKU-02 has 45d buffer).",
                "action_type": "THROTTLE_SPEND_REALLOCATE"
            },
            {
                "area": "Landing Page & Store",
                "status": "ACTION_REQUIRED",
                "recommendation": "Activate Shopify pre-order queue with live remaining stock badge (Only 18 bottles left).",
                "action_type": "ACTIVATE_PREORDER_FLOW"
            },
            {
                "area": "Customer Experience",
                "status": "ACTION_REQUIRED",
                "recommendation": "Send automated delivery expectations to recent buyers to prevent support ticket surge.",
                "action_type": "NOTIFY_OPS_TEAM"
            }
        ],
        "team_collaboration": [
            {"role": "AI Incident Commander", "author": "ASCEND Bot", "time": "08:14", "note": "🚨 P1 Incident Created: Viral demand surge detected. Blast radius evaluated across 23 campaigns."},
            {"role": "Supply Chain Lead", "author": "Dr. Elena Ramos", "time": "08:17", "note": "Warehouse confirms 18 bottles on shelf. Reorder batch of 1,200 is 9 days away at port."},
            {"role": "Growth Lead", "author": "Alex Vance", "time": "08:19", "note": "Throttling Meta Adset #4 right now. Switching creative angle to pre-order reservation."},
            {"role": "Virtual CFO", "author": "Marcus Sterling", "time": "08:21", "note": "Approved shift. Reallocating $500 into Night Cream protects $1,800/day in net contribution."}
        ]
    },
    {
        "id": "INC-8093",
        "title": "Competitor Price Dump & CPM Hijack War",
        "severity": "HIGH_P2",
        "status": "ACTIVE_INVESTIGATION",
        "category": "COMPETITIVE_AMBUSH",
        "detected_at": "2026-10-08T07:30:10Z",
        "product_target": "Glow Peptide Hydrator (SKU-LUMEN-02)",
        "summary": "Primary rival launched an aggressive 35% flash discount across Google Shopping, cutting our ROAS from 3.8x to 1.4x.",
        "metrics": {
            "sales_delta": "-42%",
            "inventory_delta": "+12%",
            "competitor_price_delta": "-35%",
            "active_campaigns_count": 18,
            "daily_ad_spend": "$1,800/day",
            "hours_to_stockout": 240.0
        },
        "what_happened": {
            "event_description": "Competitor brand 'DermaLuxe' slashed price from $48 to $31 on Google Shopping and bid up brand keywords.",
            "signals": [
                "Google Shopping conversion rate dropped from 4.2% to 1.1% overnight",
                "Impression share on top skincare keywords plummeted by 38%",
                "Google Ad spend burning at $1,800/day below breakeven threshold"
            ]
        },
        "what_is_affected": {
            "campaigns": {
                "count": 18,
                "names": ["Google Search Brand Defense", "Google Shopping Top SKUs", "Meta Prospecting Hydrator"]
            },
            "creatives": {"count": 3, "items": ["Hydrator_Benefit_Duo.mp4", "Price_Comparison_Card.png", "Before_After_Static.png"]},
            "audiences": {"count": 2, "names": ["Google High-Intent Shoppers", "Meta Anti-Aging Audience"]},
            "inventory": {"current_stock": 420, "baseline_stock": 450, "runout_hours": 320, "status": "SURPLUS_INVENTORY"}
        },
        "what_could_happen_next": {
            "stockout_window": "No stockout danger; surplus inventory holding cost risk",
            "ad_account_risk": "Negative contribution margin bleed of -$720/day if ad bidding continues unchanged",
            "financial_risk": "Estimated $5,100 wasted ad spend over 7 days",
            "organic_penalty": "Conversion rate decline degrades Google Ad Quality Score"
        },
        "affected_decisions": [
            {
                "area": "Campaign Messaging",
                "status": "ACTION_REQUIRED",
                "recommendation": "Pivot value prop from price to superior medical-grade peptide formulation.",
                "action_type": "REPOSITION_COPY"
            },
            {
                "area": "Ad Spend & Channels",
                "status": "ACTION_REQUIRED",
                "recommendation": "Cap max CPC bid by 25% on disputed terms to prevent price-war bleed.",
                "action_type": "CAP_KEYWORD_BIDS"
            },
            {
                "area": "Store & Bundling",
                "status": "ACTION_REQUIRED",
                "recommendation": "Deploy 'Buy Hydrator + Get Serum 50% Off' bundle to raise AOV to $72 and out-monetize rival.",
                "action_type": "DEPLOY_BUNDLE_OFFER"
            }
        ],
        "team_collaboration": [
            {"role": "AI Incident Commander", "author": "ASCEND Bot", "time": "07:30", "note": "🚨 P2 Incident: Rival flash sale stealing conversion share. ROAS breached safety floor."},
            {"role": "Growth Lead", "author": "Alex Vance", "time": "07:34", "note": "We shouldn't play the race-to-the-bottom price war. Bundling preserves margin."},
            {"role": "Virtual CFO", "author": "Marcus Sterling", "time": "07:38", "note": "Agreed. Dropping prices loses 22% contribution margin. Enact bundle protocol."}
        ]
    }
]

@router.get("")
async def list_incidents() -> List[Dict[str, Any]]:
    """Lists all active advertising incidents with blast radius and telemetry."""
    return INCIDENTS_DATABASE

@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str) -> Dict[str, Any]:
    """Returns the full structured incident dossier for an advertising war room event."""
    for inc in INCIDENTS_DATABASE:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@router.post("/{incident_id}/mitigate")
async def mitigate_incident(incident_id: str, payload: IncidentMitigationPayload) -> Dict[str, Any]:
    """Executes the coordinated cross-channel incident runbook to contain the event."""
    for inc in INCIDENTS_DATABASE:
        if inc["id"] == incident_id:
            inc["status"] = "CONTAINED"
            inc["team_collaboration"].append({
                "role": "Operator Action",
                "author": "Operator Commander",
                "time": datetime.utcnow().strftime("%H:%M"),
                "note": f"⚡ Incident Contained: {payload.operator_note}. Runbook actions deployed across ad platforms and store."
            })
            return {
                "success": True,
                "incident_id": incident_id,
                "status": "CONTAINED",
                "message": "Incident containment protocol successfully executed across all 23 campaigns."
            }
    raise HTTPException(status_code=404, detail="Incident not found")
