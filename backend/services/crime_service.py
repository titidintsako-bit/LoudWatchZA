import logging
from datetime import datetime, timezone

import redis_client

logger = logging.getLogger(__name__)

# Realistic crime intensity points across major SA cities and townships
# Format: (lat, lng, intensity, category)
# Intensity: 0.0-1.0 (higher = more incidents)
_RAW_CRIME_POINTS = [
    # Johannesburg Central / CBD
    (-26.2041, 28.0473, 0.95, "robbery"),
    (-26.1975, 28.0432, 0.90, "assault"),
    (-26.2080, 28.0550, 0.88, "theft"),
    (-26.2105, 28.0402, 0.85, "hijacking"),
    (-26.1950, 28.0490, 0.80, "robbery"),
    # Soweto
    (-26.2674, 27.8589, 0.82, "assault"),
    (-26.2780, 27.8650, 0.75, "murder"),
    (-26.2550, 27.8500, 0.70, "robbery"),
    (-26.2700, 27.8750, 0.65, "theft"),
    (-26.2900, 27.8400, 0.78, "hijacking"),
    # Alexandra
    (-26.1046, 28.0920, 0.88, "murder"),
    (-26.1100, 28.0850, 0.83, "assault"),
    (-26.0980, 28.0980, 0.79, "robbery"),
    # Tembisa
    (-25.9960, 28.2270, 0.72, "robbery"),
    (-26.0050, 28.2320, 0.68, "assault"),
    (-25.9880, 28.2200, 0.65, "theft"),
    # Mamelodi
    (-25.7226, 28.3989, 0.75, "assault"),
    (-25.7300, 28.4050, 0.70, "robbery"),
    (-25.7150, 28.3920, 0.68, "murder"),
    # Soshanguve
    (-25.5280, 28.0990, 0.65, "theft"),
    (-25.5350, 28.1050, 0.60, "robbery"),
    # Pretoria CBD
    (-25.7479, 28.2293, 0.70, "robbery"),
    (-25.7550, 28.2200, 0.65, "assault"),
    (-25.7400, 28.2400, 0.60, "theft"),
    # Diepsloot
    (-25.9350, 28.0130, 0.82, "murder"),
    (-25.9400, 28.0180, 0.78, "assault"),
    (-25.9280, 28.0080, 0.75, "robbery"),
    # Cape Town CBD
    (-33.9249, 18.4241, 0.72, "theft"),
    (-33.9300, 18.4180, 0.68, "robbery"),
    (-33.9180, 18.4310, 0.65, "assault"),
    # Khayelitsha
    (-34.0408, 18.6732, 0.90, "murder"),
    (-34.0480, 18.6800, 0.88, "assault"),
    (-34.0330, 28.6680, 0.85, "robbery"),
    (-34.0500, 18.6650, 0.82, "hijacking"),
    (-34.0380, 18.6900, 0.80, "theft"),
    # Mitchells Plain
    (-34.0558, 18.6230, 0.82, "gang_violence"),
    (-34.0620, 18.6300, 0.78, "murder"),
    (-34.0490, 18.6150, 0.75, "robbery"),
    # Delft
    (-33.9780, 18.6340, 0.73, "assault"),
    (-33.9840, 18.6400, 0.70, "robbery"),
    # Gugulethu
    (-33.9899, 18.5654, 0.80, "murder"),
    (-33.9950, 18.5700, 0.76, "assault"),
    # Langa
    (-33.9484, 18.5317, 0.72, "robbery"),
    (-33.9540, 18.5380, 0.68, "assault"),
    # Durban CBD
    (-29.8587, 31.0218, 0.78, "robbery"),
    (-29.8650, 31.0150, 0.74, "assault"),
    (-29.8520, 31.0280, 0.70, "theft"),
    # Umlazi
    (-29.9680, 30.8980, 0.85, "murder"),
    (-29.9750, 30.9050, 0.82, "assault"),
    (-29.9600, 30.8920, 0.78, "robbery"),
    # KwaMashu
    (-29.7480, 30.9960, 0.80, "murder"),
    (-29.7550, 30.9880, 0.76, "assault"),
    (-29.7400, 31.0040, 0.72, "robbery"),
    # Port Elizabeth / Gqeberha
    (-33.9608, 25.6022, 0.68, "robbery"),
    (-33.9680, 25.5950, 0.64, "assault"),
    (-33.9540, 25.6100, 0.60, "theft"),
    # Motherwell (PE)
    (-33.8480, 25.5980, 0.82, "murder"),
    (-33.8550, 25.6050, 0.78, "assault"),
    (-33.8410, 25.5910, 0.75, "robbery"),
    # East London / Buffalo City
    (-32.9996, 27.9060, 0.70, "robbery"),
    (-33.0060, 27.9120, 0.66, "assault"),
    (-32.9930, 27.9000, 0.62, "theft"),
    # Mdantsane (East London)
    (-32.9750, 27.7650, 0.82, "assault"),
    (-32.9820, 27.7720, 0.78, "robbery"),
    (-32.9680, 27.7580, 0.75, "murder"),
    # Bloemfontein / Mangaung
    (-29.1210, 26.2149, 0.62, "robbery"),
    (-29.1280, 26.2080, 0.58, "assault"),
    (-29.1140, 26.2220, 0.55, "theft"),
    # Botshabelo (Mangaung)
    (-29.2550, 26.7230, 0.72, "assault"),
    (-29.2620, 28.7300, 0.68, "robbery"),
    # Polokwane
    (-23.9045, 29.4689, 0.58, "theft"),
    (-23.9110, 29.4620, 0.54, "robbery"),
    (-23.8980, 29.4760, 0.50, "assault"),
    # Nelspruit / Mbombela
    (-25.4654, 30.9854, 0.60, "robbery"),
    (-25.4720, 30.9780, 0.56, "assault"),
    (-25.4590, 30.9930, 0.52, "theft"),
    # Kimberley
    (-28.7323, 24.7713, 0.62, "assault"),
    (-28.7390, 24.7640, 0.58, "robbery"),
    (-28.7260, 24.7790, 0.55, "theft"),
    # Rustenburg
    (-25.6658, 27.2424, 0.68, "robbery"),
    (-25.6720, 27.2350, 0.64, "assault"),
    (-25.6590, 27.2500, 0.60, "hijacking"),
    # Marikana
    (-25.7060, 27.4810, 0.78, "assault"),
    (-25.7130, 27.4880, 0.74, "robbery"),
    # Emalahleni / Witbank
    (-25.8735, 29.2311, 0.65, "robbery"),
    (-25.8800, 29.2240, 0.61, "assault"),
    (-25.8670, 29.2380, 0.58, "theft"),
    # Secunda
    (-26.5196, 29.1891, 0.55, "robbery"),
    (-26.5260, 29.1820, 0.51, "assault"),
    # Pietermaritzburg
    (-29.6196, 30.3928, 0.65, "robbery"),
    (-29.6260, 30.3860, 0.61, "assault"),
    (-29.6130, 30.4000, 0.58, "theft"),
    # Richards Bay
    (-28.7829, 32.0435, 0.58, "robbery"),
    (-28.7890, 32.0360, 0.54, "assault"),
    # Newcastle KZN
    (-27.7569, 29.9329, 0.60, "assault"),
    (-27.7630, 29.9260, 0.56, "robbery"),
    # Evaton / Sebokeng / Vanderbijlpark
    (-26.5260, 27.8800, 0.78, "assault"),
    (-26.5320, 27.8870, 0.74, "murder"),
    (-26.6980, 27.8320, 0.70, "robbery"),
    (-26.7050, 27.8390, 0.66, "hijacking"),
    # Sasolburg
    (-26.8148, 27.8279, 0.58, "robbery"),
    (-26.8210, 27.8210, 0.54, "assault"),
    # Emfuleni (Vereeniging)
    (-26.6732, 27.9313, 0.72, "assault"),
    (-26.6800, 27.9240, 0.68, "robbery"),
    # Middelburg (Mpumalanga)
    (-25.7710, 29.4630, 0.57, "theft"),
    (-25.7780, 29.4560, 0.53, "robbery"),
    # Upington
    (-28.4478, 21.2561, 0.48, "assault"),
    (-28.4540, 21.2490, 0.44, "robbery"),
    # George
    (-33.9608, 22.4617, 0.52, "robbery"),
    (-33.9670, 22.4550, 0.48, "theft"),
    # Kliptown
    (-26.2744, 27.8911, 0.85, "robbery"),
    (-26.2810, 27.8980, 0.82, "murder"),
    # Hammanskraal
    (-25.4560, 28.2770, 0.72, "assault"),
    (-25.4630, 28.2840, 0.68, "robbery"),
    # Thohoyandou (Limpopo)
    (-22.9480, 30.4840, 0.58, "assault"),
    (-22.9550, 30.4910, 0.54, "robbery"),
    # Ladysmith KZN
    (-28.5598, 29.7793, 0.60, "robbery"),
    (-28.5660, 29.7720, 0.56, "assault"),
    # Lephalale
    (-23.6723, 27.7083, 0.50, "theft"),
    (-23.6790, 27.7150, 0.46, "robbery"),
    # Tzaneen
    (-23.8330, 30.1580, 0.52, "assault"),
    (-23.8400, 30.1650, 0.48, "robbery"),
    # Paarl
    (-33.7340, 18.9620, 0.62, "robbery"),
    (-33.7410, 18.9690, 0.58, "assault"),
    # Stellenbosch
    (-33.9360, 18.8600, 0.45, "theft"),
    (-33.9430, 18.8670, 0.41, "robbery"),
    # Saldanha
    (-32.9980, 17.9440, 0.42, "robbery"),
    # Hermanus
    (-34.4188, 19.2352, 0.40, "theft"),
    (-34.4260, 19.2420, 0.38, "robbery"),
    # Makhanda / Grahamstown
    (-33.3075, 26.5240, 0.55, "assault"),
    (-33.3140, 26.5310, 0.51, "robbery"),
    # Bela-Bela
    (-24.8840, 28.3580, 0.50, "robbery"),
    # Musina (border area)
    (-22.3406, 30.0440, 0.65, "hijacking"),
    (-22.3480, 30.0510, 0.61, "robbery"),
    # Lebowakgomo
    (-24.1980, 29.5270, 0.53, "assault"),
    # Mokopane
    (-24.1910, 29.0080, 0.55, "robbery"),
    (-24.1980, 29.0150, 0.51, "assault"),
    # Louis Trichardt / Makhado
    (-23.0430, 29.9070, 0.52, "robbery"),
    # Thabazimbi
    (-24.5920, 27.4020, 0.48, "theft"),
    # Kuruman
    (-27.4540, 23.4330, 0.45, "robbery"),
    # Beaufort West
    (-32.3560, 22.5860, 0.43, "assault"),
    # Plettenberg Bay
    (-34.0517, 23.3682, 0.44, "theft"),
    # Humansdorp
    (-34.0320, 24.7680, 0.42, "robbery"),
    # Mossel Bay
    (-34.1827, 22.1434, 0.50, "robbery"),
    (-34.1890, 22.1500, 0.46, "assault"),
    # Swellendam
    (-34.0230, 20.4440, 0.38, "theft"),
    # Worcester
    (-33.6460, 19.4480, 0.55, "robbery"),
    (-33.6530, 19.4550, 0.51, "assault"),
    # Knysna
    (-34.0358, 23.0480, 0.40, "theft"),
    # Vredenburg
    (-32.9060, 17.9960, 0.40, "robbery"),
    # Franschhoek
    (-33.9100, 19.1210, 0.35, "theft"),
    # Langebaan
    (-33.1000, 18.0350, 0.36, "robbery"),
    # Richards Bay harbour
    (-28.7550, 32.0710, 0.55, "hijacking"),
]


async def get_crime_heatmap() -> dict:
    cached = await redis_client.getjson("crime:heatmap")
    if cached:
        return cached

    points = [
        {"lat": lat, "lng": lng, "intensity": intensity, "category": category}
        for lat, lng, intensity, category in _RAW_CRIME_POINTS
    ]

    result = {
        "points": points,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await redis_client.setjson("crime:heatmap", result, ex=86400)
    return result
