from datetime import datetime

from pydantic import BaseModel


class Incident(BaseModel):
    id: str
    title: str
    lat: float
    lng: float
    date: datetime
    description: str
    category: str
    municipality: str = ""


class NewsArticle(BaseModel):
    id: str
    title: str
    url: str
    source: str
    lat: float
    lng: float
    published_at: datetime
    sentiment: float = 0.0
    summary: str = ""


class CrowdsourceReport(BaseModel):
    issue_type: str
    description: str
    lat: float
    lng: float
    contact: str | None = None
    municipality: str | None = None
