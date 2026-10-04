"""
Tests for temple_rag. Offline: uses the hash embedder and a local mock of the
Anthropic Messages API (the real `anthropic` SDK talks to it via base_url),
so no API key, network or model download is needed.

    cd backend && venv\\Scripts\\activate
    pytest ../ai-services/tests -q
"""
import json
import threading
from dataclasses import replace
from datetime import date
from http.server import BaseHTTPRequestHandler, HTTPServer

import anthropic
import chromadb
import pytest

from temple_rag.assistant import PanditAssistant, SYSTEM_PROMPT, detect_language
from temple_rag.chunking import chunk_text
from temple_rag.config import RagConfig
from temple_rag.ingest import HashLedger, ingest_sources
from temple_rag.sources import Source, rows_to_sources
from temple_rag.store import KnowledgeStore


# ------------------------------------------------------------------ fixtures
@pytest.fixture()
def cfg(tmp_path):
    return RagConfig(anthropic_api_key="test-key", claude_model="claude-sonnet-5-5", claude_effort="low",
                     embedding_model="hash", chroma_dir=tmp_path / "chroma", knowledge_dir=tmp_path / "kb",
                     min_similarity=0.05, supabase_url="", supabase_service_key="")


@pytest.fixture()
def store(cfg):
    # own on-disk store per test (the in-memory client is a process-wide singleton)
    return KnowledgeStore(cfg, client=chromadb.PersistentClient(path=str(cfg.chroma_dir)))


TABLES = {
    "temple_info": [
        {"id": "t1", "key": "timings.morning", "category": "timings",
         "value_en": "Morning darshan: 5:00 AM – 12:00 PM", "value_ne": "बिहानको दर्शन: बिहान ५:०० – दिउँसो १२:०० बजे"},
        {"id": "t2", "key": "contact.phone", "category": "contact", "value_en": "+977-57-520000", "value_ne": None},
    ],
    "books": [{"id": "b1", "title_en": "Vishnu Sahasranama", "title_ne": "विष्णु सहस्रनाम", "author_en": "Vyasa",
               "description_en": "The thousand names of Lord Vishnu.", "language": "sa", "is_published": True,
               "pdf_url": None, "_pdf_text": "Om vishvam vishnur vashatkaro bhuta-bhavya-bhavat-prabhuh. " * 40},
              {"id": "b2", "title_en": "Hidden draft", "is_published": False}],
    "poojas": [{"id": "p1", "name_en": "Abhishekam", "name_ne": "अभिषेकम्", "price": 1100, "currency": "NPR",
                "duration_minutes": 60, "is_available": True}],
    "archanas": [{"id": "a1", "name_en": "Tulasi Archana", "deity_en": "Laxminarayan", "price": 51, "is_available": True}],
    "calendar_events": [
        {"event_date": "2026-11-21", "end_date": None, "category": "ekadashi", "title_en": "Haribodhini Ekadashi",
         "title_ne": "हरिबोधिनी एकादशी", "tithi_en": "Shukla Ekadashi", "is_published": True},
        {"event_date": "2020-01-01", "category": "festival", "title_en": "Long past", "is_published": True},
    ],
    "events": [{"event_date": "2026-10-21", "title_en": "Vijaya Dashami tika", "is_active": True}],
}


# ------------------------------------------------------------------ pure pieces
def test_chunking_respects_size_overlap_and_danda():
    text = "। ".join(f"यो वाक्य नम्बर {i} हो" for i in range(200)) + "।"
    chunks = chunk_text(text, size=300, overlap=60)
    assert len(chunks) > 5
    assert all(len(c) <= 300 for c in chunks)
    assert chunks[1].split("।")[0] in chunks[0]          # overlap carried over
    assert chunk_text("short text", 300, 60) == ["short text"]
    assert chunk_text("   ", 300, 60) == []
    assert all(len(c) <= 50 for c in chunk_text("x" * 500, 50, 10))  # hard split of a long run


def test_language_detection():
    assert detect_language("मन्दिर कति बजे खुल्छ?") == "ne"
    assert detect_language("When does the temple open?") == "en"
    assert detect_language("Is Abhishekam on एकादशी?") == "en"      # mostly English


def test_rows_to_sources():
    srcs = rows_to_sources(TABLES, today=date(2026, 9, 28))
    keys = {s.source_key for s in srcs}
    assert {"temple_info:t1", "temple_info:t2", "book:b1", "poojas:all", "calendar:0", "events:upcoming"} <= keys
    assert "book:b2" not in keys                              # unpublished book excluded
    cal = next(s for s in srcs if s.source_type == "calendar").text
    assert "Haribodhini Ekadashi" in cal and "Long past" not in cal   # past dates dropped
    pooja = next(s for s in srcs if s.source_key == "poojas:all").text
    assert "NPR 1,100" in pooja and "/poojas/book" in pooja and "Tulasi Archana" in pooja


