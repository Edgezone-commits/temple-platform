r"""
Generate database/seed_calendar.sql — Ekadashi, Purnima, Amavasya and the
major Vaishnava / Nepali festivals for a date range, computed astronomically.

    pip install ephem nepali-datetime
    python database/tools/generate_calendar_seed.py 2026-09-01 2027-12-31 > database/seed_calendar.sql
    python database/tools/generate_calendar_seed.py --check      # validate against known 2025 dates

How dates are computed (the same principles a printed panchang uses):
  • Tithi (lunar day 1–30) = floor(((Moon longitude − Sun longitude) mod 360) / 12) + 1,
    evaluated at SUNRISE in Hetauda (27.43° N, 85.03° E). A day "has" the tithi
    that is current at its sunrise.
  • Lunar month is amanta (new moon to new moon), named from the Sun's
    sidereal sign (Lahiri ayanamsa) at the new moon that starts it; a month
    with no solar ingress is an adhik (leap) month and gets no festivals.
  • Ekadashi follows the Vaishnava rule: if Dashami is still current at
    arunodaya (96 min before sunrise) the fast moves to the next day; if
    Ekadashi spans two sunrises the second day is observed; if Ekadashi is
    skipped between two sunrises (kshaya) it is observed on Dvadashi.
  • Most festivals use the tithi at sunrise; a few follow their traditional
    time of day instead: Shree Panchami the forenoon (sunrise + 4 h) and
    Holi the evening (pradosh, sunset + 48 min).
  • Vaikuntha Ekadashi = the Shukla Ekadashi observed while the Sun is in
    sidereal Dhanu (Margazhi), as in the Sri Vaishnava tradition.
  • Maghe Sankranti and Nepali New Year come from the Bikram Sambat calendar
    (Magh 1 / Baisakh 1).

These are CALCULATED dates. Temples sometimes follow a specific panchang
with slightly different conventions (e.g. Laxmi Puja by pradosh-kaal
amavasya), so the priest should review the list once a year. Every row can
be edited in the admin dashboard.
"""
import datetime as dt
import math
import sys
from dataclasses import dataclass, field

import ephem
import nepali_datetime

# ----------------------------------------------------------------- astronomy
NPT = dt.timedelta(hours=5, minutes=45)            # Nepal Time = UTC+5:45
OBS = ephem.Observer()
OBS.lat, OBS.lon, OBS.elevation = "27.4284", "85.0322", 450   # Hetauda
OBS.pressure = 0                                   # refraction handled by horizon below
OBS.horizon = "-0:50"                              # standard sunrise definition


def ecl_lon(body, when) -> float:
    """Apparent geocentric ecliptic longitude (degrees) of `body` at `when` (ephem date)."""
    body.compute(when)
    return math.degrees(ephem.Ecliptic(ephem.Equatorial(body.ra, body.dec, epoch=when), epoch=when).lon)


def ayanamsa(when) -> float:
    """Lahiri ayanamsa, linear approximation (good to ~0.01° this century)."""
    years = (ephem.Date(when) - ephem.Date("2000/1/1 12:00")) / 365.25
    return 23.853 + years * (50.29 / 3600)


