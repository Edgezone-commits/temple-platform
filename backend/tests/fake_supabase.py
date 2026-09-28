# backend/tests/fake_supabase.py
# In-memory stand-in for the supabase-py Client, for API tests that shouldn't
# need a live Supabase project. Implements only the query-builder calls the
# routers use. Filters are applied to in-memory rows, so list/filter/order
# behaviour is exercised for real; RLS is NOT (the backend uses the
# service-role key, which bypasses RLS anyway — see database/tests for RLS).

import copy
import re
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace


def _now():
    return datetime.now(timezone.utc).isoformat()


class _Result(SimpleNamespace):
    pass


class _Query:
    def __init__(self, db, table):
        self.db, self.table = db, table
        self.op, self.payload = "select", None
        self.filters, self.orders = [], []
        self.lo, self.hi, self.lim = None, None, None
        self.join = None

    # --- builders --------------------------------------------------------
    def select(self, cols="*"):
        m = re.search(r"(\w+):(\w+)\(([^)]*)\)", cols)   # alias:table(col, col)
        if m:
            self.join = (m.group(1), m.group(2), [c.strip() for c in m.group(3).split(",")])
        return self

    def insert(self, data):
        self.op, self.payload = "insert", data
        return self

    def update(self, data):
        self.op, self.payload = "update", data
        return self

    def delete(self):
        self.op = "delete"
        return self

    def eq(self, col, val):
        self.filters.append(lambda r: str(r.get(col)) == str(val) if not isinstance(val, bool) else r.get(col) is val)
        return self

    def gte(self, col, val):
        self.filters.append(lambda r: r.get(col) is not None and str(r[col]) >= str(val))
        return self

    def lte(self, col, val):
        self.filters.append(lambda r: r.get(col) is not None and str(r[col]) <= str(val))
        return self

    def or_(self, expr):
        # supports "a.gte.X,b.gte.Y"
        parts = [p.split(".", 2) for p in expr.split(",")]
        self.filters.append(lambda r: any(
            r.get(c) is not None and str(r[c]) >= v for c, op, v in parts if op == "gte"))
        return self

    def order(self, col, desc=False):
        self.orders.append((col, desc))
        return self

    def range(self, lo, hi):
        self.lo, self.hi = lo, hi
        return self

    def limit(self, n):
        self.lim = n
        return self

    # --- execution -------------------------------------------------------
    def _matching(self):
        return [r for r in self.db.tables.setdefault(self.table, []) if all(f(r) for f in self.filters)]

    def execute(self):
        rows = self.db.tables.setdefault(self.table, [])
        if self.op == "insert":
            payloads = self.payload if isinstance(self.payload, list) else [self.payload]
            new = [{"id": str(uuid.uuid4()), "created_at": _now(), "updated_at": _now(),
                    **self.db.defaults.get(self.table, {}), **copy.deepcopy(p)} for p in payloads]
            rows.extend(new)
            return _Result(data=copy.deepcopy(new))
        if self.op == "update":
            hit = self._matching()
            for r in hit:
                r.update(copy.deepcopy(self.payload), updated_at=_now())
            return _Result(data=copy.deepcopy(hit))
        if self.op == "delete":
            hit = self._matching()
            self.db.tables[self.table] = [r for r in rows if r not in hit]
            return _Result(data=copy.deepcopy(hit))
        out = copy.deepcopy(self._matching())
        for col, desc in reversed(self.orders):
            out.sort(key=lambda r: (r.get(col) is None, r.get(col)), reverse=desc)
        if self.lo is not None:
            out = out[self.lo:self.hi + 1]
        if self.lim is not None:
            out = out[:self.lim]
        if self.join:
            alias, jt, cols = self.join
            for r in out:
                target = next((j for j in self.db.tables.get(jt, []) if j["id"] == r.get(f"{jt[:-1]}_id")), None)
                r[alias] = {c: target[c] for c in cols} if target else None
        return _Result(data=out)


class FakeSupabase:
    """Usage: app.dependency_overrides[get_supabase] = lambda: fake"""

    def __init__(self):
        self.tables: dict[str, list[dict]] = {}
        self.defaults: dict[str, dict] = {}   # column defaults per table, like the SQL schema
        self.tokens: dict[str, str] = {}      # bearer token -> user id
        outer = self

        class _Auth:
            def get_user(self, token):
                uid = outer.tokens.get(token)
                if not uid:
                    raise Exception("invalid JWT")
                return SimpleNamespace(user=SimpleNamespace(id=uid))

        self.auth = _Auth()

    def table(self, name):
        return _Query(self, name)

    # helpers for tests
    def add_user(self, token, role="devotee"):
        uid = str(uuid.uuid4())
        self.tokens[token] = uid
        self.tables.setdefault("profiles", []).append({"id": uid, "role": role})
        return uid

    def seed(self, table, **row):
        row = {"id": str(uuid.uuid4()), "created_at": _now(), "updated_at": _now(),
               **self.defaults.get(table, {}), **row}
        self.tables.setdefault(table, []).append(row)
        return row
