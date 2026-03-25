export type Language = 'en' | 'zu' | 'af' | 'xh' | 'st'

export const LANGUAGES: Array<{ code: Language; label: string; name: string }> = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zu', label: 'ZU', name: 'isiZulu' },
  { code: 'af', label: 'AF', name: 'Afrikaans' },
  { code: 'xh', label: 'XH', name: 'isiXhosa' },
  { code: 'st', label: 'ST', name: 'Sesotho' },
]

type Translations = Record<string, Record<Language, string>>

export const T: Translations = {
  // TopBar
  'live': { en: 'LIVE', zu: 'PHILA', af: 'LEEF', xh: 'PHILA', st: 'PHELA' },
  'search': { en: 'SEARCH', zu: 'SESHA', af: 'SOEK', xh: 'KHANGELA', st: 'BATLA' },
  'settings': { en: 'SETTINGS', zu: 'IZILUNGISELELO', af: 'INSTELLINGS', xh: 'IZICWANGCISO', st: 'DITLHOPHISO' },

  // Loadshedding
  'no_loadshedding': { en: 'NO LOADSHEDDING', zu: 'AKUKHO UKUSHESHA', af: 'GEEN BEURTKRAG', xh: 'AKUKHO LOADSHEDDING', st: 'HA HO LOADSHEDDING' },
  'stage': { en: 'STAGE', zu: 'ISIGABA', af: 'STADIUM', xh: 'ISIGABA', st: 'SEKHAHLA' },
  'critical': { en: 'CRITICAL', zu: 'INGOZI', af: 'KRITIEK', xh: 'INGOZI', st: 'BOTHATA' },
  'severe': { en: 'SEVERE', zu: 'OKUKHULU', af: 'ERNSTIG', xh: 'OQATHA', st: 'MATLA' },

  // Panel titles
  'intel_brief': { en: 'SA INTEL BRIEF', zu: 'ULWAZI LWE-SA', af: 'SA INTEL BRIEF', xh: 'INGXELO YE-SA', st: 'TLHAHISOLESEDING YA SA' },
  'intel_feed': { en: 'SA INTEL FEED', zu: 'IZINDABA ZE-SA', af: 'SA NUUSVOER', xh: 'IINDABA ZE-SA', st: 'DIKGANG TSA SA' },
  'protest_monitor': { en: 'PROTEST MONITOR', zu: 'UKULANDELA IZIMANGALO', af: 'PROTESMONITOR', xh: 'UKULANDELA IZIKHALAZO', st: 'TLHAHLOBO YA DIPHETOGO' },
  'most_wanted': { en: 'MOST WANTED', zu: 'OFUNWA KAKHULU', af: 'MEES GESOGTE', xh: 'OFUNWAYO KAKHULU', st: 'O BATLWANG HAHOLO' },
  'market_data': { en: 'SA MARKETS', zu: 'IMAKETHE YE-SA', af: 'SA MARKTE', xh: 'IMARIKE YE-SA', st: 'DIMARAKA TSA SA' },
  'dam_levels': { en: 'DAM LEVELS', zu: 'AMAZINGA EDAMU', af: 'DAMVLAKKE', xh: 'AMAZINGA EDAM', st: 'MAEMO A MATAMO' },
  'sassa': { en: 'SASSA PAYMENTS', zu: 'IZINKOKHELO ZASASSA', af: 'SASSA BETALINGS', xh: 'IINTLAWULO ZASASSA', st: 'DITEFISO TSA SASSA' },
  'good_news': { en: 'GOOD NEWS', zu: 'IZINDABA EZINHLE', af: 'GOEIE NUUS', xh: 'IINDABA EZILUNGILEYO', st: 'DITABA TSE NTLENTLE' },
  'court_judgments': { en: 'COURT JUDGMENTS', zu: 'IZINQUMO ZENKANTOLO', af: 'HOFUITSPRAKE', xh: 'IZIGWEBO ZENKUNDLA', st: 'DIQETO TSA KGOTLA' },
  'state_capture': { en: 'STATE CAPTURE', zu: 'UKUTHATHWA KOMBUSO', af: 'STAATSGREEP', xh: 'UKUTHATHWA KOMBUZO', st: 'TSHENYETSO YA MMUSO' },
  'hawks': { en: 'HAWKS ARRESTS', zu: 'UKUBOSHWA AMAHAWKS', af: 'HAWKS ARRESTASIES', xh: 'UKUBANJIWA KWAMAHAWKS', st: 'THIBELO TSA HAWKS' },
  'global_relations': { en: 'GLOBAL RELATIONS', zu: 'UBUHLOBO BOMHLABA', af: 'GLOBALE BETREKKINGE', xh: 'UBUDLELWANE BEHLABATHI', st: 'DIKAMANO TSA LEFATŠE' },
  'border_migration': { en: 'BORDER & MIGRATION', zu: 'IMINGCELE NOKUPHUMA', af: 'GRENS & MIGRASIE', xh: 'UMDA NOFUDUKO', st: 'MOLAO WA MELELWANE' },

  // Product modes
  'overview': { en: 'OVERVIEW', zu: 'ISIFINYEZO', af: 'OORSIG', xh: 'ISISHWANKATHELO', st: 'KAKARETSO' },
  'governance': { en: 'GOVERNANCE', zu: 'UKUPHATHA', af: 'BESTUUR', xh: 'ULAWULO', st: 'PUSO' },
  'economy': { en: 'ECONOMY', zu: 'UMNOTHO', af: 'EKONOMIE', xh: 'UQOQOSHO', st: 'MORUO' },
  'safety': { en: 'SAFETY', zu: 'UKUPHEPHA', af: 'VEILIGHEID', xh: 'UKHUSELEKO', st: 'TSHIRELETSO' },
  'environment': { en: 'ENVIRONMENT', zu: 'IMVELO', af: 'OMGEWING', xh: 'IMVELO', st: 'TIKOLOHO' },
  'judiciary': { en: 'JUDICIARY', zu: 'UBULUNGISWA', af: 'REGBANK', xh: 'UBULUNGISA', st: 'TOKA' },

  // Alerts
  'alert_stage_high': {
    en: 'Critical loadshedding. Conserve power.',
    zu: 'Ukusheda kwamagesi okushesha. Gcina ugesi.',
    af: 'Kritiese beurtkrag. Bespaar krag.',
    xh: 'Ukuxhomekeka kwemali. Gcina amandla.',
    st: 'Loadshedding e matla. Boloka motlakase.',
  },

  // Data disclaimer
  'disclaimer_short': {
    en: 'Public data. Not guaranteed.',
    zu: 'Ulwazi lomphakathi. Akuqinisekisiwe.',
    af: 'Openbare data. Nie gewaarborg.',
    xh: 'Idatha yoluntu. Ayiqinisekisiwe.',
    st: 'Data ya sechaba. Ha e netefatswe.',
  },
}

export function t(key: string, lang: Language): string {
  return T[key]?.[lang] ?? T[key]?.['en'] ?? key
}
