from typing import Dict, Any, List
import numpy as np

class BudgetOptimizer:
    @staticmethod
    def calculate_optimal_allocation(
        current_budget: float,
        current_roas: float,
        target_roas: float = 2.5,
        contribution_margin_pct: float = 0.40,
        inventory_runout_days: float = 30.0
    ) -> Dict[str, Any]:
        """
        Calculates safe delta percentage and new budget considering:
        - Distance from target ROAS
        - Contribution margin health
        - Inventory constraint
        """
        # If inventory is in danger (< 5 days), force negative delta or freeze
        if inventory_runout_days < 5.0:
            cut_pct = min(50.0, max(20.0, (5.0 - inventory_runout_days) * 12.0))
            new_budget = max(50.0, current_budget * (1.0 - cut_pct / 100.0))
            return {
                "delta_pct": -round(cut_pct, 1),
                "delta_abs": -round(current_budget - new_budget, 2),
                "new_budget": round(new_budget, 2),
                "confidence": 0.95,
                "risk": 0.15,
                "strategy": "INVENTORY_PRESERVATION"
            }

        # If performing above target ROAS and healthy margins, calculate scale
        if current_roas > target_roas and contribution_margin_pct >= 0.25:
            # Scale proportionally but bounded
            raw_scale = min(25.0, (current_roas - target_roas) * 10.0)
            # Low stock (> 5 but < 14) dampens scaling
            if inventory_runout_days < 14.0:
                raw_scale = raw_scale * 0.5

            new_budget = current_budget * (1.0 + raw_scale / 100.0)
            return {
                "delta_pct": round(raw_scale, 1),
                "delta_abs": round(new_budget - current_budget, 2),
                "new_budget": round(new_budget, 2),
                "confidence": min(0.95, 0.80 + (current_roas / 10.0)),
                "risk": round(min(0.40, raw_scale / 60.0), 2),
                "strategy": "PROFITABLE_SCALING"
            }
        else:
            # Underperforming: propose trim
            cut_pct = min(35.0, max(8.0, (target_roas - current_roas) * 15.0))
            new_budget = max(50.0, current_budget * (1.0 - cut_pct / 100.0))
            return {
                "delta_pct": -round(cut_pct, 1),
                "delta_abs": -round(current_budget - new_budget, 2),
                "new_budget": round(new_budget, 2),
                "confidence": 0.88,
                "risk": 0.20,
                "strategy": "CAPITAL_EFFICIENCY_TRIM"
            }
