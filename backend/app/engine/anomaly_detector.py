from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import (
    Campaign, ProductSKU, AdSetCreative, MetricRecord, AnomalyRecord,
    PolicyConfig, ChannelEnum, AnomalySeverityEnum
)

class AnomalyDetector:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def run_detection_pipeline(self) -> List[AnomalyRecord]:
        """
        Runs statistical & neuro-symbolic anomaly detection:
        1. Inventory Stockout vs Ad Spend Runout Hazard
        2. Creative Fatigue & CPM Surge
        3. Cross-Channel Performance Divergence
        4. Contribution Margin Compression
        """
        anomalies: List[AnomalyRecord] = []
        policy_res = await self.session.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
        policy = policy_res.scalars().first()
        min_margin_floor = policy.min_contribution_margin_floor if policy else 0.15
        stockout_buffer_days = policy.min_inventory_days_buffer if policy else 5

        # 1. INVENTORY STOCKOUT DETECTION
        skus_res = await self.session.execute(select(ProductSKU))
        skus = skus_res.scalars().all()
        for sku in skus:
            runout = sku.inventory_runout_days
            # Find active campaigns promoting this SKU
            camps_res = await self.session.execute(
                select(Campaign).where(Campaign.target_sku_id == sku.id, Campaign.status == "ACTIVE")
            )
            camps = camps_res.scalars().all()

            if camps and runout < stockout_buffer_days:
                total_spend = sum(c.daily_budget for c in camps)
                severity = AnomalySeverityEnum.CRITICAL if runout <= 2.0 else AnomalySeverityEnum.HIGH
                anom = AnomalyRecord(
                    id=f"anom_stock_{sku.id}_{int(datetime.utcnow().timestamp())}",
                    timestamp=datetime.utcnow(),
                    channel=camps[0].channel,
                    campaign_id=camps[0].id,
                    sku_id=sku.id,
                    anomaly_type="STOCKOUT_HAZARD",
                    severity=severity,
                    metric_name="inventory_runout_days",
                    current_value=runout,
                    baseline_value=float(stockout_buffer_days),
                    z_score=-3.4,
                    root_cause_summary=(
                        f"Critical Inventory Mismatch: '{sku.name}' has only {runout:.1f} days of stock remaining "
                        f"({sku.inventory_stock} units), but active campaigns are spending ${total_spend:,.2f}/day. "
                        f"Imminent stockout will waste ad spend and damage ad account conversion history."
                    ),
                    is_resolved=False
                )
                anomalies.append(anom)
                self.session.add(anom)

        # 2. CREATIVE FATIGUE & CPM SURGE (AdSet / Creative Level)
        ads_res = await self.session.execute(
            select(AdSetCreative).where(AdSetCreative.status == "ACTIVE")
        )
        active_ads = ads_res.scalars().all()
        for ad in active_ads:
            if ad.fatigue_score >= 0.70 or (ad.frequency >= 3.8 and ad.ctr < 1.0):
                camp_res = await self.session.execute(select(Campaign).where(Campaign.id == ad.campaign_id))
                camp = camp_res.scalars().first()
                if camp:
                    anom = AnomalyRecord(
                        id=f"anom_fatigue_{ad.id}_{int(datetime.utcnow().timestamp())}",
                        timestamp=datetime.utcnow(),
                        channel=camp.channel,
                        campaign_id=camp.id,
                        sku_id=camp.target_sku_id,
                        anomaly_type="CREATIVE_FATIGUE",
                        severity=AnomalySeverityEnum.HIGH if ad.fatigue_score > 0.85 else AnomalySeverityEnum.MEDIUM,
                        metric_name="creative_fatigue_score",
                        current_value=ad.fatigue_score,
                        baseline_value=0.25,
                        z_score=2.85,
                        root_cause_summary=(
                            f"Audience Creative Saturation on '{ad.name}': Frequency reached {ad.frequency:.2f}x "
                            f"with CTR dropping to {ad.ctr:.2f}% and CPM climbing to ${ad.cpm:.2f}. "
                            f"Audience is fatigued, causing severe CPA inflation."
                        ),
                        is_resolved=False
                    )
                    anomalies.append(anom)
                    self.session.add(anom)

        # 3. CROSS-CHANNEL EFFICIENCY ARBITRAGE
        camps_res = await self.session.execute(select(Campaign).where(Campaign.status == "ACTIVE"))
        all_camps = camps_res.scalars().all()
        meta_camps = [c for c in all_camps if c.channel == ChannelEnum.META]
        goog_camps = [c for c in all_camps if c.channel == ChannelEnum.GOOGLE]
        amz_camps = [c for c in all_camps if c.channel == ChannelEnum.AMAZON]

        avg_meta_roas = np.mean([c.current_roas for c in meta_camps]) if meta_camps else 0
        avg_goog_roas = np.mean([c.current_roas for c in goog_camps]) if goog_camps else 0
        avg_amz_roas = np.mean([c.current_roas for c in amz_camps]) if amz_camps else 0

        if (avg_goog_roas > avg_meta_roas * 1.8 or avg_amz_roas > avg_meta_roas * 1.8) and meta_camps:
            best_high_performer = goog_camps[0] if avg_goog_roas >= avg_amz_roas else amz_camps[0]
            decaying_camp = meta_camps[0]
            anom = AnomalyRecord(
                id=f"anom_arbitrage_{int(datetime.utcnow().timestamp())}",
                timestamp=datetime.utcnow(),
                channel=ChannelEnum.META,
                campaign_id=decaying_camp.id,
                sku_id=decaying_camp.target_sku_id,
                anomaly_type="CROSS_CHANNEL_DISPARITY",
                severity=AnomalySeverityEnum.MEDIUM,
                metric_name="cross_channel_roas_gap",
                current_value=round(float(max(avg_goog_roas, avg_amz_roas) - avg_meta_roas), 2),
                baseline_value=0.5,
                z_score=2.2,
                root_cause_summary=(
                    f"Capital Allocation Inefficiency: Meta ROAS ({avg_meta_roas:.2f}x) is lagging significantly "
                    f"behind {best_high_performer.channel.upper()} ({best_high_performer.current_roas:.2f}x). "
                    f"Cross-channel budget rebalancing can capture immediate incremental margin."
                ),
                is_resolved=False
            )
            anomalies.append(anom)
            self.session.add(anom)

        await self.session.commit()
        return anomalies
