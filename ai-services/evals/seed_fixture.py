"""
The seed content, as Python rows, plus a stand-in Supabase client.

Every row here is copied from database/seed.sql and database/seed_calendar.sql.
Nothing is invented: if a fact isn't in those files, it isn't here, and the
eval cases only assert on what this file contains. When the seed files change,
`python evals/seed_fixture.py --check` re-reads them and reports any drift.

Two facts about the seed data that the eval cases have to respect:

  • temple_info.contact.phone is the literal placeholder '+977-XXXXXXXXX'.
    No case may assert on a phone number, because there isn't a real one yet.
  • public.events rows are inserted at `current_date + days_ahead`, so their
    dates move every day. Only calendar_events dates are absolute, so only
    those are safe to assert on.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parents[2] / "database"

# ---------------------------------------------------------------- seed.sql
POOJAS = [
    # name_en, name_ne, duration_minutes, price
    ("Sahasranama Archana", "सहस्रनाम अर्चना", 45, 500),
    ("Abhishekam", "अभिषेकम्", 60, 1100),
    ("Sudarshana Homam", "सुदर्शन होमम्", 120, 3100),
    ("Sri Sooktam Puja", "श्री सूक्तम् पूजा", 75, 1500),
    ("Nakshatra Shanti", "नक्षत्र शान्ति", 90, 2100),
    ("Satyanarayan Puja", "सत्यनारायण पूजा", 120, 2500),
    ("Lakshmi Puja", "लक्ष्मी पूजा", 60, 1800),
    ("Vishnu Sahasranama", "विष्णु सहस्रनाम", 60, 800),
    ("Thiruvanandal Seva", "तिरुवानन्दल सेवा", 45, 1200),
]

ARCHANAS = [
    # name_en, name_ne, deity_en, price
    ("Ashtottara Archana", "अष्टोत्तर अर्चना", "Laxminarayan", 100),
    ("Sahasranama Archana", "सहस्रनाम अर्चना", "Vishnu", 300),
    ("Pushpanjali", "पुष्पाञ्जलि", "Lakshmi", 51),
    ("Tulasi Archana", "तुलसी अर्चना", "Laxminarayan", 51),
]

TEMPLE_INFO = [
    # key, category, value_en, value_ne
    ("timings.morning", "timings", "Morning darshan: 5:00 AM – 12:00 PM",
     "बिहानको दर्शन: बिहान ५:०० – दिउँसो १२:०० बजे"),
    ("timings.afternoon", "timings", "Temple closed for afternoon break: 12:00 PM – 4:00 PM",
     "दिउँसो विश्राम: १२:०० – ४:०० बजे मन्दिर बन्द"),
    ("timings.evening", "timings", "Evening darshan: 4:00 PM – 8:00 PM",
     "साँझको दर्शन: साँझ ४:०० – रात ८:०० बजे"),
    ("timings.days", "timings", "Open 365 days a year.", "वर्षभरि ३६५ दिन खुला।"),
    ("contact.address", "contact",
     "Shree Laxminarayan Mandir, Hetauda, Makwanpur District, Bagmati Province, Nepal",
     "श्री लक्ष्मीनारायण मन्दिर, हेटौंडा, मकवानपुर जिल्ला, बागमती प्रदेश, नेपाल"),
    # PLACEHOLDER in seed.sql — deliberately not assertable.
    ("contact.phone", "contact", "+977-XXXXXXXXX (during temple hours)",
     "+977-XXXXXXXXX (मन्दिर खुला रहने समयमा)"),
    ("contact.email", "contact", "info@laxminarayanmandir.org", "info@laxminarayanmandir.org"),
    ("about.tradition", "history",
     "The temple follows the Sri Vaishnava Totadri sampradaya. All poojas are conducted "
     "according to the Pancharatra Agama shastra.",
     "मन्दिरले श्री वैष्णव तोताद्री सम्प्रदायको अनुसरण गर्छ। सबै पूजा पञ्चरात्र आगम शास्त्रअनुसार सम्पन्न गरिन्छन्।"),
    ("booking.policy", "rituals",
     "Please book poojas at least 24 hours in advance. Payment is made at the temple on the "
     "day; no advance payment is required.",
     "कृपया पूजा कम्तीमा २४ घण्टा अगाडि बुक गर्नुहोस्। भुक्तानी पूजाकै दिन मन्दिरमा गरिन्छ; अग्रिम भुक्तानी आवश्यक छैन।"),
    ("booking.bring", "rituals",
     "Bring flowers (lotus or marigold preferred), fruits for naivedyam, and wear clean "
     "traditional attire. Footwear is not allowed inside.",
     "फूल (कमल वा सयपत्री उत्तम), नैवेद्यका लागि फलफूल ल्याउनुहोस् र सफा परम्परागत पोशाक लगाउनुहोस्। भित्र जुत्ता-चप्पल लैजान पाइँदैन।"),
]

# ------------------------------------------------------- seed_calendar.sql
# A representative slice (the full file holds ~90 rows through 2027-12-31).
# event_date, category, title_en, title_ne, tithi_en, is_major
CALENDAR = [
    ("2026-09-04", "festival", "Sri Krishna Janmashtami", "श्रीकृष्ण जन्माष्टमी", None, True),
    ("2026-09-07", "ekadashi", "Aja Ekadashi", "अजा एकादशी", "Krishna Ekadashi", False),
    ("2026-09-26", "purnima", "Bhadrapada Purnima", "भाद्र पूर्णिमा", "Purnima", False),
    ("2026-10-06", "ekadashi", "Indira Ekadashi", "इन्दिरा एकादशी", "Krishna Ekadashi", False),
    ("2026-10-11", "festival", "Ghatasthapana", "घटस्थापना", None, True),
    ("2026-10-21", "festival", "Vijaya Dashami", "विजया दशमी", None, True),
    ("2026-10-22", "ekadashi", "Papankusha Ekadashi", "पापांकुशा एकादशी", "Shukla Ekadashi", False),
    ("2026-10-26", "purnima", "Kojagrat Purnima", "कोजाग्रत पूर्णिमा", "Purnima", True),
    ("2026-11-05", "ekadashi", "Rama Ekadashi", "रमा एकादशी", "Krishna Ekadashi", False),
    ("2026-11-09", "festival", "Laxmi Puja (Tihar)", "लक्ष्मी पूजा (तिहार)", None, True),
    ("2026-11-10", "festival", "Govardhan Puja", "गोवर्धन पूजा", None, False),
    ("2026-11-11", "festival", "Bhai Tika", "भाइटीका", None, True),
    ("2026-11-21", "ekadashi", "Haribodhini Ekadashi", "हरिबोधिनी एकादशी", "Shukla Ekadashi", True),
    ("2026-11-24", "purnima", "Kartik Purnima", "कार्तिक पूर्णिमा", "Purnima", True),
    ("2026-12-14", "festival", "Vivah Panchami", "विवाह पञ्चमी", None, True),
    ("2026-12-20", "ekadashi", "Vaikuntha Ekadashi", "वैकुण्ठ एकादशी", "Shukla Ekadashi", True),
    ("2026-12-24", "purnima", "Margashirsha Purnima", "मार्गशीर्ष पूर्णिमा", "Purnima", False),
    ("2027-01-15", "sankranti", "Maghe Sankranti", "माघे संक्रान्ति", None, True),
    ("2027-02-11", "festival", "Shree Panchami", "श्रीपञ्चमी", None, True),
    ("2027-03-21", "festival", "Fagu Purnima (Holi)", "फागु पूर्णिमा (होली)", None, True),
    ("2027-04-14", "festival", "Nepali New Year", "नयाँ वर्ष", None, True),
    ("2027-04-15", "festival", "Sri Rama Navami", "श्रीराम नवमी", None, True),
]

BOOKS = [
    ("Vishnu Sahasranama", "विष्णु सहस्रनाम", "Vyasa Maharshi", "scripture", "sa"),
    ("Sri Ranganatha Stotram", "श्री रंगनाथ स्तोत्रम्", "Adi Shankaracharya", "stotra", "sa"),
    ("Laxminarayan Mahatmya", "लक्ष्मीनारायण माहात्म्य", "Temple Publication", "scripture", "ne"),
    ("Tiruppavai", "तिरुप्पावई", "Andal", "stotra", "sa"),
    ("Introduction to Sri Vaishnavism", "श्री वैष्णवधर्म परिचय", "Temple Publication", "philosophy", "en"),
    ("Ramanuja Darshan", "रामानुज दर्शन", "Sri Ramanuja", "philosophy", "en"),
    ("Totadri Nambi Charitra", "तोताद्री नम्बि चरित्र", "Temple Publication", "biography", "ne"),
]


# ------------------------------------------------------------------- tables
def tables() -> dict[str, list[dict]]:
    """The rows in the shape the real Supabase tables return them."""
    return {
        "poojas": [
            {"id": f"p{i}", "name_en": n, "name_ne": ne, "description_en": "", "description_ne": "",
             "duration_minutes": d, "price": p, "currency": "NPR", "is_available": True,
             "sort_order": i}
            for i, (n, ne, d, p) in enumerate(POOJAS, 1)
        ],
        "archanas": [
            {"id": f"a{i}", "name_en": n, "name_ne": ne, "deity_en": deity, "deity_ne": "",
             "price": p, "currency": "NPR", "is_available": True, "sort_order": i}
            for i, (n, ne, deity, p) in enumerate(ARCHANAS, 1)
        ],
        "temple_info": [
            {"id": f"t{i}", "key": k, "category": c, "value_en": en, "value_ne": ne, "sort_order": i}
            for i, (k, c, en, ne) in enumerate(TEMPLE_INFO, 1)
        ],
        "calendar_events": [
            {"id": f"c{i}", "event_date": d, "end_date": None, "category": cat, "title_en": t_en,
             "title_ne": t_ne, "tithi_en": tithi, "tithi_ne": None, "bs_date_en": None,
             "bs_date_ne": None, "description_en": None, "description_ne": None,
             "is_major": major, "is_published": True}
            for i, (d, cat, t_en, t_ne, tithi, major) in enumerate(CALENDAR, 1)
        ],
        "books": [
            {"id": f"b{i}", "title_en": t, "title_ne": tn, "author_en": a, "author_ne": "",
             "description_en": "", "description_ne": "", "category": c, "language": lang,
             "is_published": True, "pdf_url": None, "sort_order": i}
            for i, (t, tn, a, c, lang) in enumerate(BOOKS, 1)
        ],
        "events": [],     # relative dates in seed.sql; nothing stable to assert
    }


# ------------------------------------------------------- stand-in Supabase
class _Query:
    """The slice of the PostgREST builder that temple_rag.tools actually uses."""

    def __init__(self, rows: list[dict]):
        self.rows = list(rows)

    def select(self, *_cols, **_kw):
        return self

    def eq(self, col, val):
        self.rows = [r for r in self.rows if r.get(col) == val]
        return self

    def gte(self, col, val):
        self.rows = [r for r in self.rows if str(r.get(col) or "") >= str(val)]
        return self

    def lte(self, col, val):
        self.rows = [r for r in self.rows if str(r.get(col) or "") <= str(val)]
        return self

    def order(self, col, desc=False):
        self.rows.sort(key=lambda r: (r.get(col) is None, r.get(col)), reverse=desc)
        return self

    def limit(self, n):
        self.rows = self.rows[:n]
        return self

    def execute(self):
        class R:
            pass
        out = R()
        out.data = self.rows
        return out


class FakeSupabase:
    """Enough of the client for the agent's read-only tools. Writes are refused."""

    def __init__(self, data: dict[str, list[dict]] | None = None):
        self.data = data if data is not None else tables()
        self.queried: list[str] = []

    def table(self, name: str) -> _Query:
        self.queried.append(name)
        return _Query(self.data.get(name, []))

    # Guard rails: if a tool ever tries to write, the eval run should fail loudly
    # rather than quietly pretending it worked.
    def insert(self, *a, **k):
        raise AssertionError("a tool tried to INSERT; the agent's tools must be read-only")

    def update(self, *a, **k):
        raise AssertionError("a tool tried to UPDATE; the agent's tools must be read-only")

    def delete(self, *a, **k):
        raise AssertionError("a tool tried to DELETE; the agent's tools must be read-only")


