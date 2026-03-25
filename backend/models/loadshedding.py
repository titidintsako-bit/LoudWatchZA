from datetime import datetime

from pydantic import BaseModel


class DaySchedule(BaseModel):
    date: str
    slots: list[str]


class LoadsheddingStage(BaseModel):
    stage: int
    updated_at: datetime
    areas_affected: int


class AreaSchedule(BaseModel):
    area_id: str
    area_name: str
    stage: int
    schedule: list[DaySchedule]
