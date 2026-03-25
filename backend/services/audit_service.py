import logging

import redis_client

logger = logging.getLogger(__name__)

# Based on the 2022/23 AGSA (Auditor-General South Africa) municipal audit report
# Outcomes: clean audit (5), unqualified with findings (3), qualified (2), adverse/disclaimer (1)
AUDIT_DATA = [
    # Western Cape — generally strong governance
    {"name": "Cape Town", "province": "Western Cape", "outcome": "Clean audit", "score": 5, "year": 2023},
    {"name": "Overstrand", "province": "Western Cape", "outcome": "Clean audit", "score": 5, "year": 2023},
    {"name": "Swartland", "province": "Western Cape", "outcome": "Clean audit", "score": 5, "year": 2023},
    {"name": "Drakenstein", "province": "Western Cape", "outcome": "Clean audit", "score": 5, "year": 2023},
    {"name": "Stellenbosch", "province": "Western Cape", "outcome": "Clean audit", "score": 5, "year": 2023},
    {"name": "George", "province": "Western Cape", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Mossel Bay", "province": "Western Cape", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    # Gauteng
    {"name": "Johannesburg", "province": "Gauteng", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "Ekurhuleni", "province": "Gauteng", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "Tshwane", "province": "Gauteng", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Emfuleni", "province": "Gauteng", "outcome": "Adverse opinion", "score": 1, "year": 2023},
    {"name": "Midvaal", "province": "Gauteng", "outcome": "Clean audit", "score": 5, "year": 2023},
    {"name": "Lesedi", "province": "Gauteng", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    # KwaZulu-Natal
    {"name": "eThekwini", "province": "KwaZulu-Natal", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Msunduzi (Pietermaritzburg)", "province": "KwaZulu-Natal", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "Newcastle", "province": "KwaZulu-Natal", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "uMhlathuze (Richards Bay)", "province": "KwaZulu-Natal", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    # Eastern Cape
    {"name": "Buffalo City (East London)", "province": "Eastern Cape", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Nelson Mandela Bay", "province": "Eastern Cape", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "Enoch Mgijima", "province": "Eastern Cape", "outcome": "Disclaimer of opinion", "score": 1, "year": 2023},
    {"name": "Makhanda", "province": "Eastern Cape", "outcome": "Qualified", "score": 2, "year": 2023},
    # Free State
    {"name": "Mangaung", "province": "Free State", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "Maluti-a-Phofung", "province": "Free State", "outcome": "Disclaimer of opinion", "score": 1, "year": 2023},
    {"name": "Moqhaka", "province": "Free State", "outcome": "Disclaimer of opinion", "score": 1, "year": 2023},
    {"name": "Lekwa (Standerton)", "province": "Free State", "outcome": "Disclaimer of opinion", "score": 1, "year": 2023},
    # Mpumalanga
    {"name": "Emalahleni (Witbank)", "province": "Mpumalanga", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Mbombela (Nelspruit)", "province": "Mpumalanga", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Steve Tshwete (Middelburg)", "province": "Mpumalanga", "outcome": "Clean audit", "score": 5, "year": 2023},
    # Limpopo
    {"name": "Polokwane", "province": "Limpopo", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Tzaneen (Greater Tzaneen)", "province": "Limpopo", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "Thulamela (Thohoyandou)", "province": "Limpopo", "outcome": "Qualified", "score": 2, "year": 2023},
    # North West
    {"name": "Rustenburg", "province": "North West", "outcome": "Qualified", "score": 2, "year": 2023},
    {"name": "Mahikeng (Mafikeng)", "province": "North West", "outcome": "Disclaimer of opinion", "score": 1, "year": 2023},
    # Northern Cape
    {"name": "Sol Plaatje (Kimberley)", "province": "Northern Cape", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
    {"name": "Dawid Kruiper (Upington)", "province": "Northern Cape", "outcome": "Unqualified with findings", "score": 3, "year": 2023},
]


async def get_audit_outcomes() -> dict:
    cached = await redis_client.getjson("audits:outcomes")
    if cached:
        return cached

    result = {"municipalities": AUDIT_DATA}
    await redis_client.setjson("audits:outcomes", result, ex=86400)
    return result
