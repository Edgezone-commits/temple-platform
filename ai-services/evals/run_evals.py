r"""
Run every case in cases.jsonl through the agent and score it.

    cd backend
    venv\Scripts\activate                      # or: source venv/bin/activate

    # offline: no API key, no network, no cost. Tests the harness and the
    # graph, NOT Gemini's judgement.
    python ../ai-services/evals/run_evals.py --offline

    # online: the real thing. Needs GOOGLE_API_KEY.
    python ../ai-services/evals/run_evals.py

Writes evals/results/latest.json and evals/results/latest.md.

What the numbers mean
--------------------
  tool selection    did the agent call the tool(s) the case expects?
  answer contains   did every must_contain item appear in the answer?
  refusal           should_refuse cases that refused, AND normal cases that
                    were NOT wrongly refused (both directions are reported)
  citation rate     share of non-refusal answers carrying at least one source
  latency / tokens  mean per case

IMPORTANT: --offline substitutes a keyword-matching stand-in for Gemini
(temple_rag.fake_model.KeywordChatModel). Its tool choice is a hand-written
rule, so an offline tool-selection score says nothing about how well Gemini
chooses. Only an online run measures that. Never quote offline numbers as if
they were the agent's real accuracy.
"""
from __future__ import annotations

import argparse
import json
import logging
import random
import re
import statistics
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
AI_DIR = HERE.parent
sys.path.insert(0, str(AI_DIR))
sys.path.insert(0, str(HERE))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(AI_DIR.parent / "backend" / ".env")

from seed_fixture import FakeSupabase, tables  # noqa: E402

from temple_rag.assistant import NO_INFO_REPLY, REFUSAL_REPLY, PanditAssistant  # noqa: E402
from temple_rag.config import RagConfig, load_config  # noqa: E402
from temple_rag.ingest import HashLedger, ingest_sources  # noqa: E402
from temple_rag.sources import rows_to_sources  # noqa: E402
from temple_rag.store import KnowledgeStore  # noqa: E402

log = logging.getLogger("evals")

RESULTS = HERE / "results"
REFUSAL_TEXTS = set(REFUSAL_REPLY.values()) | set(NO_INFO_REPLY.values())
REFUSAL_STOPS = {"off_topic", "prompt_injection", "empty", "too_long", "ungrounded", "tool_round_cap"}


# --------------------------------------------------------------------- scoring
def normalise(text: str) -> str:
    """
    Fold the differences that shouldn't count as a wrong answer.

    Drops the thousands separators a model may or may not write (so a case can
    ask for "1100" and match "NPR 1,100"), collapses whitespace, and lowercases.
    Devanagari digits are NOT transliterated — a case that accepts either form
    lists both spellings as alternatives.
    """
    return re.sub(r"\s+", " ", text.replace(",", "").replace(" ", " ")).strip().lower()


def contains(answer: str, item) -> bool:
    """`item` is a string, or a list of alternatives of which any one counts."""
    hay = normalise(answer)
    needles = item if isinstance(item, list) else [item]
    return any(normalise(str(n)) in hay for n in needles)


def tool_matches(expected, called: list[str]) -> bool:
    """Each expected entry is a tool name, or a list of acceptable names."""
    for want in expected:
        options = want if isinstance(want, list) else [want]
        if not any(o in called for o in options):
            return False
    return True


def is_refusal(answer_text: str, stop_reason: str) -> bool:
    return answer_text.strip() in REFUSAL_TEXTS or stop_reason in REFUSAL_STOPS


@dataclass
class CaseResult:
    id: str
    group: str
    question: str
    locale: str
    answer: str = ""
    expected_tools: list = field(default_factory=list)
    tools_called: list = field(default_factory=list)
    tool_trace: list = field(default_factory=list)
    tool_rounds: int = 0
    sources: int = 0
    latency_ms: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    stop_reason: str = ""
    refused: bool = False
    should_refuse: bool = False
    missing: list = field(default_factory=list)
    ok_tools: bool = False
    ok_contains: bool = False
    ok_refusal: bool = False
    error: str = ""

    @property
    def passed(self) -> bool:
        return self.ok_tools and self.ok_contains and self.ok_refusal and not self.error


