from pydantic import BaseModel, Field
from typing import Dict, Optional, Literal

class ScoreIn(BaseModel):
    userId: str
    features: Dict[str, float | int | str] = Field(default_factory=dict)

class ScoreOut(BaseModel):
    risk: float
    tier: Literal["low","med","high"]
    reasons: list[str]
    modelVersion: str

class HealthOut(BaseModel):
    ok: bool
    modelVersion: str