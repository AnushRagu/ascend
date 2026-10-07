from typing import Dict, Any, Optional
from datetime import datetime
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import (
    Campaign, AdSetCreative, DecisionRecord, PolicyConfig, AuditLogRecord,
    DecisionStatusEnum, ActionTypeEnum, ChannelEnum, AutonomyTierEnum
)
from app.connectors.meta import MetaAdsConnector
from app.connectors.google import GoogleAdsConnector
from app.connectors.amazon import AmazonAdsConnector

logger = logging.getLogger(__name__)

class ExecutionDispatcher:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.meta_connector = MetaAdsConnector()
        self.google_connector = GoogleAdsConnector()
        self.amazon_connector = AmazonAdsConnector()

    def _get_connector(self, channel: ChannelEnum):
        if channel == ChannelEnum.META:
            return self.meta_connector
        elif channel == ChannelEnum.GOOGLE:
            return self.google_connector
        elif channel == ChannelEnum.AMAZON:
            return self.amazon_connector
        return self.meta_connector

    async def execute_decision(self, decision_id: str, actor: str = "ASCEND_AUTOPILOT") -> Dict[str, Any]:
        """
        Executes an approved or Tier-1 autonomous decision:
        1. Checks Global Kill Switch
        2. Captures atomic reverse payload for instant reversibility
        3. Calls Ad Platform API adapter
        4. Mutates database campaign state
        5. Logs full audit trail
        """
        # 1. Fetch decision and policy
        dec_res = await self.session.execute(select(DecisionRecord).where(DecisionRecord.id == decision_id))
        decision = dec_res.scalars().first()
        if not decision:
            raise ValueError(f"Decision {decision_id} not found")

        policy_res = await self.session.execute(select(PolicyConfig).where(PolicyConfig.id == "default"))
        policy = policy_res.scalars().first()

        if policy and policy.global_kill_switch_active:
            raise RuntimeError("Global Kill Switch is active. All ad platform mutations are halted.")

        # 2. Fetch target campaign
        camp_res = await self.session.execute(select(Campaign).where(Campaign.id == decision.campaign_id))
        campaign = camp_res.scalars().first()
        if not campaign:
            raise ValueError(f"Campaign {decision.campaign_id} not found")

        # 3. Build atomic rollback payload for complete reversibility
        rollback_payload = {
            "campaign_id": campaign.id,
            "previous_budget": campaign.daily_budget,
            "previous_status": campaign.status,
            "action_type": decision.action_type.value,
            "delta_applied_pct": decision.delta_budget_pct,
            "snapshot_timestamp": datetime.utcnow().isoformat()
        }
        decision.rollback_payload = rollback_payload

        connector = self._get_connector(campaign.channel)
        api_result = {}

        # 4. Dispatch mutation
        if decision.action_type in [ActionTypeEnum.SCALE_BUDGET, ActionTypeEnum.REDUCE_BUDGET, ActionTypeEnum.CROSS_CHANNEL_REALLOCATE]:
            api_result = await connector.update_budget(campaign.id, decision.new_budget)
            campaign.daily_budget = decision.new_budget
            campaign.last_adjusted_at = datetime.utcnow()

        elif decision.action_type == ActionTypeEnum.INVENTORY_PROTECT_PAUSE:
            api_result = await connector.pause_entity(campaign.id, "CAMPAIGN")
            campaign.status = "PAUSED"
            campaign.last_adjusted_at = datetime.utcnow()

        elif decision.action_type == ActionTypeEnum.PAUSE_CREATIVE:
            # Pause high-fatigue ad creatives
            ads_res = await self.session.execute(
                select(AdSetCreative).where(AdSetCreative.campaign_id == campaign.id, AdSetCreative.fatigue_score >= 0.7)
            )
            fatigued_ads = ads_res.scalars().all()
            for ad in fatigued_ads:
                await connector.pause_entity(ad.id, "AD_SET")
                ad.status = "PAUSED"
            api_result = {"status": "PAUSED_FATIGUED_CREATIVES", "count": len(fatigued_ads)}
            campaign.last_adjusted_at = datetime.utcnow()

        # 5. Update decision status
        decision.executed_at = datetime.utcnow()
        if actor == "ASCEND_AUTOPILOT" and decision.tier == AutonomyTierEnum.TIER_1_AUTO:
            decision.status = DecisionStatusEnum.AUTO_EXECUTED
        else:
            decision.status = DecisionStatusEnum.EXECUTED

        # 6. Audit Trail Logging
        audit_log = AuditLogRecord(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            actor=actor,
            action=f"EXECUTE_{decision.action_type.value.upper()}",
            entity_type="CAMPAIGN",
            entity_id=campaign.id,
            details={
                "decision_id": decision.id,
                "tier": decision.tier.value,
                "new_budget": campaign.daily_budget,
                "api_result": api_result,
                "rollback_available": True
            },
            notes=decision.rationale
        )
        self.session.add(audit_log)
        await self.session.commit()

        logger.info(f"Decision {decision.id} successfully executed by {actor}.")
        return {
            "success": True,
            "decision_id": decision.id,
            "status": decision.status.value,
            "actor": actor,
            "campaign_id": campaign.id,
            "new_daily_budget": campaign.daily_budget,
            "campaign_status": campaign.status,
            "api_result": api_result
        }

    async def rollback_decision(self, decision_id: str, actor: str = "OPERATOR_USER", reason: str = "Manual operator rollback") -> Dict[str, Any]:
        """
        Reverses an executed mutation atomically using the saved rollback payload.
        """
        dec_res = await self.session.execute(select(DecisionRecord).where(DecisionRecord.id == decision_id))
        decision = dec_res.scalars().first()
        if not decision:
            raise ValueError(f"Decision {decision_id} not found")

        if not decision.rollback_payload:
            raise ValueError(f"No rollback payload available for decision {decision_id}")

        camp_res = await self.session.execute(select(Campaign).where(Campaign.id == decision.campaign_id))
        campaign = camp_res.scalars().first()
        if not campaign:
            raise ValueError(f"Campaign {decision.campaign_id} not found")

        payload = decision.rollback_payload
        connector = self._get_connector(campaign.channel)

        # Restore previous budget
        prev_budget = payload.get("previous_budget")
        if prev_budget is not None and prev_budget > 0:
            await connector.update_budget(campaign.id, prev_budget)
            campaign.daily_budget = prev_budget

        # Restore previous status
        prev_status = payload.get("previous_status", "ACTIVE")
        if prev_status == "ACTIVE" and campaign.status == "PAUSED":
            await connector.resume_entity(campaign.id, "CAMPAIGN")
            campaign.status = "ACTIVE"

        decision.status = DecisionStatusEnum.ROLLED_BACK
        decision.rejection_reason = f"Rolled back by {actor}: {reason}"

        # Audit rollback
        audit_log = AuditLogRecord(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            actor=actor,
            action="ROLLBACK_DECISION",
            entity_type="CAMPAIGN",
            entity_id=campaign.id,
            details={"decision_id": decision.id, "restored_payload": payload, "reason": reason},
            notes=f"Atomic rollback performed. Restored budget to ${campaign.daily_budget:.2f} and status to {campaign.status}."
        )
        self.session.add(audit_log)
        await self.session.commit()

        logger.info(f"Decision {decision.id} rolled back by {actor}.")
        return {
            "success": True,
            "decision_id": decision.id,
            "status": "ROLLED_BACK",
            "campaign_id": campaign.id,
            "restored_budget": campaign.daily_budget,
            "restored_status": campaign.status
        }
