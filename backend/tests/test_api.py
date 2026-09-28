# backend/tests/test_api.py
# API tests against an in-memory fake Supabase (tests/fake_supabase.py).
# Run from backend/:  pip install -r requirements-dev.txt && pytest -q

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.database import get_supabase
from app.main import app
from tests.fake_supabase import FakeSupabase

TODAY = date.today()
D = lambda n: str(TODAY + timedelta(days=n))  # noqa: E731


@pytest.fixture()
def fake():
    fake = FakeSupabase()
    fake.defaults = {
        "events": {"is_active": True, "is_featured": False, "category": "festival"},
        "poojas": {"is_available": True, "is_popular": False, "currency": "NPR", "sort_order": 0},
        "pooja_bookings": {"status": "pending"},
        "archanas": {"is_available": True, "currency": "NPR", "sort_order": 0},
        "calendar_events": {"is_published": True, "is_major": False, "category": "festival"},
        "temple_info": {"category": "general", "sort_order": 0},
        "gallery": {"category": "temple", "sort_order": 0, "is_published": True},
        "leadership": {"is_founder": False, "sort_order": 0, "is_published": True},
    }
    app.dependency_overrides[get_supabase] = lambda: fake
    yield fake
    app.dependency_overrides.clear()


@pytest.fixture()
def client(fake):
    return TestClient(app)


ADMIN = {"Authorization": "Bearer admin-token"}
DEVOTEE = {"Authorization": "Bearer devotee-token"}


# ---------------------------------------------------------------- events
def test_events_list_filters(client, fake):
    fake.seed("events", title_en="Past", event_date=D(-5))
    fake.seed("events", title_en="Ekadashi", event_date=D(3), category="ekadashi")
    fake.seed("events", title_en="Hidden", event_date=D(4), is_active=False)
    fake.seed("events", title_en="Fest", event_date=D(9))

    r = client.get("/api/v1/events/?upcoming=true")
    assert r.status_code == 200
    assert [e["title_en"] for e in r.json()] == ["Ekadashi", "Fest"]

    r = client.get("/api/v1/events/?category=ekadashi")
    assert [e["title_en"] for e in r.json()] == ["Ekadashi"]
    assert client.get("/api/v1/events/?category=bogus").status_code == 422