def score(case: dict, result: CaseResult) -> CaseResult:
    result.should_refuse = bool(case.get("should_refuse"))
    result.refused = is_refusal(result.answer, result.stop_reason)

    if result.should_refuse:
        # A refusal needs no tool and no content check.
        result.ok_refusal = result.refused
        result.ok_tools = True
        result.ok_contains = True
        return result

    result.ok_refusal = not result.refused          # a wrongful refusal is a failure
    result.ok_tools = tool_matches(case.get("expected_tools") or [], result.tools_called)
    result.missing = [m for m in (case.get("must_contain") or [])
                      if not contains(result.answer, m)]
    result.ok_contains = not result.missing
    return result


# ------------------------------------------------------------------- the runner
def build_agent(offline: bool, cfg: RagConfig):
    """Returns (agent, note). Offline swaps in the stand-in model and database."""
    store = KnowledgeStore(cfg)
    fake_sb = None
    note = ""

    if offline:
        from temple_rag.fake_model import KeywordChatModel
        # Index the seed fixture so search_temple_knowledge has something to find.
        if store.count() == 0:
            ingest_sources(rows_to_sources(tables()), store, HashLedger(memory={}))
        fake_sb = FakeSupabase()
        agent = PanditAssistant(cfg, store, model=KeywordChatModel(), supabase=fake_sb)
        note = ("OFFLINE: Gemini replaced by a keyword-matching stand-in and Supabase by an "
                "in-memory fixture. Tool-selection numbers reflect a hand-written rule, "
                "not the model.")
    else:
        if not cfg.google_api_key:
            print("GOOGLE_API_KEY is not set. Either export it, or run with --offline.")
            sys.exit(2)
        if store.count() == 0:
            print("The knowledge base is empty. Run: python ../ai-services/scripts/ingest.py")
            sys.exit(2)
        agent = PanditAssistant(cfg, store)
        note = f"ONLINE: {cfg.gemini_model}, index={store.count()} chunks."
    return agent, note


def ask_with_backoff(agent, case: dict, attempts: int, pause: float) -> tuple[object, int, str]:
    """
    Ask once, retrying on a rate limit.

    Gemini's free tier limits requests per minute, and a 40-case sweep will hit
    it, so a 429 is an expected part of a normal run rather than a failure.
    """
    delay = pause
    last = ""
    for attempt in range(1, attempts + 1):
        started = time.perf_counter()
        try:
            ans = agent.answer(case["question"], locale_hint=case.get("locale", "en"))
            return ans, int((time.perf_counter() - started) * 1000), ""
        except Exception as e:
            last = f"{type(e).__name__}: {e}"
            code = getattr(e, "code", None)
            retryable = code in (429, 500, 503) or "429" in str(e) or "quota" in str(e).lower()
            if not retryable or attempt == attempts:
                return None, int((time.perf_counter() - started) * 1000), last
            wait = delay + random.uniform(0, 0.5)     # jitter, so retries don't sync up
            log.warning("  rate limited, waiting %.1fs (attempt %s/%s)", wait, attempt, attempts)
            time.sleep(wait)
            delay *= 2
    return None, 0, last


def run(cases: list[dict], agent, pause: float, attempts: int) -> list[CaseResult]:
    results = []
    for i, case in enumerate(cases, 1):
        r = CaseResult(id=case["id"], group=case.get("group", ""), question=case["question"],
                       locale=case.get("locale", "en"),
                       expected_tools=case.get("expected_tools") or [])
        ans, ms, err = ask_with_backoff(agent, case, attempts, pause)
        r.latency_ms = ms
        if ans is None:
            r.error = err
        else:
            r.answer = ans.text
            r.tool_trace = ans.tool_trace
            r.tools_called = [t["tool"] for t in ans.tool_trace]
            r.tool_rounds = ans.tool_rounds
            r.sources = len(ans.sources)
            r.input_tokens, r.output_tokens = ans.input_tokens, ans.output_tokens
            r.stop_reason = ans.stop_reason
        results.append(score(case, r))
        mark = "ok  " if r.passed else "FAIL"
        print(f"  [{i:>2}/{len(cases)}] {mark} {r.id:<28} {ms:>6}ms  tools={r.tools_called or '-'}")
        if pause and i < len(cases):
            time.sleep(pause)
    return results


