from pydantic import BaseModel


class Aircraft(BaseModel):
    icao24: str
    callsign: str = ""
    lat: float
    lng: float
    altitude_m: float = 0.0
    velocity_ms: float = 0.0
    heading: float = 0.0
    aircraft_type: str = "unknown"
    registration: str = ""
    on_ground: bool = False


class Vessel(BaseModel):
    mmsi: str
    name: str = ""
    lat: float
    lng: float
    speed_kts: float = 0.0
    heading: float = 0.0
    vessel_type: str = "unknown"
    flag: str = ""
    destination: str = ""