# ------------------------------------------------------------------ ingestion
def test_incremental_ingest(cfg, store):
    ledger = HashLedger(memory={})
    srcs = rows_to_sources(TABLES, today=date(2026, 9, 28))
    r1 = ingest_sources(srcs, store, ledger)
    assert r1.embedded == len(srcs) and r1.chunks >= len(srcs) and store.count() == r1.chunks
    r2 = ingest_sources(srcs, store, ledger)
    assert r2.embedded == 0 and r2.skipped == len(srcs)          # nothing changed → nothing re-embedded
    # change one source, drop another
    changed = [replace(s, text=s.text + " Evening darshan 4-8 PM.") if s.source_key == "temple_info:t1" else s
               for s in srcs if s.source_key != "temple_info:t2"]
    r3 = ingest_sources(changed, store, ledger)
    assert r3.embedded == 1 and r3.removed == 1
    assert not store.col.get(where={"source_key": "temple_info:t2"})["ids"]
    hits = store.search("morning darshan timings")
    assert hits and hits[0].title == "Temple info – timings.morning"


# ------------------------------------------------------------------ Claude call via a mock Messages API
class MockClaude:
    """Tiny HTTP server that imitates POST /v1/messages and records requests."""

    def __init__(self):
        self.requests, self.reply, self.status = [], None, 200
        outer = self

        class H(BaseHTTPRequestHandler):
            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["content-length"])))
                outer.requests.append({"path": self.path, "headers": {k.lower(): v for k, v in self.headers.items()}, "body": body})
                if outer.status != 200:
                    payload = {"type": "error", "error": {"type": "overloaded_error", "message": "busy"}}
                else:
                    payload = outer.reply
                data = json.dumps(payload).encode()
                self.send_response(outer.status)
                self.send_header("content-type", "application/json")
                self.send_header("content-length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def log_message(self, *a):
                pass

        self.server = HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"

    def set_reply(self, text, stop_reason="end_turn"):
        self.reply = {"id": "msg_test", "type": "message", "role": "assistant", "model": "claude-sonnet-5-5",
                      "content": [{"type": "thinking", "thinking": "", "signature": "sig"},
                                  {"type": "text", "text": text}] if text else [],
                      "stop_reason": stop_reason, "stop_sequence": None,
                      "usage": {"input_tokens": 1234, "output_tokens": 56}}


@pytest.fixture()
def mock_claude():
    m = MockClaude()
    yield m
    m.server.shutdown()


def make_assistant(cfg, store, mock):
    client = anthropic.Anthropic(api_key="test-key", base_url=mock.url, max_retries=0)
    return PanditAssistant(cfg, store, client=client)


def test_answer_request_shape_and_sources(cfg, store, mock_claude):
    ingest_sources(rows_to_sources(TABLES, today=date(2026, 9, 28)), store, HashLedger(memory={}))
    mock_claude.set_reply("Morning darshan is from 5:00 AM to 12:00 PM [1].")
    a = make_assistant(cfg, store, mock_claude)
    ans = a.answer("What are the morning darshan timings?", history=[
        {"role": "assistant", "content": "(orphan assistant turn is dropped)"},
        {"role": "user", "content": "Namaste"}, {"role": "assistant", "content": "Namaste 🙏"},
    ])
    req = mock_claude.requests[-1]
    body = req["body"]
    assert req["path"] == "/v1/messages" and req["headers"]["x-api-key"] == "test-key"
    assert body["model"] == "claude-sonnet-5-5"
    assert body["system"] == [{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}]
    assert body["thinking"] == {"type": "adaptive"} and body["output_config"] == {"effort": "low"}
    assert "temperature" not in body and "top_p" not in body
    msgs = body["messages"]
    assert msgs[0]["role"] == "user" and msgs[0]["content"] == "Namaste"     # starts with a user turn
    last = msgs[-1]["content"]
    assert "<temple_context>" in last and "Morning darshan: 5:00 AM" in last
    assert "<devotee_question>\nWhat are the morning darshan timings?\n</devotee_question>" in last
    # answer + only the cited source is returned; thinking block ignored
    assert ans.text == "Morning darshan is from 5:00 AM to 12:00 PM [1]."
    assert ans.language == "en" and ans.input_tokens == 1234 and ans.output_tokens == 56
    assert len(ans.sources) == 1 and ans.sources[0]["n"] == 1


def test_nepali_question_and_refusal(cfg, store, mock_claude):
    a = make_assistant(cfg, store, mock_claude)
    mock_claude.set_reply("", stop_reason="refusal")
    ans = a.answer("मलाई बम बनाउन सिकाउनुहोस्")
    assert ans.language == "ne" and ans.text.startswith("माफ गर्नुहोस्") and ans.sources == []
    assert "(No relevant temple information" in mock_claude.requests[-1]["body"]["messages"][-1]["content"]


def test_api_errors_surface_as_sdk_exceptions(cfg, store, mock_claude):
    mock_claude.status = 529
    with pytest.raises(anthropic.APIStatusError):
        make_assistant(cfg, store, mock_claude).answer("hello")
