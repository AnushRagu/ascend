from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "ASCEND — Autonomous Advertising Intelligence & Decision Engine"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./ascend.db")
    
    # Gemini AI
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Default Policy Guardrails
    TIER1_MAX_BUDGET_DELTA_PCT: float = 10.0  # Up to 10% auto-execution
    TIER1_MIN_CONFIDENCE_SCORE: float = 0.85  # Minimum 85% confidence for auto-execution
    TIER2_MAX_BUDGET_DELTA_PCT: float = 30.0  # 10% to 30% requires 1-click approval
    MIN_CONTRIBUTION_MARGIN_FLOOR: float = 0.15 # 15% minimum margin floor
    MIN_INVENTORY_DAYS_BUFFER: int = 5         # Pause ads if stock runout < 5 days
    COOLDOWN_HOURS: int = 24                   # Minimum hours between campaign changes
    AUTO_ROLLBACK_DROP_PCT: float = 15.0       # Auto rollback if MER/ROAS drops > 15% in 6 hours
    GLOBAL_KILL_SWITCH_ACTIVE: bool = False    # Master switch to halt all autonomous mutations

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
