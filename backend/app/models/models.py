from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class ChannelEnum(str, enum.Enum):
    META = "meta"
    GOOGLE = "google"
    AMAZON = "amazon"
    SHOPIFY = "shopify"
    TIKTOK = "tiktok"

class AutonomyTierEnum(str, enum.Enum):
    TIER_1_AUTO = "tier_1_auto"          # Autonomous micro-adjustment
    TIER_2_APPROVAL = "tier_2_approval"  # Moderate impact: 1-click approval
    TIER_3_ESCALATION = "tier_3_escalate"# High risk / low confidence: Mandatory sign-off

class DecisionStatusEnum(str, enum.Enum):
    PENDING_APPROVAL = "pending_approval"
    AUTO_EXECUTED = "auto_executed"
    EXECUTED = "executed"
    REJECTED = "rejected"
    ROLLED_BACK = "rolled_back"

class ActionTypeEnum(str, enum.Enum):
    SCALE_BUDGET = "scale_budget"
    REDUCE_BUDGET = "reduce_budget"
    PAUSE_AD_SET = "pause_ad_set"
    PAUSE_CREATIVE = "pause_creative"
    CROSS_CHANNEL_REALLOCATE = "cross_channel_reallocate"
    INVENTORY_PROTECT_PAUSE = "inventory_protect_pause"

class AnomalySeverityEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ProductSKU(Base):
    __tablename__ = "product_skus"

    id = Column(String, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    retail_price = Column(Float, nullable=False)
    cogs = Column(Float, nullable=False)
    shipping_cost = Column(Float, default=5.0)
    inventory_stock = Column(Integer, default=0)
    sales_velocity_7d = Column(Float, default=1.0) # units sold per day
    contribution_margin_pct = Column(Float, default=0.4) # (Price - COGS - Shipping) / Price
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def inventory_runout_days(self) -> float:
        if self.sales_velocity_7d <= 0:
            return 999.0
        return round(self.inventory_stock / self.sales_velocity_7d, 1)

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, index=True)
    channel = Column(SQLEnum(ChannelEnum), nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, PAUSED
    daily_budget = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    current_roas = Column(Float, default=2.5)
    current_cpa = Column(Float, default=35.0)
    current_spend = Column(Float, default=500.0)
    target_sku_id = Column(String, ForeignKey("product_skus.id"), nullable=True)
    last_adjusted_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    sku = relationship("ProductSKU")
    ad_sets = relationship("AdSetCreative", back_populates="campaign", cascade="all, delete-orphan")

class AdSetCreative(Base):
    __tablename__ = "ad_sets_creatives"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    name = Column(String, nullable=False)
    creative_type = Column(String, default="VIDEO") # VIDEO, IMAGE, CAROUSEL
    headline = Column(String, default="")
    ctr = Column(Float, default=1.8) # %
    cpm = Column(Float, default=24.0) # $
    frequency = Column(Float, default=1.5)
    fatigue_score = Column(Float, default=0.2) # 0 to 1
    status = Column(String, default="ACTIVE")

    campaign = relationship("Campaign", back_populates="ad_sets")

class MetricRecord(Base):
    __tablename__ = "metric_records"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    channel = Column(SQLEnum(ChannelEnum), nullable=False, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=True)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    spend = Column(Float, default=0.0)
    conversions = Column(Integer, default=0)
    gross_revenue = Column(Float, default=0.0)
    net_revenue = Column(Float, default=0.0)
    cogs_total = Column(Float, default=0.0)
    contribution_margin = Column(Float, default=0.0) # Net Rev - COGS - Shipping - Spend
    mer = Column(Float, default=0.0) # Net Rev / Spend
    roas = Column(Float, default=0.0) # Gross Rev / Spend

class CycleRunRecord(Base):
    __tablename__ = "cycle_run_records"

    id = Column(String, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="RUNNING") # RUNNING, COMPLETED, FAILED
    stages_log = Column(JSON, default=list) # List of completed lifecycle stages with timestamps
    anomalies_detected = Column(Integer, default=0)
    root_causes_evaluated = Column(Integer, default=0)
    opportunities_discovered = Column(Integer, default=0)
    decisions_generated = Column(Integer, default=0)
    tier1_auto_executed = Column(Integer, default=0)
    tier2_pending_approval = Column(Integer, default=0)
    tier3_escalated = Column(Integer, default=0)
    summary_message = Column(Text, nullable=True)

class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    channel = Column(SQLEnum(ChannelEnum), nullable=False)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=True)
    sku_id = Column(String, ForeignKey("product_skus.id"), nullable=True)
    anomaly_type = Column(String, nullable=False) # CREATIVE_FATIGUE, STOCKOUT_HAZARD, CROSS_CHANNEL_DISPARITY, MARGIN_COMPRESSION
    severity = Column(SQLEnum(AnomalySeverityEnum), default=AnomalySeverityEnum.MEDIUM)
    metric_name = Column(String, nullable=False)
    current_value = Column(Float, nullable=False)
    baseline_value = Column(Float, nullable=False)
    deviation_pct = Column(Float, default=0.0)
    z_score = Column(Float, default=0.0)
    detector_name = Column(String, default="Rolling Z-score") # "Rolling Z-score", "IQR", "CUSUM", "Policy Threshold"
    root_cause_summary = Column(Text, nullable=False)
    evidence_package = Column(JSON, nullable=True) # Structured evidence signals
    is_resolved = Column(Boolean, default=False)

    campaign = relationship("Campaign")
    sku = relationship("ProductSKU")

