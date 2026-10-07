from typing import List, Dict, Any
from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.models import (
    ProductSKU, Campaign, AdSetCreative, MetricRecord, AnomalyRecord,
    DecisionRecord, OutcomeMeasurement, PolicyConfig, ChannelEnum,
    AutonomyTierEnum, DecisionStatusEnum, ActionTypeEnum, AnomalySeverityEnum
)

class ScenarioSimulator:
    @staticmethod
    async def seed_initial_state(session: AsyncSession):
        """Seed initial products, campaigns, ad sets, and 14 days of baseline telemetry."""
        # Check if already seeded
        res = await session.execute(select(ProductSKU))
        if res.scalars().first():
            return

        # 1. Product SKUs
        sku1 = ProductSKU(
            id="sku_lumen_serum",
            sku="HERO-LUMEN-SERUM",
            name="Lumen Vitamin C Brightening Serum (30ml)",
            retail_price=68.0,
            cogs=14.5,
            shipping_cost=5.2,
            inventory_stock=18,  # Critical low stock (runout danger!)
            sales_velocity_7d=14.0, # ~1.3 days remaining
            contribution_margin_pct=0.71
        )
        sku2 = ProductSKU(
            id="sku_hydra_cream",
            sku="HYDRA-BARRIER-CREAM",
            name="Ceramide Deep Moisture Barrier Cream (50ml)",
            retail_price=54.0,
            cogs=11.0,
            shipping_cost=4.8,
            inventory_stock=420,
            sales_velocity_7d=9.5,
            contribution_margin_pct=0.70
        )
        sku3 = ProductSKU(
            id="sku_spf_drops",
            sku="GLOW-SPF-DROPS",
            name="Glow Invisible Daily SPF 50+ (50ml)",
            retail_price=42.0,
            cogs=8.2,
            shipping_cost=4.5,
            inventory_stock=650,
            sales_velocity_7d=18.0,
            contribution_margin_pct=0.70
        )
        session.add_all([sku1, sku2, sku3])

        # 2. Campaigns
        c_meta_hero = Campaign(
            id="camp_meta_01",
            channel=ChannelEnum.META,
            name="[Meta] US_Advantage+_LumenSerum_Scaling",
            status="ACTIVE",
            daily_budget=1250.0,
            current_roas=1.65, # degraded due to fatigue & low stock
            current_cpa=48.20,
            current_spend=1240.0,
            target_sku_id="sku_lumen_serum"
        )
        c_meta_hydra = Campaign(
            id="camp_meta_02",
            channel=ChannelEnum.META,
            name="[Meta] Retargeting_MOFU_HydraCream",
            status="ACTIVE",
            daily_budget=450.0,
            current_roas=2.85,
            current_cpa=28.10,
            current_spend=445.0,
            target_sku_id="sku_hydra_cream"
        )
        c_google_pmax = Campaign(
            id="camp_goog_01",
            channel=ChannelEnum.GOOGLE,
            name="[Google] Performance_Max_Brand_SPF50",
            status="ACTIVE",
            daily_budget=800.0,
            current_roas=3.95,
            current_cpa=21.40,
            current_spend=795.0,
            target_sku_id="sku_spf_drops"
        )
        c_amz_sp = Campaign(
            id="camp_amz_01",
            channel=ChannelEnum.AMAZON,
            name="[Amazon] SP_Exact_HighIntent_Serum+Cream",
            status="ACTIVE",
            daily_budget=600.0,
            current_roas=4.40,
            current_cpa=18.50,
            current_spend=590.0,
            target_sku_id="sku_hydra_cream"
        )
        session.add_all([c_meta_hero, c_meta_hydra, c_google_pmax, c_amz_sp])

        # 3. Ad sets & Creatives
        ad_meta_1 = AdSetCreative(
            id="ad_meta_hero_vid1",
            campaign_id="camp_meta_01",
            name="UGC_Dermatologist_Reaction_Hook1",
            creative_type="VIDEO",
            headline="Dermatologists don't want you to see this glow",
            ctr=0.82, # Low CTR (fatigue)
            cpm=44.50, # High CPM
            frequency=4.75, # High frequency
            fatigue_score=0.88,
            status="ACTIVE"
        )
        ad_meta_2 = AdSetCreative(
            id="ad_meta_hero_img1",
            campaign_id="camp_meta_01",
            name="Static_BeforeAfter_Split_14Days",
            creative_type="IMAGE",
            headline="Real clinical results in 14 days",
            ctr=1.95,
            cpm=24.20,
            frequency=2.1,
            fatigue_score=0.25,
            status="ACTIVE"
        )
        session.add_all([ad_meta_1, ad_meta_2])

        # 4. Default Policy Config
        policy = PolicyConfig(
            id="default",
            tier1_max_budget_delta_pct=10.0,
            tier1_min_confidence_score=0.85,
            tier2_max_budget_delta_pct=30.0,
            min_contribution_margin_floor=0.15,
            min_inventory_days_buffer=5,
            cooldown_hours=24,
            auto_rollback_drop_pct=15.0,
            global_kill_switch_active=False
        )
        session.add(policy)

        # 5. Historical Telemetry (14 days)
        now = datetime.utcnow()
        for i in range(14, 0, -1):
            day_ts = now - timedelta(days=i)
            # Meta telemetry
            meta_spend = 1600.0 + random.uniform(-100, 100)
            meta_rev = meta_spend * (2.6 if i > 3 else 1.7) # Dropped in last 3 days
            session.add(MetricRecord(
                id=str(uuid.uuid4()),
                timestamp=day_ts,
                channel=ChannelEnum.META,
                campaign_id="camp_meta_01",
                impressions=int(meta_spend * 38),
                clicks=int(meta_spend * 0.9),
                spend=meta_spend,
                conversions=int(meta_rev / 68.0),
                gross_revenue=meta_rev,
                net_revenue=meta_rev * 0.92,
                cogs_total=meta_rev * 0.22,
                contribution_margin=(meta_rev * 0.92) - (meta_rev * 0.22) - meta_spend,
                mer=round(meta_rev / meta_spend, 2),
                roas=round(meta_rev / meta_spend, 2)
            ))
            # Google telemetry
            goog_spend = 780.0 + random.uniform(-40, 40)
            goog_rev = goog_spend * 3.8
            session.add(MetricRecord(
                id=str(uuid.uuid4()),
                timestamp=day_ts,
                channel=ChannelEnum.GOOGLE,
                campaign_id="camp_goog_01",
                impressions=int(goog_spend * 30),
                clicks=int(goog_spend * 1.5),
                spend=goog_spend,
                conversions=int(goog_rev / 42.0),
                gross_revenue=goog_rev,
                net_revenue=goog_rev * 0.94,
                cogs_total=goog_rev * 0.20,
                contribution_margin=(goog_rev * 0.94) - (goog_rev * 0.20) - goog_spend,
                mer=round(goog_rev / goog_spend, 2),
                roas=round(goog_rev / goog_spend, 2)
            ))
            # Amazon telemetry
            amz_spend = 590.0 + random.uniform(-30, 30)
            amz_rev = amz_spend * 4.3
            session.add(MetricRecord(
                id=str(uuid.uuid4()),
                timestamp=day_ts,
                channel=ChannelEnum.AMAZON,
                campaign_id="camp_amz_01",
                impressions=int(amz_spend * 40),
                clicks=int(amz_spend * 1.6),
                spend=amz_spend,
                conversions=int(amz_rev / 54.0),
                gross_revenue=amz_rev,
                net_revenue=amz_rev * 0.85, # Amazon referral fee
                cogs_total=amz_rev * 0.21,
                contribution_margin=(amz_rev * 0.85) - (amz_rev * 0.21) - amz_spend,
                mer=round(amz_rev / amz_spend, 2),
                roas=round(amz_rev / amz_spend, 2)
            ))

        # 6. Pre-seed a sample executed decision with closed-loop outcome for learning demonstration
        prev_decision = DecisionRecord(
            id="dec_hist_001",
            created_at=now - timedelta(days=4),
            executed_at=now - timedelta(days=4),
            tier=AutonomyTierEnum.TIER_1_AUTO,
            status=DecisionStatusEnum.AUTO_EXECUTED,
            campaign_id="camp_goog_01",
            action_type=ActionTypeEnum.SCALE_BUDGET,
            delta_budget_pct=8.0,
            delta_budget_abs=60.0,
            new_budget=800.0,
            target_channel=ChannelEnum.GOOGLE,
            rationale="Autonomous Tier 1 scaling: Google P-Max ROAS sustained 3.8x with high inventory coverage (>30 days).",
            confidence_score=0.92,
            risk_score=0.12,
            predicted_mer_lift=0.12,
            predicted_roas_lift=0.15,
            rollback_payload={"campaign_id": "camp_goog_01", "previous_budget": 740.0}
        )
        session.add(prev_decision)

        outcome_24h = OutcomeMeasurement(
            id=str(uuid.uuid4()),
            decision_id="dec_hist_001",
            evaluated_at=now - timedelta(days=3),
            window_type="24H",
            baseline_roas=3.65,
            post_roas=3.92,
            actual_roas_lift_pct=7.4,
            baseline_mer=3.50,
            post_mer=3.85,
            actual_mer_lift_pct=10.0,
            contribution_margin_delta=420.0,
            is_success=True,
            learning_notes="Budget scale safely absorbed without CPA degradation. Learning phase maintained."
        )
        outcome_72h = OutcomeMeasurement(
            id=str(uuid.uuid4()),
            decision_id="dec_hist_001",
            evaluated_at=now - timedelta(days=1),
            window_type="72H",
            baseline_roas=3.65,
            post_roas=4.05,
            actual_roas_lift_pct=10.9,
            baseline_mer=3.50,
            post_mer=3.95,
            actual_mer_lift_pct=12.8,
            contribution_margin_delta=1180.0,
            is_success=True,
            learning_notes="Incremental efficiency compounded with healthy contribution margin (+12.8%). Indexed into vector memory."
        )
        session.add_all([outcome_24h, outcome_72h])

        await session.commit()
