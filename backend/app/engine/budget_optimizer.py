from typing import Dict, Any, List, Optional
import numpy as np

class BudgetOptimizer:
    @staticmethod
    def calculate_optimal_allocation(
        current_budget: float,
        current_roas: float,
        target_roas: float = 2.5,
        contribution_margin_pct: float = 0.40,
        inventory_runout_days: float = 30.0,
        alternative_skus: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Calculates safe delta percentage, new budget, and SKU shift opportunity considering:
        - Distance from target ROAS
        - Contribution margin health & contribution profit lift
        - Inventory runout constraint
        - Alternative high-margin SKU discovery
        """
        # 1. Critical Inventory Runout Hazard (< 5 days)
        if inventory_runout_days < 5.0:
            cut_pct = min(100.0, max(50.0, (5.0 - inventory_runout_days) * 20.0))
            new_budget = max(0.0, round(current_budget * (1.0 - cut_pct / 100.0), 2))
            
            # Find best alternative SKU to redirect spend toward
            best_alt = None
            if alternative_skus:
                # Rank by (contribution_margin_pct * inventory_stock)
                healthy = [s for s in alternative_skus if s.get("inventory_runout_days", 0) > 10.0]
                if healthy:
                    best_alt = max(healthy, key=lambda s: s.get("contribution_margin_pct", 0))

            expected_profit_lift = round(abs(current_budget - new_budget) * contribution_margin_pct * 0.8, 2)

            return {
                "delta_pct": -round(cut_pct, 1),
                "delta_abs": -round(current_budget - new_budget, 2),
                "new_budget": new_budget,
                "confidence": 0.96,
                "risk": 0.12,
                "strategy": "INVENTORY_PRESERVATION",
                "alternative_sku": best_alt,
                "expected_contribution_profit": expected_profit_lift,
                "action_type": "inventory_protect_pause" if new_budget == 0 else "reduce_budget"
            }

        # 2. Margin Compression Hazard (Margin < 15%)
        if contribution_margin_pct < 0.15:
            cut_pct = 40.0
            new_budget = max(50.0, round(current_budget * (1.0 - cut_pct / 100.0), 2))
            return {
                "delta_pct": -cut_pct,
                "delta_abs": -round(current_budget - new_budget, 2),
                "new_budget": new_budget,
                "confidence": 0.92,
                "risk": 0.25,
                "strategy": "MARGIN_PROTECTION_THROTTLE",
                "alternative_sku": None,
                "expected_contribution_profit": round(current_budget * 0.15, 2),
                "action_type": "reduce_budget"
            }

        # 3. Profitable Scaling (ROAS > target and healthy margins)
        if current_roas > target_roas and contribution_margin_pct >= 0.25:
            raw_scale = min(25.0, (current_roas - target_roas) * 10.0)
            if inventory_runout_days < 14.0:
                raw_scale = raw_scale * 0.5

            new_budget = round(current_budget * (1.0 + raw_scale / 100.0), 2)
            profit_lift = round((new_budget - current_budget) * current_roas * contribution_margin_pct, 2)
            return {
                "delta_pct": round(raw_scale, 1),
                "delta_abs": round(new_budget - current_budget, 2),
                "new_budget": new_budget,
                "confidence": min(0.95, 0.82 + (current_roas / 12.0)),
                "risk": round(min(0.35, raw_scale / 60.0), 2),
                "strategy": "PROFITABLE_SCALING",
                "alternative_sku": None,
                "expected_contribution_profit": profit_lift,
                "action_type": "scale_budget"
            }

        # 4. Underperforming Capital Efficiency Trim
        cut_pct = min(35.0, max(8.0, (target_roas - current_roas) * 15.0))
        new_budget = max(50.0, round(current_budget * (1.0 - cut_pct / 100.0), 2))
        return {
            "delta_pct": -round(cut_pct, 1),
            "delta_abs": -round(current_budget - new_budget, 2),
            "new_budget": new_budget,
            "confidence": 0.88,
            "risk": 0.20,
            "strategy": "CAPITAL_EFFICIENCY_TRIM",
            "alternative_sku": None,
            "expected_contribution_profit": round(abs(current_budget - new_budget) * 0.25, 2),
            "action_type": "reduce_budget"
        }