# ---------------------------------------------------------------- drift check
def check_against_sql() -> list[str]:
    """Re-read the seed SQL and report facts this fixture gets wrong."""
    problems: list[str] = []
    seed = (SEED_DIR / "seed.sql")
    cal = (SEED_DIR / "seed_calendar.sql")
    if not seed.exists():
        return [f"{seed} not found"]
    seed_text = seed.read_text(encoding="utf-8")
    cal_text = cal.read_text(encoding="utf-8") if cal.exists() else ""

    for name, _ne, duration, price in POOJAS:
        # the pooja tuple in seed.sql ends: <duration>, <price>, <is_popular>, <sort>
        m = re.search(rf"\('{re.escape(name)}',.*?(\d+),\s*(\d+),\s*(?:true|false),\s*\d+\)",
                      seed_text, re.DOTALL)
        if not m:
            problems.append(f"pooja {name!r} not found in seed.sql")
        elif (int(m.group(1)), int(m.group(2))) != (duration, price):
            problems.append(f"pooja {name!r}: fixture says {duration}min/{price}, "
                            f"seed.sql says {m.group(1)}min/{m.group(2)}")

    for key, _cat, value_en, _ne in TEMPLE_INFO:
        if f"'{key}'" not in seed_text:
            problems.append(f"temple_info key {key!r} not in seed.sql")
        elif value_en and value_en.split(":")[0][:28] not in seed_text:
            problems.append(f"temple_info {key!r} value differs from seed.sql")

    for d, _cat, title, _tn, _tithi, _major in CALENDAR:
        if f"('{d}'" not in cal_text or f"'{title}'" not in cal_text:
            problems.append(f"calendar {d} {title!r} not in seed_calendar.sql")

    return problems


if __name__ == "__main__":
    issues = check_against_sql()
    if issues:
        print(f"{len(issues)} mismatch(es) between this fixture and the seed SQL:")
        for i in issues:
            print(f"  - {i}")
        sys.exit(1)
    print(f"Fixture matches the seed SQL: {len(POOJAS)} poojas, {len(ARCHANAS)} archanas, "
          f"{len(TEMPLE_INFO)} temple_info keys, {len(CALENDAR)} calendar rows.")
