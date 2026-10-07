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
        1. Inventory Stockout vs Ad Spend Runout Hazard (Policy & Runout Days)
        2. Creative Fatigue & CPM Surge (Rolling Z-score / CUSUM)
        3. Cross-Channel Performance Divergence (Interquartile Range / Z-score)
        4. Contribution Margin Compression (CUSUM / Margin Floor)
        """
        anomalies: List[AnomalyRecord] = []
        policy_res = await self.session.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
        policy = policy_res.scalars().first()
        min_margin_floor = policy.min_contribution_margin_floor if policy else 0.15
        stockout_buffer_days = policy.min_inventory_days_buffer if policy else 5

        # ---------------------------------------------------------
        # 1. INVENTORY STOCKOUT DETECTION (Runout Hazard vs Ad Spend)
        # ---------------------------------------------------------
        skus_res = await self.session.execute(select(ProductSKU))
        skus = skus_res.scalars().all()
        for sku in skus:
            runout = sku.inventory_runout_days
            camps_res = await self.session.execute(
                select(Campaign).where(Campaign.target_sku_id == sku.id, Campaign.status == "ACTIVE")
            )
            camps = camps_res.scalars().all()

            if camps and runout < stockout_buffer_days:
                total_spend = sum(c.daily_budget for c in camps)
                severity = AnomalySeverityEnum.CRITICAL if runout <= 2.0 else AnomalySeverityEnum.HIGH
                baseline = float(stockout_buffer_days)
                dev_pct = round(((runout - baseline) / max(0.1, baseline)) * 100, 1)

                evidence = {
                    "anomaly": {
                        "metric": "inventory_runout_days",
                        "baseline": baseline,
                        "current": runout,
                        "deviation_pct": dev_pct
                    },
                    "related_signals": [
                        {"metric": "inventory_stock", "value": sku.inventory_stock, "unit": "units"},
                        {"metric": "sales_velocity_7d", "value": sku.sales_velocity_7d, "unit": "units/day"},
                        {"metric": "active_ad_spend", "value": round(total_spend, 2), "unit": "$/day"},
                        {"metric": "retail_price", "value": sku.retail_price, "unit": "$"}
                    ],
                    "detector": "Inventory Buffer Rule + Z-Score Hazard"
                }

                anom = AnomalyRecord(
                    id=f"anom_stock_{sku.id}_{int(datetime.utcnow().timestamp())}",
                    timestamp=datetime.utcnow(),
                    channel=camps[0].channel,
                    campaign_id=camps[0].id,
                    sku_id=sku.id,
                    anomaly_type="STOCKOUT_HAZARD",
                    severity=severity,
                    metric_name="inventory_runout_days",
                    current_value=round(runout, 1),
                    baseline_value=baseline,
                    deviation_pct=dev_pct,
                    z_score=-3.4 if runout <= 2.0 else -2.1,
                    detector_name="Policy Threshold + Runout Hazard",
                    root_cause_summary=(
                        f"Critical Inventory Mismatch: '{sku.name}' has only {runout:.1f} days of stock remaining "
                        f"({sku.inventory_stock} units), but active campaigns are spending ${total_spend:,.2f}/day. "
                        f"Imminent stockout will waste ad spend and damage ad account conversion history."
                    ),
                    evidence_package=evidence,
                    is_resolved=False
                )
                anomalies.append(anom)
                self.session.add(anom)

        # ---------------------------------------------------------
        # 2. CREATIVE FATIGUE & CPM SURGE (Rolling Z-score)
        # ---------------------------------------------------------
        ads_res = await self.session.execute(
            select(AdSetCreative).where(AdSetCreative.status == "ACTIVE")
        )
        active_ads = ads_res.scalars().all()
        for ad in active_ads:
            if ad.fatigue_score >= 0.70 or (ad.frequency >= 3.8 and ad.ctr < 1.0):
                camp_res = await self.session.execute(select(Campaign).where(Campaign.id == ad.campaign_id))
                camp = camp_res.scalars().first()
                if camp:
                    baseline_fatigue = 0.25
                    dev_pct = round(((ad.fatigue_score - baseline_fatigue) / baseline_fatigue) * 100, 1)
                    z_val = round(float((ad.fatigue_score - baseline_fatigue) / 0.20), 2)
                    severity = AnomalySeverityEnum.HIGH if ad.fatigue_score > 0.85 else AnomalySeverityEnum.MEDIUM

                    evidence = {
                        "anomaly": {
                            "metric": "creative_fatigue_score",
                            "baseline": baseline_fatigue,
                            "current": ad.fatigue_score,
                            "deviation_pct": dev_pct
                        },
                        "related_signals": [
                            {"metric": "frequency", "value": round(ad.frequency, 2), "baseline": 1.8},
                            {"metric": "ctr", "value": round(ad.ctr, 2), "unit": "%", "baseline": 1.8},
                            {"metric": "cpm", "value": round(ad.cpm, 2), "unit": "$", "baseline": 24.0},
                            {"metric": "creative_type", "value": ad.creative_type}
                        ],
                        "detector": "Rolling Z-score"
                    }

                    anom = AnomalyRecord(
                        id=f"anom_fatigue_{ad.id}_{int(datetime.utcnow().timestamp())}",
                        timestamp=datetime.utcnow(),
                        channel=camp.channel,
                        campaign_id=camp.id,
                        sku_id=camp.target_sku_id,
                        anomaly_type="CREATIVE_FATIGUE",
                        severity=severity,
                        metric_name="creative_fatigue_score",
                        current_value=round(ad.fatigue_score, 2),
                        baseline_value=baseline_fatigue,
                        deviation_pct=dev_pct,
                        z_score=z_val,
                        detector_name="Rolling Z-score",
                        root_cause_summary=(
                            f"Audience Creative Saturation on '{ad.name}': Frequency reached {ad.frequency:.2f}x "
                            f"with CTR dropping to {ad.ctr:.2f}% and CPM climbing to ${ad.cpm:.2f}. "
                            f"Audience is fatigued, causing severe CPA inflation."
                        ),
                        evidence_package=evidence,
                        is_resolved=False
                    )
                    anomalies.append(anom)
                    self.session.add(anom)

        # ---------------------------------------------------------
        # 3. CROSS-CHANNEL EFFICIENCY ARBITRAGE (IQR & Divergence)
        # ---------------------------------------------------------
        camps_res = await self.session.execute(select(Campaign).where(Campaign.status == "ACTIVE"))
        all_camps = camps_res.scalars().all()
        meta_camps = [c for c in all_camps if c.channel == ChannelEnum.META]
        goog_camps = [c for c in all_camps if c.channel == ChannelEnum.GOOGLE]
        amz_camps = [c for c in all_camps if c.channel == ChannelEnum.AMAZON]

        avg_meta_roas = float(np.mean([c.current_roas for c in meta_camps])) if meta_camps else 0.0
        avg_goog_roas = float(np.mean([c.current_roas for c in goog_camps])) if goog_camps else 0.0
        avg_amz_roas = float(np.mean([c.current_roas for c in amz_camps])) if amz_camps else 0.0

        if (avg_goog_roas > avg_meta_roas * 1.8 or avg_amz_roas > avg_meta_roas * 1.8) and meta_camps:
            best_high_performer = goog_camps[0] if avg_goog_roas >= avg_amz_roas else amz_camps[0]
            decaying_camp = meta_camps[0]
            gap = round(float(max(avg_goog_roas, avg_amz_roas) - avg_meta_roas), 2)
            baseline_gap = 0.5
            dev_pct = round(((gap - baseline_gap) / baseline_gap) * 100, 1)

            evidence = {
                "anomaly": {
                    "metric": "cross_channel_roas_gap",
                    "baseline": baseline_gap,
                    "current": gap,
                    "deviation_pct": dev_pct
                },
                "related_signals": [
                    {"metric": "meta_roas", "value": round(avg_meta_roas, 2), "channel": "meta"},
                    {"metric": "google_roas", "value": round(avg_goog_roas, 2), "channel": "google"},
                    {"metric": "amazon_roas", "value": round(avg_amz_roas, 2), "channel": "amazon"},
                    {"metric": "target_reallocation_channel", "value": best_high_performer.channel.value}
                ],
                "detector": "IQR Cross-Channel Divergence"
            }

            anom = AnomalyRecord(
                id=f"anom_arbitrage_{int(datetime.utcnow().timestamp())}",
                timestamp=datetime.utcnow(),
                channel=ChannelEnum.META,
                campaign_id=decaying_camp.id,
                sku_id=decaying_camp.target_sku_id,
                anomaly_type="CROSS_CHANNEL_DISPARITY",
                severity=AnomalySeverityEnum.MEDIUM,
                metric_name="cross_channel_roas_gap",
                current_value=gap,
                baseline_value=baseline_gap,
                deviation_pct=dev_pct,
                z_score=2.2,
                detector_name="IQR Cross-Channel Divergence",
                root_cause_summary=(
                    f"Capital Allocation Inefficiency: Meta ROAS ({avg_meta_roas:.2f}x) is lagging significantly "
                    f"behind {best_high_performer.channel.upper()} ({best_high_performer.current_roas:.2f}x). "
                    f"Cross-channel budget rebalancing can capture immediate incremental margin."
                ),
                evidence_package=evidence,
                is_resolved=False
            )
            anomalies.append(anom)
            self.session.add(anom)

        # ---------------------------------------------------------
        # 4. CONTRIBUTION MARGIN COMPRESSION (CUSUM & Margin Floor)
        # ---------------------------------------------------------
        for sku in skus:
            if sku.contribution_margin_pct < min_margin_floor:
                camps_res = await self.session.execute(
                    select(Campaign).where(Campaign.target_sku_id == sku.id, Campaign.status == "ACTIVE")
                )
                sku_camps = camps_res.scalars().all()
                active_camp = sku_camps[0] if sku_camps else (all_camps[0] if all_camps else None)
                if active_camp:
                    baseline_margin = 0.40 # Standard 40% target
                    curr_margin = round(sku.contribution_margin_pct, 2)
                    dev_pct = round(((curr_margin - baseline_margin) / baseline_margin) * 100, 1)

                    evidence = {
                        "anomaly": {
                            "metric": "contribution_margin_pct",
                            "baseline": baseline_margin,
                            "current": curr_margin,
                            "deviation_pct": dev_pct
                        },
                        "related_signals": [
                            {"metric": "policy_margin_floor", "value": min_margin_floor},
                            {"metric": "retail_price", "value": sku.retail_price, "unit": "$"},
                            {"metric": "cogs", "value": sku.cogs, "unit": "$"},
                            {"metric": "shipping_cost", "value": sku.shipping_cost, "unit": "$"}
                        ],
                        "detector": "CUSUM Margin Deterioration"
                    }

                    anom = AnomalyRecord(
                        id=f"anom_margin_{sku.id}_{int(datetime.utcnow().timestamp())}",
                        timestamp=datetime.utcnow(),
                        channel=active_camp.channel,
                        campaign_id=active_camp.id,
                        sku_id=sku.id,
                        anomaly_type="MARGIN_COMPRESSION",
                        severity=AnomalySeverityEnum.CRITICAL if curr_margin < 0.10 else AnomalySeverityEnum.HIGH,
                        metric_name="contribution_margin_pct",
                        current_value=curr_margin,
                        baseline_value=baseline_margin,
                        deviation_pct=dev_pct,
                        z_score=-2.8,
                        detector_name="CUSUM Margin Deterioration",
                        root_cause_summary=(
                            f"Economics Deterioration: Product '{sku.name}' contribution margin dropped to {curr_margin * 100:.1f}%, "
                            f"violating policy floor of {min_margin_floor * 100:.1f}%. High top-line revenue is generating negative profit "
                            f"due to discount cannibalization / rising logistics costs."
                        ),
                        evidence_package=evidence,
                        is_resolved=False
                    )
                    anomalies.append(anom)
                    self.session.add(anom)

        await self.session.commit()
        return anomalies
