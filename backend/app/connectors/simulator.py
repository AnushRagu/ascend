from typing import List, Dict, Any
from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.models import (
    ProductSKU, Campaign, AdSetCreative, MetricRecord, AnomalyRecord,
    DecisionRecord, OutcomeMeasurement, PolicyConfig, ChannelEnum,
    AutonomyTierEnum, DecisionStatusEnum, ActionTypeEnum, AnomalySeverityEnum,
    CycleRunRecord, AuditLogRecord
)

class ScenarioSimulator:
    @staticmethod
    async def seed_initial_state(session: AsyncSession, force_reset: bool = False):
        """
        Seeds initial products, campaigns, ad sets, and 14 days of baseline telemetry.
        If force_reset is True, purges and restores deterministic baseline state.
        """
        BASELINE_SKU_IDS = {"sku_lumen_serum", "sku_hydra_cream", "sku_spf_drops"}

        if force_reset:
            await session.execute(delete(OutcomeMeasurement))
            await session.execute(delete(DecisionRecord))
            await session.execute(delete(AnomalyRecord))
            await session.execute(delete(CycleRunRecord))
            await session.execute(delete(MetricRecord))
            await session.execute(delete(AdSetCreative))
            await session.execute(delete(Campaign))
            # Delete only baseline SKUs on reset, preserving custom user-created SKUs!
            await session.execute(delete(ProductSKU).where(ProductSKU.id.in_(BASELINE_SKU_IDS), ProductSKU.is_deleted != True))
            await session.execute(delete(AuditLogRecord))
            await session.commit()
        else:
            res = await session.execute(select(ProductSKU).where(ProductSKU.id == "sku_lumen_serum"))
            if res.scalars().first():
                return

        # Check which baseline SKUs were marked deleted
        deleted_res = await session.execute(select(ProductSKU.id).where(ProductSKU.id.in_(BASELINE_SKU_IDS), ProductSKU.is_deleted == True))
        deleted_ids = set(deleted_res.scalars().all())

        # 1. Baseline Product SKUs (Recreated or updated to deterministic defaults if not deleted by user)
        skus_to_add = []
        if "sku_lumen_serum" not in deleted_ids:
            skus_to_add.append(ProductSKU(
                id="sku_lumen_serum",
                sku="HERO-LUMEN-SERUM",
                name="Lumen Vitamin C Brightening Serum (30ml)",
                retail_price=68.0,
                cogs=14.5,
                shipping_cost=5.2,
                inventory_stock=380,  # Healthy baseline (380 units / 14 per day = 27 days runout)
                sales_velocity_7d=14.0,
                contribution_margin_pct=0.71,
                is_deleted=False
            ))
        if "sku_hydra_cream" not in deleted_ids:
            skus_to_add.append(ProductSKU(
                id="sku_hydra_cream",
                sku="HYDRA-BARRIER-CREAM",
                name="Ceramide Deep Moisture Barrier Cream (50ml)",
                retail_price=54.0,
                cogs=11.0,
                shipping_cost=4.8,
                inventory_stock=420,
                sales_velocity_7d=9.5,
                contribution_margin_pct=0.70,
                is_deleted=False
            ))
        if "sku_spf_drops" not in deleted_ids:
            skus_to_add.append(ProductSKU(
                id="sku_spf_drops",
                sku="GLOW-SPF-DROPS",
                name="Glow Invisible Daily SPF 50+ (50ml)",
                retail_price=42.0,
                cogs=8.2,
                shipping_cost=4.5,
                inventory_stock=650,
                sales_velocity_7d=18.0,
                contribution_margin_pct=0.70,
                is_deleted=False
            ))

        if skus_to_add:
            session.add_all(skus_to_add)

        # 2. Campaigns
        c_meta_hero = Campaign(
            id="camp_meta_01",
            channel=ChannelEnum.META,
            name="[Meta] US_Advantage+_LumenSerum_Scaling",
            status="ACTIVE",
            daily_budget=1250.0,
            current_roas=2.85, # Healthy baseline
            current_cpa=32.20,
            current_spend=1240.0,
            target_sku_id="sku_lumen_serum",
            last_adjusted_at=datetime.utcnow() - timedelta(days=2) # Outside 24h cooldown
        )
        c_meta_hydra = Campaign(
            id="camp_meta_02",
            channel=ChannelEnum.META,
            name="[Meta] Retargeting_MOFU_HydraCream",
            status="ACTIVE",
            daily_budget=450.0,
            current_roas=2.95,
            current_cpa=28.10,
            current_spend=445.0,
            target_sku_id="sku_hydra_cream",
            last_adjusted_at=datetime.utcnow() - timedelta(days=3)
        )
        c_google_pmax = Campaign(
            id="camp_goog_01",
            channel=ChannelEnum.GOOGLE,
            name="[Google] Performance_Max_Brand_SPF50",
            status="ACTIVE",
            daily_budget=800.0,
            current_roas=3.45,
            current_cpa=21.40,
            current_spend=795.0,
            target_sku_id="sku_spf_drops",
            last_adjusted_at=datetime.utcnow() - timedelta(days=2)
        )
        c_amz_sp = Campaign(
            id="camp_amz_01",
            channel=ChannelEnum.AMAZON,
            name="[Amazon] SP_Exact_HighIntent_Serum+Cream",
            status="ACTIVE",
            daily_budget=600.0,
            current_roas=3.60,
            current_cpa=18.50,
            current_spend=590.0,
            target_sku_id="sku_hydra_cream",
            last_adjusted_at=datetime.utcnow() - timedelta(days=4)
        )
        session.add_all([c_meta_hero, c_meta_hydra, c_google_pmax, c_amz_sp])

        # 3. Ad sets & Creatives
        ad_meta_1 = AdSetCreative(
            id="ad_meta_hero_vid1",
            campaign_id="camp_meta_01",
            name="UGC_Dermatologist_Reaction_Hook1",
            creative_type="VIDEO",
            headline="Dermatologists don't want you to see this glow",
            ctr=2.1,
            cpm=22.50,
            frequency=1.8,
            fatigue_score=0.22,
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
        policy_res = await session.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
        policy = policy_res.scalars().first()
        if not policy:
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
        else:
            policy.global_kill_switch_active = False

        # 5. Historical Telemetry (14 days)
        now = datetime.utcnow()
        for i in range(14, 0, -1):
            day_ts = now - timedelta(days=i)
            # Meta telemetry
            meta_spend = 1700.0 + (i * 12.0)
            meta_rev = meta_spend * 2.85
            session.add(MetricRecord(
                id=str(uuid.uuid4()),
                timestamp=day_ts,
                channel=ChannelEnum.META,
                campaign_id="camp_meta_01",
                impressions=int(meta_spend * 40),
                clicks=int(meta_spend * 0.95),
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
            goog_spend = 800.0 + (i * 5.0)
            goog_rev = goog_spend * 3.45
            session.add(MetricRecord(
                id=str(uuid.uuid4()),
                timestamp=day_ts,
                channel=ChannelEnum.GOOGLE,
                campaign_id="camp_goog_01",
                impressions=int(goog_spend * 32),
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
            amz_spend = 600.0 + (i * 4.0)
            amz_rev = amz_spend * 3.60
            session.add(MetricRecord(
                id=str(uuid.uuid4()),
                timestamp=day_ts,
                channel=ChannelEnum.AMAZON,
                campaign_id="camp_amz_01",
                impressions=int(amz_spend * 38),
                clicks=int(amz_spend * 1.6),
                spend=amz_spend,
                conversions=int(amz_rev / 54.0),
                gross_revenue=amz_rev,
                net_revenue=amz_rev * 0.85,
                cogs_total=amz_rev * 0.21,
                contribution_margin=(amz_rev * 0.85) - (amz_rev * 0.21) - amz_spend,
                mer=round(amz_rev / amz_spend, 2),
                roas=round(amz_rev / amz_spend, 2)
            ))

        await session.commit()
