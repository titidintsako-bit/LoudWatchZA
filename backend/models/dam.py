from datetime import datetime

from pydantic import BaseModel


class Dam(BaseModel):
    id: str
    name: str
    level_percent: float
    capacity_mcm: float
    current_mcm: float
    lat: float
    lng: float
    updated_at: datetime


class DamsResponse(BaseModel):
    dams: list[Dam]
    avg_level: float
