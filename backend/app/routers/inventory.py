from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.database import get_db
from app.models.models import ProductSKU, Campaign, AuditLogRecord

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

class UpdateStockPayload(BaseModel):
    stock_delta: Optional[int] = None
    new_stock: Optional[int] = None
    reason: Optional[str] = "Manual warehouse restock"

class UpdateVelocityPayload(BaseModel):
    sales_velocity_7d: float

class CreateSKUPayload(BaseModel):
    sku: str
    name: str
    retail_price: float
    cogs: float
    shipping_cost: float = 5.0
    inventory_stock: int = 100
    sales_velocity_7d: float = 5.0

@router.get("")
async def get_all_inventory(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns comprehensive real-time SKU stock details, runout hazards, economics, and linked campaigns."""
    res = await db.execute(
        select(ProductSKU).where(ProductSKU.is_deleted != True).order_by(ProductSKU.sku.asc())
    )
    skus = res.scalars().all()

    camps_res = await db.execute(select(Campaign))
    all_campaigns = camps_res.scalars().all()

    items = []
    total_units = 0
    total_inventory_value = 0.0
    critical_stockouts = 0
    warning_stockouts = 0

    for s in skus:
        total_units += s.inventory_stock
        stock_value = round(s.inventory_stock * s.retail_price, 2)
        total_inventory_value += stock_value

        linked_camps = [
            {
                "id": c.id,
                "name": c.name,
                "channel": c.channel.value,
                "daily_budget": c.daily_budget,
                "status": c.status,
                "roas": c.current_roas
            }
            for c in all_campaigns if c.target_sku_id == s.id
        ]
        active_spend = sum(c["daily_budget"] for c in linked_camps if c["status"] == "ACTIVE")

        runout = s.inventory_runout_days
        status = "HEALTHY"
        if runout <= 2.0:
            status = "CRITICAL"
            critical_stockouts += 1
        elif runout <= 5.0:
            status = "WARNING"
            warning_stockouts += 1

        items.append({
            "id": s.id,
            "sku": s.sku,
            "name": s.name,
            "retail_price": s.retail_price,
            "cogs": s.cogs,
            "shipping_cost": s.shipping_cost,
            "inventory_stock": s.inventory_stock,
            "sales_velocity_7d": s.sales_velocity_7d,
            "runout_days": runout,
            "contribution_margin_pct": round(s.contribution_margin_pct * 100, 1),
            "unit_profit": round(s.retail_price - s.cogs - s.shipping_cost, 2),
            "total_value": stock_value,
            "status": status,
            "active_daily_ad_spend": round(active_spend, 2),
            "linked_campaigns_count": len(linked_camps),
            "linked_campaigns": linked_camps
        })

    return {
        "summary": {
            "total_skus": len(items),
            "total_units_in_stock": total_units,
            "total_inventory_value": round(total_inventory_value, 2),
            "critical_stockout_count": critical_stockouts,
            "warning_stockout_count": warning_stockouts,
            "healthy_count": len(items) - critical_stockouts - warning_stockouts
        },
        "inventory": items
    }

@router.get("/{sku_id}")
async def get_sku_detail(sku_id: str, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Get single SKU details."""
    res = await db.execute(select(ProductSKU).where(ProductSKU.id == sku_id))
    s = res.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="SKU not found")

    camps_res = await db.execute(select(Campaign).where(Campaign.target_sku_id == s.id))
    linked_camps = camps_res.scalars().all()

    return {
        "id": s.id,
        "sku": s.sku,
        "name": s.name,
        "retail_price": s.retail_price,
        "cogs": s.cogs,
        "shipping_cost": s.shipping_cost,
        "inventory_stock": s.inventory_stock,
        "sales_velocity_7d": s.sales_velocity_7d,
        "runout_days": s.inventory_runout_days,
        "contribution_margin_pct": round(s.contribution_margin_pct * 100, 1),
        "linked_campaigns": [
            {"id": c.id, "name": c.name, "channel": c.channel.value, "budget": c.daily_budget, "status": c.status}
            for c in linked_camps
        ]
    }