# --------------------------------------------------------------------- reporting
def summarise(results: list[CaseResult], note: str, offline: bool) -> dict:
    total = len(results)
    normal = [r for r in results if not r.should_refuse]
    refusals = [r for r in results if r.should_refuse]
    ok = [r for r in results if not r.error]

    def pct(n, d):
        return round(100.0 * n / d, 1) if d else None

    wrongful = [r for r in normal if r.refused]
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "mode": "offline" if offline else "online",
        "note": note,
        "cases": total,
        "errored": sum(1 for r in results if r.error),
        "passed": sum(1 for r in results if r.passed),
        "pass_rate_pct": pct(sum(1 for r in results if r.passed), total),
        "tool_selection_pct": pct(sum(1 for r in normal if r.ok_tools), len(normal)),
        "answer_contains_pct": pct(sum(1 for r in normal if r.ok_contains), len(normal)),
        "refused_when_expected_pct": pct(sum(1 for r in refusals if r.refused), len(refusals)),
        "wrongful_refusals": len(wrongful),
        "wrongful_refusal_ids": [r.id for r in wrongful],
        "citation_rate_pct": pct(sum(1 for r in normal if r.sources > 0), len(normal)),
        "avg_latency_ms": int(statistics.fmean([r.latency_ms for r in ok])) if ok else None,
        "avg_input_tokens": int(statistics.fmean([r.input_tokens for r in ok])) if ok else None,
        "avg_output_tokens": int(statistics.fmean([r.output_tokens for r in ok])) if ok else None,
        "avg_tool_rounds": round(statistics.fmean([r.tool_rounds for r in ok]), 2) if ok else None,
        "by_group": {},
    }
    for g in sorted({r.group for r in results}):
        rows = [r for r in results if r.group == g]
        summary["by_group"][g] = {"cases": len(rows),
                                  "passed": sum(1 for r in rows if r.passed),
                                  "pass_rate_pct": pct(sum(1 for r in rows if r.passed), len(rows))}
    return summary