def test_event_404_not_500(client):
    r = client.get("/api/v1/events/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


def test_event_writes_need_admin(client, fake):
    fake.add_user("admin-token", role="admin")
    fake.add_user("devotee-token")
    body = {"title_en": "Diwali", "event_date": D(30), "category": "festival"}
    assert client.post("/api/v1/events/", json=body).status_code == 401
    assert client.post("/api/v1/events/", json=body, headers=DEVOTEE).status_code == 403
    r = client.post("/api/v1/events/", json=body, headers=ADMIN)
    assert r.status_code == 201 and r.json()["category"] == "festival"


# ---------------------------------------------------------------- poojas / bookings
def test_booking_flow(client, fake):
    fake.add_user("admin-token", role="admin")
    devotee_id = fake.add_user("devotee-token")
    pooja = fake.seed("poojas", name_en="Abhishekam", name_ne="अभिषेकम्", is_popular=True)

    assert client.get("/api/v1/poojas/").json()[0]["is_popular"] is True

    booking = {"pooja_id": pooja["id"], "devotee_name": "Ram", "devotee_phone": "9800000000",
               "booking_date": D(2), "booking_time": "05:00"}
    # anonymous booking
    r = client.post("/api/v1/bookings/", json=booking)
    assert r.status_code == 201, r.text
    assert r.json()["user_id"] is None
    # logged-in booking is linked to the account
    r = client.post("/api/v1/bookings/", json=booking, headers=DEVOTEE)
    assert r.json()["user_id"] == devotee_id

    # past date and bad time rejected
    assert client.post("/api/v1/bookings/", json={**booking, "booking_date": D(-1)}).status_code == 422
    assert client.post("/api/v1/bookings/", json={**booking, "booking_time": "5:00 AM (Suprabhatam)"}).status_code == 422

    # unavailable pooja rejected
    gone = fake.seed("poojas", name_en="Retired", is_available=False)
    assert client.post("/api/v1/bookings/", json={**booking, "pooja_id": gone["id"]}).status_code == 422

    # inbox is admin-only and includes the pooja name
    assert client.get("/api/v1/bookings/").status_code == 401
    assert client.get("/api/v1/bookings/", headers=DEVOTEE).status_code == 403
    inbox = client.get("/api/v1/bookings/", headers=ADMIN).json()
    assert len(inbox) == 2 and inbox[0]["pooja"] == {"name_en": "Abhishekam", "name_ne": "अभिषेकम्"}

    # admin confirms with a note
    r = client.patch(f"/api/v1/bookings/{inbox[0]['id']}", json={"status": "confirmed", "admin_notes": "Call placed"}, headers=ADMIN)
    assert r.status_code == 200 and r.json()["status"] == "confirmed" and r.json()["admin_notes"] == "Call placed"


# ---------------------------------------------------------------- archanas (CRUD factory)
def test_archanas_public_and_admin(client, fake):
    fake.add_user("admin-token", role="admin")
    fake.add_user("devotee-token")
    fake.seed("archanas", name_en="Tulasi Archana", sort_order=2)
    fake.seed("archanas", name_en="Pushpanjali", sort_order=1)
    hidden = fake.seed("archanas", name_en="Old", is_available=False)

    assert [a["name_en"] for a in client.get("/api/v1/archanas/").json()] == ["Pushpanjali", "Tulasi Archana"]
    assert client.get("/api/v1/archanas/?all=true").status_code == 403
    assert client.get("/api/v1/archanas/?all=true", headers=DEVOTEE).status_code == 403
    assert len(client.get("/api/v1/archanas/?all=true", headers=ADMIN).json()) == 3
    assert client.get(f"/api/v1/archanas/{hidden['id']}").status_code == 404
    assert client.get(f"/api/v1/archanas/{hidden['id']}", headers=ADMIN).status_code == 200

    r = client.post("/api/v1/archanas/", json={"name_en": "Ashtottara", "price": 100}, headers=ADMIN)
    assert r.status_code == 201
    aid = r.json()["id"]
    assert client.patch(f"/api/v1/archanas/{aid}", json={"price": 151}, headers=ADMIN).json()["price"] == 151
    assert client.delete(f"/api/v1/archanas/{aid}", headers=DEVOTEE).status_code == 403
    assert client.delete(f"/api/v1/archanas/{aid}", headers=ADMIN).status_code == 204
    assert client.get(f"/api/v1/archanas/{aid}").status_code == 404   # soft-deleted → hidden


# ---------------------------------------------------------------- calendar
def test_calendar_range_and_validation(client, fake):
    fake.add_user("admin-token", role="admin")
    fake.seed("calendar_events", title_en="Old", event_date=D(-40))
    fake.seed("calendar_events", title_en="Brahmotsavam", event_date=D(-3), end_date=D(5), is_major=True)
    fake.seed("calendar_events", title_en="Ekadashi", event_date=D(4), category="ekadashi")
    fake.seed("calendar_events", title_en="Far", event_date=D(90))
    fake.seed("calendar_events", title_en="Draft", event_date=D(4), is_published=False)

    r = client.get(f"/api/v1/calendar/?start={D(0)}&end={D(30)}")
    assert r.status_code == 200
    # multi-day festival that started 3 days ago is still included
    assert [e["title_en"] for e in r.json()] == ["Brahmotsavam", "Ekadashi"]
    assert [e["title_en"] for e in client.get("/api/v1/calendar/?category=ekadashi").json()] == ["Ekadashi"]

    bad = {"title_en": "Bad", "event_date": D(10), "end_date": D(5)}
    assert client.post("/api/v1/calendar/", json=bad, headers=ADMIN).status_code == 422
    ok = {"title_en": "Purnima", "event_date": D(10), "category": "purnima", "bs_date_ne": "असोज २७, २०८३"}
    r = client.post("/api/v1/calendar/", json=ok, headers=ADMIN)
    assert r.status_code == 201 and r.json()["bs_date_ne"] == "असोज २७, २०८३"


# ---------------------------------------------------------------- temple info
def test_temple_info(client, fake):
    fake.add_user("admin-token", role="admin")
    fake.seed("temple_info", key="timings.morning", category="timings", value_en="5:00 AM – 12:00 PM")
    assert client.get("/api/v1/temple-info/").json()[0]["key"] == "timings.morning"
    assert client.post("/api/v1/temple-info/", json={"key": "Bad Key!"}, headers=ADMIN).status_code == 422


# ---------------------------------------------------------------- gallery
def test_gallery(client, fake):
    fake.add_user("admin-token", role="admin")
    fake.add_user("devotee-token")
    ev = fake.seed("events", title_en="Brahmotsavam", title_ne="ब्रह्मोत्सवम्", event_date=D(10))
    fake.seed("gallery", image_url="/images/altar.jpg", category="deity", sort_order=2)
    fake.seed("gallery", image_url="https://x.supabase.co/storage/v1/object/public/gallery/a.jpg",
              category="festival", event_id=ev["id"], caption_en="Procession", sort_order=1)
    fake.seed("gallery", image_url="/images/hidden.jpg", is_published=False)

    r = client.get("/api/v1/gallery/")
    assert r.status_code == 200
    rows = r.json()
    assert [g["category"] for g in rows] == ["festival", "deity"]           # sort_order, hidden excluded
    assert rows[0]["event"] == {"title_en": "Brahmotsavam", "title_ne": "ब्रह्मोत्सवम्"}
    assert rows[1]["event"] is None
    assert [g["category"] for g in client.get("/api/v1/gallery/?category=deity").json()] == ["deity"]
    assert client.get("/api/v1/gallery/?category=bogus").status_code == 422
    assert len(client.get("/api/v1/gallery/?all=true", headers=ADMIN).json()) == 3
    assert client.get("/api/v1/gallery/?all=true", headers=DEVOTEE).status_code == 403

    ok = {"image_url": "https://x.supabase.co/storage/v1/object/public/gallery/b.jpg", "category": "pooja",
          "storage_path": "b.jpg", "caption_ne": "पूजा"}
    assert client.post("/api/v1/gallery/", json=ok).status_code == 401
    r = client.post("/api/v1/gallery/", json=ok, headers=ADMIN)
    assert r.status_code == 201 and r.json()["caption_ne"] == "पूजा"
    for bad in ("javascript:alert(1)", "//evil.example/x.jpg", "data:image/png;base64,AAA"):
        assert client.post("/api/v1/gallery/", json={**ok, "image_url": bad}, headers=ADMIN).status_code == 422, bad
    gid = r.json()["id"]
    assert client.patch(f"/api/v1/gallery/{gid}", json={"image_url": "javascript:x"}, headers=ADMIN).status_code == 422
    assert client.delete(f"/api/v1/gallery/{gid}", headers=ADMIN).status_code == 204
    assert client.get(f"/api/v1/gallery/{gid}").status_code == 404        # hard delete


# ---------------------------------------------------------------- admin ?all=true on legacy lists
def test_all_param_is_admin_only(client, fake):
    fake.add_user("admin-token", role="admin")
    fake.add_user("devotee-token")
    fake.seed("events", title_en="Live", event_date=D(3))
    fake.seed("events", title_en="Hidden", event_date=D(4), is_active=False)
    fake.seed("poojas", name_en="Retired", is_available=False)
    fake.seed("books", title_en="Draft", is_published=False, sort_order=0)
    fake.seed("bhajans", title_en="Draft", is_published=False, sort_order=0)
    assert [e["title_en"] for e in client.get("/api/v1/events/").json()] == ["Live"]
    for path in ("/api/v1/events/?all=true", "/api/v1/poojas/?all=true", "/api/v1/books/?all=true", "/api/v1/bhajans/?all=true"):
        assert client.get(path).status_code == 403, path
        assert client.get(path, headers=DEVOTEE).status_code == 403, path
        assert client.get(path, headers=ADMIN).status_code == 200, path
    assert {e["title_en"] for e in client.get("/api/v1/events/?all=true", headers=ADMIN).json()} == {"Live", "Hidden"}
    assert client.get("/api/v1/poojas/").json() == []
    assert len(client.get("/api/v1/poojas/?all=true", headers=ADMIN).json()) == 1


# ---------------------------------------------------------------- leadership
def test_leadership(client, fake):
    fake.add_user("admin-token", role="admin")
    fake.seed("leadership", name_en="Current Priest", sort_order=1)
    fake.seed("leadership", name_en="Founder Ji", is_founder=True, sort_order=5)
    fake.seed("leadership", name_en="Draft", is_published=False)
    rows = client.get("/api/v1/leadership/").json()
    assert [r["name_en"] for r in rows] == ["Founder Ji", "Current Priest"]      # founders first
    body = {"name_en": "Acharya Ji", "role_ne": "आचार्य", "video_url": "https://youtu.be/abc", "photo_url": ""}
    r = client.post("/api/v1/leadership/", json=body, headers=ADMIN)
    assert r.status_code == 201 and r.json()["photo_url"] is None and r.json()["role_ne"] == "आचार्य"
    assert client.post("/api/v1/leadership/", json={**body, "video_url": "javascript:alert(1)"}, headers=ADMIN).status_code == 422
    assert client.post("/api/v1/leadership/", json=body).status_code == 401
