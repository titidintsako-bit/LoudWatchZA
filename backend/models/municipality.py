from pydantic import BaseModel


class Municipality(BaseModel):
    id: str
    name: str
    province: str
    lat: float
    lng: float
    audit_score: float = 2.5
    unemployment_rate: float = 35.0
    loadshedding_days: float = 15.0
    water_shortage: float = 0.5
    blue_green_fail: float = 0.5
    pain_score: float = 0.0


class AuditOutcome(BaseModel):
    name: str
    province: str
    outcome: str
    score: int
    year: int


class UnemploymentRecord(BaseModel):
    name: str
    province: str
    rate: float
    year: int
    quarter: str