@router.post("/{sku_id}/adjust-stock")
async def adjust_sku_stock(sku_id: str, payload: UpdateStockPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Adjusts SKU stock count (e.g. warehouse replenishment or write-off)."""
    res = await db.execute(select(ProductSKU).where(ProductSKU.id == sku_id))
    sku = res.scalars().first()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")

    old_stock = sku.inventory_stock
    if payload.new_stock is not None:
        sku.inventory_stock = max(0, payload.new_stock)
    elif payload.stock_delta is not None:
        sku.inventory_stock = max(0, sku.inventory_stock + payload.stock_delta)
    else:
        raise HTTPException(status_code=400, detail="Either new_stock or stock_delta must be provided")

    audit = AuditLogRecord(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        actor="OPERATOR_WAREHOUSE",
        action="ADJUST_INVENTORY_STOCK",
        entity_type="PRODUCT_SKU",
        entity_id=sku.id,
        details={
            "sku": sku.sku,
            "old_stock": old_stock,
            "new_stock": sku.inventory_stock,
            "delta": sku.inventory_stock - old_stock,
            "reason": payload.reason
        },
        notes=f"Stock adjusted from {old_stock} to {sku.inventory_stock} ({payload.reason})."
    )
    db.add(audit)
    await db.commit()

    return {
        "success": True,
        "sku_id": sku.id,
        "sku": sku.sku,
        "previous_stock": old_stock,
        "new_stock": sku.inventory_stock,
        "new_runout_days": sku.inventory_runout_days,
        "message": f"Stock updated to {sku.inventory_stock} units."
    }

@router.post("/{sku_id}/adjust-velocity")
async def adjust_sku_velocity(sku_id: str, payload: UpdateVelocityPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Adjusts 7-day sales velocity for burn rate simulations."""
    res = await db.execute(select(ProductSKU).where(ProductSKU.id == sku_id))
    sku = res.scalars().first()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")

    sku.sales_velocity_7d = max(0.1, payload.sales_velocity_7d)
    await db.commit()
    return {
        "success": True,
        "sku_id": sku.id,
        "sku": sku.sku,
        "sales_velocity_7d": sku.sales_velocity_7d,
        "new_runout_days": sku.inventory_runout_days
    }

@router.post("")
async def create_new_sku(payload: CreateSKUPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Adds a new stock item/product SKU to inventory with automatic contribution margin calculation."""
    clean_sku = payload.sku.strip().upper()
    if not clean_sku:
        raise HTTPException(status_code=400, detail="SKU code is required")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    if payload.retail_price <= 0:
        raise HTTPException(status_code=400, detail="Retail price must be greater than 0")
    if payload.cogs < 0:
        raise HTTPException(status_code=400, detail="COGS cannot be negative")

    # Check if SKU code already exists; if so, update stock & economics gracefully
    existing_res = await db.execute(select(ProductSKU).where(ProductSKU.sku == clean_sku))
    existing_item = existing_res.scalars().first()

    # Calculate contribution margin percentage: (Price - COGS - Shipping) / Price
    margin_pct = (payload.retail_price - payload.cogs - payload.shipping_cost) / payload.retail_price
    margin_pct = max(0.0, min(1.0, margin_pct))

    if existing_item:
        old_stock = existing_item.inventory_stock
        existing_item.name = payload.name.strip()
        existing_item.retail_price = round(payload.retail_price, 2)
        existing_item.cogs = round(payload.cogs, 2)
        existing_item.shipping_cost = round(payload.shipping_cost, 2)
        existing_item.inventory_stock = max(0, payload.inventory_stock)
        existing_item.sales_velocity_7d = max(0.1, payload.sales_velocity_7d)
        existing_item.contribution_margin_pct = round(margin_pct, 4)

        audit = AuditLogRecord(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            actor="OPERATOR_WAREHOUSE",
            action="UPDATE_INVENTORY_SKU",
            entity_type="PRODUCT_SKU",
            entity_id=existing_item.id,
            details={
                "sku": existing_item.sku,
                "name": existing_item.name,
                "old_stock": old_stock,
                "new_stock": existing_item.inventory_stock,
                "price": existing_item.retail_price,
                "margin_pct": existing_item.contribution_margin_pct
            },
            notes=f"Updated inventory for existing SKU '{existing_item.sku}' to {existing_item.inventory_stock} units."
        )
        db.add(audit)
        await db.commit()

        return {
            "success": True,
            "sku": {
                "id": existing_item.id,
                "sku": existing_item.sku,
                "name": existing_item.name,
                "retail_price": existing_item.retail_price,
                "cogs": existing_item.cogs,
                "shipping_cost": existing_item.shipping_cost,
                "inventory_stock": existing_item.inventory_stock,
                "sales_velocity_7d": existing_item.sales_velocity_7d,
                "runout_days": existing_item.inventory_runout_days,
                "contribution_margin_pct": round(existing_item.contribution_margin_pct * 100, 1)
            },
            "message": f"Updated existing stock for {existing_item.sku} to {existing_item.inventory_stock} units!"
        }

    new_item = ProductSKU(
        id=f"sku_{clean_sku.lower().replace('-', '_').replace(' ', '_')}_{str(uuid.uuid4())[:6]}",
        sku=clean_sku,
        name=payload.name.strip(),
        retail_price=round(payload.retail_price, 2),
        cogs=round(payload.cogs, 2),
        shipping_cost=round(payload.shipping_cost, 2),
        inventory_stock=max(0, payload.inventory_stock),
        sales_velocity_7d=max(0.1, payload.sales_velocity_7d),
        contribution_margin_pct=round(margin_pct, 4),
        created_at=datetime.utcnow()
    )
    db.add(new_item)

    audit = AuditLogRecord(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        actor="OPERATOR_WAREHOUSE",
        action="CREATE_INVENTORY_SKU",
        entity_type="PRODUCT_SKU",
        entity_id=new_item.id,
        details={
            "sku": new_item.sku,
            "name": new_item.name,
            "stock": new_item.inventory_stock,
            "price": new_item.retail_price,
            "cogs": new_item.cogs,
            "margin_pct": new_item.contribution_margin_pct
        },
        notes=f"Created new inventory product SKU '{new_item.sku}' ({new_item.name}) with {new_item.inventory_stock} units."
    )
    db.add(audit)
    await db.commit()

    return {
        "success": True,
        "sku": {
            "id": new_item.id,
            "sku": new_item.sku,
            "name": new_item.name,
            "retail_price": new_item.retail_price,
            "cogs": new_item.cogs,
            "shipping_cost": new_item.shipping_cost,
            "inventory_stock": new_item.inventory_stock,
            "sales_velocity_7d": new_item.sales_velocity_7d,
            "runout_days": new_item.inventory_runout_days,
            "contribution_margin_pct": round(new_item.contribution_margin_pct * 100, 1)
        },
        "message": f"Successfully added {new_item.sku} to inventory!"
    }

@router.delete("/{sku_id}")
async def delete_sku(sku_id: str, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Permanently deletes a SKU from warehouse inventory and disassociates linked campaigns/records."""
    res = await db.execute(select(ProductSKU).where((ProductSKU.id == sku_id) | (ProductSKU.sku == sku_id.upper())))
    sku = res.scalars().first()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU item not found in inventory")

    sku_code = sku.sku
    sku_name = sku.name

    # Disassociate linked campaigns to maintain relational integrity
    camps_res = await db.execute(select(Campaign).where(Campaign.target_sku_id == sku.id))
    for camp in camps_res.scalars().all():
        camp.target_sku_id = None

    # Audit log entry for deletion
    audit = AuditLogRecord(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        actor="OPERATOR_WAREHOUSE",
        action="DELETE_INVENTORY_SKU",
        entity_type="PRODUCT_SKU",
        entity_id=sku.id,
        details={"sku": sku_code, "name": sku_name},
        notes=f"Permanently deleted product SKU '{sku_code}' ({sku_name}) from inventory."
    )
    db.add(audit)

    # Mark as permanently deleted and disassociate campaigns
    sku.is_deleted = True
    sku.inventory_stock = 0

    await db.commit()

    return {
        "success": True,
        "deleted_sku_id": sku_id,
        "sku": sku_code,
        "message": f"Product SKU '{sku_code}' has been removed from inventory."
    }