class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id = Column(String, primary_key=True, index=True)
    cycle_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    executed_at = Column(DateTime, nullable=True)
    tier = Column(SQLEnum(AutonomyTierEnum), nullable=False, index=True)
    status = Column(SQLEnum(DecisionStatusEnum), default=DecisionStatusEnum.PENDING_APPROVAL, index=True)
    anomaly_id = Column(String, ForeignKey("anomaly_records.id"), nullable=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    action_type = Column(SQLEnum(ActionTypeEnum), nullable=False)
    delta_budget_pct = Column(Float, default=0.0)
    delta_budget_abs = Column(Float, default=0.0)
    new_budget = Column(Float, default=0.0)
    target_channel = Column(SQLEnum(ChannelEnum), nullable=True)
    target_sku_id = Column(String, ForeignKey("product_skus.id"), nullable=True)
    alternative_sku_id = Column(String, ForeignKey("product_skus.id"), nullable=True)
    proposed_by = Column(String, default="ASCEND_AUTONOMOUS_ENGINE")
    rationale = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.90) # 0.0 - 1.0
    risk_score = Column(Float, default=0.20)       # 0.0 - 1.0
    predicted_mer_lift = Column(Float, default=0.15)  # Expected +15% MER
    predicted_roas_lift = Column(Float, default=0.20) # Expected +20% ROAS
    expected_contribution_profit = Column(Float, default=0.0) # Absolute $ / day
    guardrails_evaluated = Column(JSON, default=list) # List of checks e.g. [{"name": "budget_limit", "passed": True}]
    rollback_payload = Column(JSON, nullable=True)   # Atomic payload to undo mutation
    rejection_reason = Column(String, nullable=True)
    council_debate = Column(JSON, nullable=True)     # Multi-Agent Council deliberation transcript & votes

    anomaly = relationship("AnomalyRecord")
    campaign = relationship("Campaign")
    target_sku = relationship("ProductSKU", foreign_keys=[target_sku_id])
    alternative_sku = relationship("ProductSKU", foreign_keys=[alternative_sku_id])
    outcomes = relationship("OutcomeMeasurement", back_populates="decision", cascade="all, delete-orphan")

class OutcomeMeasurement(Base):
    __tablename__ = "outcome_measurements"

    id = Column(String, primary_key=True, index=True)
    decision_id = Column(String, ForeignKey("decision_records.id"), nullable=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)
    window_type = Column(String, default="24H") # 24H, 72H, 7D
    baseline_mer = Column(Float, default=0.0)
    post_mer = Column(Float, default=0.0)
    actual_mer_lift_pct = Column(Float, default=0.0)
    baseline_roas = Column(Float, default=0.0)
    post_roas = Column(Float, default=0.0)
    actual_roas_lift_pct = Column(Float, default=0.0)
    contribution_margin_delta = Column(Float, default=0.0)
    is_success = Column(Boolean, default=True)
    learning_notes = Column(Text, nullable=True)

    decision = relationship("DecisionRecord", back_populates="outcomes")

class PolicyConfig(Base):
    __tablename__ = "policy_configs"

    id = Column(String, primary_key=True, default="default")
    tier1_max_budget_delta_pct = Column(Float, default=10.0)
    tier1_min_confidence_score = Column(Float, default=0.85)
    tier2_max_budget_delta_pct = Column(Float, default=30.0)
    min_contribution_margin_floor = Column(Float, default=0.15)
    min_inventory_days_buffer = Column(Integer, default=5)
    cooldown_hours = Column(Integer, default=24)
    auto_rollback_drop_pct = Column(Float, default=15.0)
    global_kill_switch_active = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

class AuditLogRecord(Base):
    __tablename__ = "audit_log_records"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String, nullable=False) # "ASCEND_AUTOPILOT", "OPERATOR", "SAFETY_WATCHDOG"
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
