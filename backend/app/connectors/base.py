from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime

class AdConnector(ABC):
    @abstractmethod
    async def fetch_campaign_metrics(self, campaign_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Fetch impressions, clicks, spend, conversions, roas for campaign."""
        pass

    @abstractmethod
    async def update_budget(self, campaign_id: str, new_budget: float) -> Dict[str, Any]:
        """Mutate campaign budget via API and return mutation confirmation."""
        pass

    @abstractmethod
    async def pause_entity(self, entity_id: str, entity_type: str) -> Dict[str, Any]:
        """Pause campaign, adset, or ad creative."""
        pass

    @abstractmethod
    async def resume_entity(self, entity_id: str, entity_type: str) -> Dict[str, Any]:
        """Resume campaign, adset, or ad creative."""
        pass

class CommerceConnector(ABC):
    @abstractmethod
    async def fetch_inventory_levels(self) -> List[Dict[str, Any]]:
        """Fetch current stock, velocity, and runout days for all SKUs."""
        pass

    @abstractmethod
    async def fetch_sales_performance(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Fetch gross sales, refunds, discounts, and Net Contribution Margin."""
        pass