def tithi_at(when) -> int:
    diff = (ecl_lon(ephem.Moon(), when) - ecl_lon(ephem.Sun(), when)) % 360
    return int(diff // 12) + 1                     # 1..30 (1–15 Shukla, 16–30 Krishna)


def sun_sign(when) -> int:
    return int(((ecl_lon(ephem.Sun(), when) - ayanamsa(when)) % 360) // 30)   # 0 = Mesha


def sunrise(day: dt.date):
    OBS.date = ephem.Date(dt.datetime(day.year, day.month, day.day) - NPT)   # local midnight
    return OBS.next_rising(ephem.Sun())


# Amanta month named from the Sun's sidereal sign at the starting new moon.
MONTH_FOR_SIGN = {11: "Chaitra", 0: "Vaishakha", 1: "Jyeshtha", 2: "Ashadha", 3: "Shravana",
                  4: "Bhadrapada", 5: "Ashwin", 6: "Kartik", 7: "Margashirsha", 8: "Pausha",
                  9: "Magha", 10: "Phalguna"}


@dataclass
class Day:
    date: dt.date
    tithi: int
    arunodaya_tithi: int
    month: str
    adhik: bool
    sun_sign: int


def lunar_month(when):
    nm_prev = ephem.previous_new_moon(when)
    nm_next = ephem.next_new_moon(when)
    s1, s2 = sun_sign(nm_prev), sun_sign(nm_next)
    return MONTH_FOR_SIGN[s1], s1 == s2            # no ingress during the month → adhik


def build_days(start: dt.date, end: dt.date) -> list[Day]:
    days, d = [], start
    while d <= end:
        sr = sunrise(d)
        month, adhik = lunar_month(sr)
        days.append(Day(d, tithi_at(sr), tithi_at(ephem.Date(sr - 96 * ephem.minute)), month, adhik, sun_sign(sr)))
        d += dt.timedelta(days=1)
    return days


# ----------------------------------------------------------------- names
EKADASHI = {  # amanta month: (Shukla, Krishna)
    "Chaitra": ("Kamada", "Varuthini"), "Vaishakha": ("Mohini", "Apara"),
    "Jyeshtha": ("Nirjala", "Yogini"), "Ashadha": ("Harishayani", "Kamika"),
    "Shravana": ("Putrada", "Aja"), "Bhadrapada": ("Parivartini", "Indira"),
    "Ashwin": ("Papankusha", "Rama"), "Kartik": ("Haribodhini", "Utpanna"),
    "Margashirsha": ("Mokshada", "Saphala"), "Pausha": ("Putrada", "Shattila"),
    "Magha": ("Jaya", "Vijaya"), "Phalguna": ("Amalaki", "Papamochani"),
}
EKADASHI_NE = {
    "Kamada": "कामदा", "Varuthini": "वरूथिनी", "Mohini": "मोहिनी", "Apara": "अपरा",
    "Nirjala": "निर्जला", "Yogini": "योगिनी", "Harishayani": "हरिशयनी", "Kamika": "कामिका",
    "Putrada": "पुत्रदा", "Aja": "अजा", "Parivartini": "परिवर्तिनी", "Indira": "इन्दिरा",
    "Papankusha": "पापांकुशा", "Rama": "रमा", "Haribodhini": "हरिबोधिनी", "Utpanna": "उत्पन्ना",
    "Mokshada": "मोक्षदा", "Saphala": "सफला", "Shattila": "षटतिला", "Jaya": "जया",
    "Vijaya": "विजया", "Amalaki": "आमलकी", "Papamochani": "पापमोचनी",
}
MONTH_NE = {
    "Chaitra": "चैत्र", "Vaishakha": "वैशाख", "Jyeshtha": "ज्येष्ठ", "Ashadha": "आषाढ",
    "Shravana": "श्रावण", "Bhadrapada": "भाद्र", "Ashwin": "आश्विन", "Kartik": "कार्तिक",
    "Margashirsha": "मार्गशीर्ष", "Pausha": "पौष", "Magha": "माघ", "Phalguna": "फाल्गुन",
}
PURNIMA_NAME = {  # special names for some full moons
    "Ashwin": ("Kojagrat Purnima", "कोजाग्रत पूर्णिमा"),
    "Kartik": ("Kartik Purnima", "कार्तिक पूर्णिमा"),
    "Vaishakha": ("Buddha Purnima", "बुद्ध पूर्णिमा"),
    "Ashadha": ("Guru Purnima", "गुरु पूर्णिमा"),
    "Shravana": ("Janai Purnima", "जनै पूर्णिमा"),
}
# (amanta month, tithi) → (title_en, title_ne, description_en, description_ne, is_major[, rule])
# rule: "sunrise" (default) | "forenoon" | "pradosh" — the time of day at which the tithi must hold.
FESTIVALS = {
    ("Ashwin", 1):  ("Ghatasthapana", "घटस्थापना", "First day of Bada Dashain.", "बडा दशैंको पहिलो दिन।", True),
    ("Ashwin", 10): ("Vijaya Dashami", "विजया दशमी", "Dashain tika day.", "दशैंको टीका।", True),
    ("Ashwin", 30): ("Laxmi Puja (Tihar)", "लक्ष्मी पूजा (तिहार)", "Worship of Goddess Lakshmi; the temple is lit with lamps.", "देवी लक्ष्मीको पूजा; मन्दिर दीपले सजिन्छ।", True),
    ("Kartik", 1):  ("Govardhan Puja", "गोवर्धन पूजा", "Offering to Lord Krishna as lifter of Govardhan hill.", "गोवर्धनधारी भगवान कृष्णको पूजा।", False),
    ("Kartik", 2):  ("Bhai Tika", "भाइटीका", "Final day of Tihar.", "तिहारको अन्तिम दिन।", True),
    ("Margashirsha", 5): ("Vivah Panchami", "विवाह पञ्चमी", "Divine wedding of Sri Rama and Sita.", "श्रीराम र सीताको दिव्य विवाह।", True),
    ("Magha", 5):   ("Shree Panchami", "श्रीपञ्चमी", "Vasanta Panchami.", "वसन्त पञ्चमी।", False, "forenoon"),
    ("Phalguna", 15): ("Fagu Purnima (Holi)", "फागु पूर्णिमा (होली)", "Festival of colours (hill date; the Terai celebrates the next day).", "रंगको पर्व (पहाडी मिति; तराईमा भोलिपल्ट)।", True, "pradosh"),
    ("Chaitra", 9): ("Sri Rama Navami", "श्रीराम नवमी", "Appearance day of Lord Sri Rama.", "भगवान श्रीरामको प्राकट्य दिवस।", True),
    ("Vaishakha", 14): ("Narasimha Jayanti", "नृसिंह जयन्ती", "Appearance day of Lord Narasimha.", "भगवान नृसिंहको प्राकट्य दिवस।", True),
    ("Shravana", 23): ("Sri Krishna Janmashtami", "श्रीकृष्ण जन्माष्टमी", "Appearance day of Lord Krishna; midnight abhishekam.", "भगवान कृष्णको जन्मोत्सव; मध्यरातमा अभिषेक।", True),
}


# ----------------------------------------------------------------- rules
@dataclass
class Entry:
    date: dt.date
    category: str
    title_en: str
    title_ne: str
    tithi_en: str = ""
    tithi_ne: str = ""
    description_en: str = ""
    description_ne: str = ""
    is_major: bool = False
    tags: list = field(default_factory=list)


def first_day_with(days, i0, target):
    """Index of the observance day for tithi `target` near days[i0]: the first
    day whose sunrise tithi == target, or — if the tithi is skipped (kshaya) —
    the day it falls within (sunrise tithi is target-1, next is target+1)."""
    # Start one day back: a skipped tithi is only noticed on the day AFTER it
    # (sunrise tithi jumps target-1 → target+1), but it falls within the day before.
    for i in range(max(i0 - 1, 0), min(i0 + 3, len(days))):
        if days[i].tithi == target:
            return i
        if i + 1 < len(days) and days[i].tithi == (target - 2) % 30 + 1 and days[i + 1].tithi == target % 30 + 1:
            return i
    return None


def tithi_rule_time(day: dt.date, rule: str):
    sr = sunrise(day)
    if rule == "forenoon":
        return ephem.Date(sr + 4 * ephem.hour)
    if rule == "pradosh":
        OBS.date = sr
        return ephem.Date(OBS.next_setting(ephem.Sun()) + 48 * ephem.minute)
    return sr


def festival_day(days, i, target, rule):
    """First day (from i-1) whose tithi at the rule's time of day == target."""
    if rule == "sunrise":
        return first_day_with(days, i, target)
    for j in range(max(i - 1, 0), min(i + 2, len(days))):
        if tithi_at(tithi_rule_time(days[j].date, rule)) == target:
            return j
    return first_day_with(days, i, target)


def vaishnava_ekadashi(days, i):
    """Given the first day index with Ekadashi (11/26) or the kshaya day, return observance index."""
    d = days[i]
    ek = 11 if d.tithi <= 15 else 26
    if d.tithi != ek:                                # kshaya: observe on Dvadashi (next day)
        return i + 1
    if d.arunodaya_tithi == ek - 1:                  # Dashami-viddha at arunodaya → next day
        return i + 1
    if i + 1 < len(days) and days[i + 1].tithi == ek:  # Ekadashi at two sunrises → second
        return i + 1
    return i


def compute(start: dt.date, end: dt.date) -> list[Entry]:
    # pad the range so rules that look a day ahead/behind work at the edges
    days = build_days(start - dt.timedelta(days=3), end + dt.timedelta(days=3))
    out: list[Entry] = []
    seen = set()

    def add(i, e: Entry):
        key = (e.title_en, e.date)
        if 0 <= i < len(days) and start <= e.date <= end and key not in seen:
            seen.add(key)
            out.append(e)

    for i, d in enumerate(days):
        prev = days[i - 1].tithi if i else None
        starts = lambda t: d.tithi == t or (prev is not None and prev == (t - 2) % 30 + 1 and d.tithi == t % 30 + 1)  # noqa: E731
        if prev is not None and (d.tithi == prev):
            continue                                  # vriddhi second day handled by rules

        m, adhik = d.month, d.adhik
        m_ne = MONTH_NE[m]

        # --- Ekadashi -----------------------------------------------------
        for ek, paksha, paksha_ne, idx in ((11, "Shukla", "शुक्ल", 0), (26, "Krishna", "कृष्ण", 1)):
            if starts(ek):
                j = first_day_with(days, i, ek)
                if j is None:
                    continue
                o = vaishnava_ekadashi(days, j)
                name = EKADASHI[m][idx] if not adhik else "Padmini" if idx == 0 else "Parama"
                name_ne = EKADASHI_NE.get(name, {"Padmini": "पद्मिनी", "Parama": "परमा"}.get(name, name))
                vaikuntha = idx == 0 and days[o].sun_sign == 8 and not adhik
                major = vaikuntha or name in ("Haribodhini", "Harishayani")
                e = Entry(days[o].date, "ekadashi",
                          ("Vaikuntha Ekadashi" if vaikuntha else f"{name} Ekadashi"),
                          ("वैकुण्ठ एकादशी" if vaikuntha else f"{name_ne} एकादशी"),
                          f"{paksha} Ekadashi", f"{paksha_ne} एकादशी",
                          (f"{name} Ekadashi — gates of Vaikuntha open. Fasting and night-long prayers." if vaikuntha
                           else "Fasting day for Lord Vishnu."),
                          ("वैकुण्ठ द्वार खुल्ने दिन। उपवास र रातभरि प्रार्थना।" if vaikuntha
                           else "भगवान विष्णुको व्रत।"),
                          major)
                add(o, e)

        # --- Purnima / Amavasya -------------------------------------------
        if starts(15):
            j = first_day_with(days, i, 15)
            if j is not None:
                en, ne = PURNIMA_NAME.get(m, (f"{m} Purnima", f"{m_ne} पूर्णिमा"))
                add(j, Entry(days[j].date, "purnima", en, ne, "Purnima", "पूर्णिमा",
                             "Full moon — evening prayers and lamp offering.", "पूर्णिमा — साँझको प्रार्थना र दीप अर्पण।",
                             m in PURNIMA_NAME))
        if starts(30):
            j = first_day_with(days, i, 30)
            if j is not None and (m, 30) not in FESTIVALS:
                add(j, Entry(days[j].date, "amavasya", f"{m} Amavasya", f"{m_ne} औंसी", "Amavasya", "औंसी"))

        # --- Festivals by (month, tithi) ----------------------------------
        if not adhik:
            for (fm, ft), (en, ne, den, dne, major, *rule) in FESTIVALS.items():
                if fm == m and starts(ft):
                    j = festival_day(days, i, ft, rule[0] if rule else "sunrise")
                    if j is not None:
                        add(j, Entry(days[j].date, "festival", en, ne, "", "", den, dne, major))

    # --- BS-calendar based --------------------------------------------------
    for y in range(start.year - 1, end.year + 2):
        for bs_m, en, ne, den, dne in ((10, "Maghe Sankranti", "माघे संक्रान्ति", "Sun enters Makara; sesame and ghee offerings.", "सूर्य मकर राशिमा प्रवेश; तिल र घिउ अर्पण।"),
                                       (1, "Nepali New Year", "नयाँ वर्ष", "Baisakh 1 — first day of the Bikram Sambat year.", "बैशाख १ — विक्रम संवत्को पहिलो दिन।")):
            try:
                ad = nepali_datetime.date(y + 57, bs_m, 1).to_datetime_date()
            except Exception:
                continue
            if start <= ad <= end:
                out.append(Entry(ad, "sankranti" if bs_m == 10 else "festival", en, ne, "", "", den, dne, True))

    out.sort(key=lambda e: (e.date, e.category != "festival", e.title_en))
    return out


# ----------------------------------------------------------------- output
def sql_str(s):
    return "null" if not s else "'" + s.replace("'", "''") + "'"


def to_sql(entries, start, end):
    lines = [
        "-- =============================================================================",
        f"-- Calendar observances {start} → {end} (GENERATED — do not hand-edit;",
        "-- edit rows in the admin dashboard, or re-run database/tools/generate_calendar_seed.py).",
        "-- Computed astronomically for Hetauda; see the generator's docstring for the rules.",
        "-- Please have the temple priest review these once against the temple's panchang.",
        "-- Idempotent: skips any (date, English title) that already exists.",
        "-- =============================================================================",
        "insert into public.calendar_events",
        "  (event_date, category, title_en, title_ne, tithi_en, tithi_ne, description_en, description_ne, is_major)",
        "select v.event_date::date, v.category, v.title_en, v.title_ne, v.tithi_en, v.tithi_ne,",
        "       v.description_en, v.description_ne, v.is_major",
        "from (values",
    ]
    rows = [f"  ('{e.date}', '{e.category}', {sql_str(e.title_en)}, {sql_str(e.title_ne)}, {sql_str(e.tithi_en)}, "
            f"{sql_str(e.tithi_ne)}, {sql_str(e.description_en)}, {sql_str(e.description_ne)}, {str(e.is_major).lower()})"
            for e in entries]
    lines.append(",\n".join(rows))
    lines += [
        ") as v(event_date, category, title_en, title_ne, tithi_en, tithi_ne, description_en, description_ne, is_major)",
        "where not exists (",
        "  select 1 from public.calendar_events c",
        "  where c.event_date = v.event_date::date and c.title_en = v.title_en",
        ");",
    ]
    return "\n".join(lines) + "\n"


# Known Nepal dates for 2025 (from published Nepali calendars) used by --check.
KNOWN_2025 = {
    "Shree Panchami": "2025-02-02",
    "Fagu Purnima (Holi)": "2025-03-13",
    "Sri Rama Navami": "2025-04-06",
    "Nepali New Year": "2025-04-14",
    "Sri Krishna Janmashtami": "2025-08-16",
    "Ghatasthapana": "2025-09-22",
    "Vijaya Dashami": "2025-10-02",
    "Laxmi Puja (Tihar)": "2025-10-21",
    "Bhai Tika": "2025-10-23",
}


def check():
    got = {e.title_en: str(e.date) for e in compute(dt.date(2025, 1, 1), dt.date(2025, 12, 31))}
    bad = 0
    for k, v in KNOWN_2025.items():
        ok = got.get(k) == v
        bad += not ok
        print(f"{'OK ' if ok else 'BAD'} {k:26} expected {v}  computed {got.get(k)}")
    print("ALL MATCH" if not bad else f"{bad} MISMATCH(ES)")
    return bad == 0


if __name__ == "__main__":
    if sys.argv[1:] == ["--check"]:
        sys.exit(0 if check() else 1)
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    s, e = dt.date.fromisoformat(sys.argv[1]), dt.date.fromisoformat(sys.argv[2])
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stdout.write(to_sql(compute(s, e), s, e))
