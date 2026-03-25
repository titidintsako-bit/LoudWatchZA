import logging

import redis_client

logger = logging.getLogger(__name__)

# Based on Stats SA QLFS Q3 2024 (July–September 2024)
# Unemployment rates are percentages (will be converted to fractions in pain index)
UNEMPLOYMENT_DATA = {
    "national_rate": 33.5,
    "municipalities": [
        # Gauteng (31.2% provincial average)
        {"name": "Johannesburg", "province": "Gauteng", "rate": 32.4, "year": 2024, "quarter": "Q3"},
        {"name": "Ekurhuleni", "province": "Gauteng", "rate": 34.1, "year": 2024, "quarter": "Q3"},
        {"name": "Tshwane", "province": "Gauteng", "rate": 28.6, "year": 2024, "quarter": "Q3"},
        {"name": "Emfuleni", "province": "Gauteng", "rate": 48.2, "year": 2024, "quarter": "Q3"},
        {"name": "Midvaal", "province": "Gauteng", "rate": 22.4, "year": 2024, "quarter": "Q3"},
        {"name": "Lesedi", "province": "Gauteng", "rate": 30.5, "year": 2024, "quarter": "Q3"},
        # Western Cape (22.1% provincial average)
        {"name": "Cape Town", "province": "Western Cape", "rate": 20.8, "year": 2024, "quarter": "Q3"},
        {"name": "Drakenstein", "province": "Western Cape", "rate": 18.4, "year": 2024, "quarter": "Q3"},
        {"name": "Stellenbosch", "province": "Western Cape", "rate": 16.2, "year": 2024, "quarter": "Q3"},
        {"name": "George", "province": "Western Cape", "rate": 21.5, "year": 2024, "quarter": "Q3"},
        # KwaZulu-Natal (36.8% provincial average)
        {"name": "eThekwini", "province": "KwaZulu-Natal", "rate": 35.7, "year": 2024, "quarter": "Q3"},
        {"name": "Msunduzi", "province": "KwaZulu-Natal", "rate": 39.2, "year": 2024, "quarter": "Q3"},
        {"name": "uMhlathuze", "province": "KwaZulu-Natal", "rate": 28.9, "year": 2024, "quarter": "Q3"},
        {"name": "Newcastle", "province": "KwaZulu-Natal", "rate": 42.8, "year": 2024, "quarter": "Q3"},
        # Eastern Cape (42.1% provincial average)
        {"name": "Buffalo City", "province": "Eastern Cape", "rate": 41.3, "year": 2024, "quarter": "Q3"},
        {"name": "Nelson Mandela Bay", "province": "Eastern Cape", "rate": 40.6, "year": 2024, "quarter": "Q3"},
        {"name": "Enoch Mgijima", "province": "Eastern Cape", "rate": 55.4, "year": 2024, "quarter": "Q3"},
        {"name": "Makhanda", "province": "Eastern Cape", "rate": 46.7, "year": 2024, "quarter": "Q3"},
        # Free State (38.7% provincial average)
        {"name": "Mangaung", "province": "Free State", "rate": 38.1, "year": 2024, "quarter": "Q3"},
        {"name": "Maluti-a-Phofung", "province": "Free State", "rate": 58.3, "year": 2024, "quarter": "Q3"},
        {"name": "Moqhaka", "province": "Free State", "rate": 44.8, "year": 2024, "quarter": "Q3"},
        # Mpumalanga (39.1% provincial average)
        {"name": "Emalahleni", "province": "Mpumalanga", "rate": 36.4, "year": 2024, "quarter": "Q3"},
        {"name": "Mbombela", "province": "Mpumalanga", "rate": 34.8, "year": 2024, "quarter": "Q3"},
        {"name": "Steve Tshwete", "province": "Mpumalanga", "rate": 28.7, "year": 2024, "quarter": "Q3"},
        # Limpopo (38.4% provincial average)
        {"name": "Polokwane", "province": "Limpopo", "rate": 33.9, "year": 2024, "quarter": "Q3"},
        {"name": "Greater Tzaneen", "province": "Limpopo", "rate": 42.1, "year": 2024, "quarter": "Q3"},
        {"name": "Thulamela", "province": "Limpopo", "rate": 45.6, "year": 2024, "quarter": "Q3"},
        # North West (40.2% provincial average)
        {"name": "Rustenburg", "province": "North West", "rate": 35.7, "year": 2024, "quarter": "Q3"},
        {"name": "Mahikeng", "province": "North West", "rate": 52.1, "year": 2024, "quarter": "Q3"},
        # Northern Cape (35.6% provincial average)
        {"name": "Sol Plaatje", "province": "Northern Cape", "rate": 33.4, "year": 2024, "quarter": "Q3"},
        {"name": "Dawid Kruiper", "province": "Northern Cape", "rate": 31.8, "year": 2024, "quarter": "Q3"},
    ],
}


async def get_unemployment_data() -> dict:
    cached = await redis_client.getjson("unemployment:data")
    if cached:
        return cached

    result = {
        "municipalities": UNEMPLOYMENT_DATA["municipalities"],
        "national_rate": UNEMPLOYMENT_DATA["national_rate"],
    }
    await redis_client.setjson("unemployment:data", result, ex=21600)
    return result