def markdown(summary: dict, results: list[CaseResult]) -> str:
    s = summary
    out = [f"# Eval results — {s['mode']}", "",
           f"_Generated {s['generated_at']}._", "", f"> {s['note']}", "",
           "| Metric | Value |", "|---|---|",
           f"| Cases | {s['cases']} |",
           f"| Passed | {s['passed']} ({s['pass_rate_pct']}%) |",
           f"| Tool selection | {s['tool_selection_pct']}% |",
           f"| Answer contains | {s['answer_contains_pct']}% |",
           f"| Refused when it should | {s['refused_when_expected_pct']}% |",
           f"| Wrongful refusals | {s['wrongful_refusals']} |",
           f"| Citation rate | {s['citation_rate_pct']}% |",
           f"| Avg latency | {s['avg_latency_ms']} ms |",
           f"| Avg tokens | {s['avg_input_tokens']} in / {s['avg_output_tokens']} out |",
           f"| Avg tool rounds | {s['avg_tool_rounds']} |",
           f"| Errored | {s['errored']} |", "",
           "## By group", "", "| Group | Cases | Passed | Rate |", "|---|---|---|---|"]
    for g, v in s["by_group"].items():
        out.append(f"| {g} | {v['cases']} | {v['passed']} | {v['pass_rate_pct']}% |")

    failing = [r for r in results if not r.passed]
    out += ["", f"## Failing cases ({len(failing)})", ""]
    if not failing:
        out.append("None.")
    for r in failing:
        why = []
        if r.error:
            why.append(f"errored: {r.error}")
        if not r.ok_tools:
            why.append(f"expected tools {r.expected_tools}, called {r.tools_called or 'none'}")
        if not r.ok_contains:
            why.append(f"answer missing {r.missing}")
        if not r.ok_refusal:
            why.append("should have refused" if r.should_refuse else "refused but should have answered")
        out += [f"### `{r.id}` ({r.group})", "",
                f"- **Q:** {r.question}",
                f"- **A:** {r.answer[:400] or '(none)'}",
                f"- **Why it failed:** {'; '.join(why)}",
                f"- **Tool trace:** `{json.dumps(r.tool_trace, ensure_ascii=False)}`",
                f"- **Stop reason:** `{r.stop_reason or 'normal'}`", ""]
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--offline", action="store_true",
                    help="use the stand-in model and database (no API key, no cost)")
    ap.add_argument("--pause", type=float, default=None,
                    help="seconds between cases (default: 4.0 online, 0 offline) — "
                         "keeps a 40-case run inside the Gemini free-tier rate limit")
    ap.add_argument("--attempts", type=int, default=4, help="tries per case on a 429 (default 4)")
    ap.add_argument("--only", default="", help="run only cases whose id or group contains this")
    ap.add_argument("-v", "--verbose", action="store_true", help="show the agent's INFO logs")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING, format="  %(message)s")
    pause = args.pause if args.pause is not None else (0.0 if args.offline else 4.0)

    cases = [json.loads(line) for line in
             (HERE / "cases.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.only:
        cases = [c for c in cases if args.only in c["id"] or args.only in c.get("group", "")]
    if not cases:
        print("No cases matched.")
        return 2

    cfg = load_config()
    if args.offline:
        # The hash embedder keeps the run fast and download-free; it is not
        # semantic, so retrieval quality here means nothing either.
        cfg = RagConfig(google_api_key="offline", gemini_model="offline-stand-in",
                        embedding_model="hash", chroma_dir=HERE / "results" / "offline_chroma",
                        knowledge_dir=cfg.knowledge_dir, min_similarity=0.05,
                        supabase_url="", supabase_service_key="")

    agent, note = build_agent(args.offline, cfg)
    print(f"{note}\nRunning {len(cases)} case(s), pause={pause}s\n")

    results = run(cases, agent, pause, args.attempts)
    summary = summarise(results, note, args.offline)

    RESULTS.mkdir(parents=True, exist_ok=True)
    (RESULTS / "latest.json").write_text(
        json.dumps({"summary": summary, "results": [asdict(r) for r in results]},
                   ensure_ascii=False, indent=2), encoding="utf-8")
    (RESULTS / "latest.md").write_text(markdown(summary, results), encoding="utf-8")

    print(f"\n{'=' * 70}")
    print(f"mode                   {summary['mode']}")
    print(f"passed                 {summary['passed']}/{summary['cases']} ({summary['pass_rate_pct']}%)")
    print(f"tool selection         {summary['tool_selection_pct']}%")
    print(f"answer contains        {summary['answer_contains_pct']}%")
    print(f"refused when expected  {summary['refused_when_expected_pct']}%")
    print(f"wrongful refusals      {summary['wrongful_refusals']} {summary['wrongful_refusal_ids'] or ''}")
    print(f"citation rate          {summary['citation_rate_pct']}%")
    print(f"avg latency            {summary['avg_latency_ms']} ms")
    print(f"avg tokens             {summary['avg_input_tokens']} in / {summary['avg_output_tokens']} out")
    print(f"errored                {summary['errored']}")
    print(f"{'=' * 70}")
    print(f"Wrote {RESULTS / 'latest.json'} and {RESULTS / 'latest.md'}")

    # Non-zero when anything failed, so CI can gate on it.
    return 0 if summary["passed"] == summary["cases"] else 1


if __name__ == "__main__":
    sys.exit(main())
