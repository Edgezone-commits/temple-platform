r"""
Ask the live agent three questions and print what it did. A quick "is the chat
actually working?" check after setting up a key or changing the knowledge base.

    cd backend
    venv\Scripts\activate                     # or: source venv/bin/activate
    python ../ai-services/scripts/smoke_chat.py

Needs GOOGLE_API_KEY (and, for the database tools, SUPABASE_URL and
SUPABASE_SERVICE_KEY) in backend/.env or ai-services/.env, and a knowledge base
built by scripts/ingest.py.

Exits 0 when all three behaved as expected, non-zero otherwise, so it can be
used as a deployment gate. This calls the real Gemini API, which costs a few
tokens per run.
"""
import argparse
import logging
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(HERE.parent / "backend" / ".env")

from temple_rag.assistant import PanditAssistant  # noqa: E402
from temple_rag.config import load_config  # noqa: E402
from temple_rag.store import KnowledgeStore  # noqa: E402

# (question, what we expect, must the agent refuse?)
CASES = [
    ("What time is morning aarti?", "en", False),
    ("भोलि कुन पर्व छ?", "ne", False),
    ("Who won the World Cup last year?", "en", True),
]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-v", "--verbose", action="store_true", help="show the agent's INFO logs")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING, format="  %(message)s")

    cfg = load_config()
    if not cfg.google_api_key:
        print("GOOGLE_API_KEY is not set. Get one at https://aistudio.google.com/apikey")
        return 2

    store = KnowledgeStore(cfg)
    if store.count() == 0:
        print("The knowledge base is empty. Run: python ../ai-services/scripts/ingest.py")
        return 2

    print(f"model={cfg.gemini_model}  index={store.count()} chunks\n")
    agent = PanditAssistant(cfg, store)
    failures = []

    for question, want_lang, want_refusal in CASES:
        print("=" * 72)
        print(f"Q ({want_lang}): {question}")
        try:
            ans = agent.answer(question, locale_hint=want_lang)
        except Exception as e:
            print(f"  RAISED {type(e).__name__}: {e}")
            failures.append(f"{question!r} raised {type(e).__name__}")
            continue

        tools = [t["tool"] for t in ans.tool_trace] or ["(none)"]
        print(f"A: {ans.text}")
        print(f"  language : {ans.language} (wanted {want_lang})")
        print(f"  sources  : {[s['title'] for s in ans.sources] or '(none)'}")
        print(f"  tools    : {tools}  in {ans.tool_rounds} round(s)")
        print(f"  tokens   : in={ans.input_tokens} out={ans.output_tokens}")
        print(f"  stop     : {ans.stop_reason or '(normal)'}")

        if ans.language != want_lang:
            failures.append(f"{question!r} answered in {ans.language}, wanted {want_lang}")
        if want_refusal:
            # An off-topic question must not come back with temple facts.
            if ans.stop_reason not in ("off_topic", "prompt_injection", "ungrounded") and ans.sources:
                failures.append(f"{question!r} should have been refused, but cited sources")
        else:
            if not ans.text.strip():
                failures.append(f"{question!r} produced an empty answer")
            if ans.tool_rounds == 0:
                failures.append(f"{question!r} answered without calling any tool")

    print("=" * 72)
    if failures:
        print(f"FAILED ({len(failures)}):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("All three behaved as expected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
