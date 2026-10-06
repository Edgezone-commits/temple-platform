"""
A scripted chat model for offline tests and the eval harness's --offline mode.

It is NOT a simulation of Gemini's judgement — it replays a list of replies you
hand it, so it can exercise the graph (routing, tool execution, citation
extraction, the round cap) with no API key, no network and no cost. Anything
that depends on the real model actually choosing well has to be measured
online; see docs/AGENT.md.
"""
from __future__ import annotations

from typing import Any, Iterator, Optional, Sequence

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult


def ai(text: str = "", tool_calls: Sequence[dict] | None = None,
       input_tokens: int = 100, output_tokens: int = 20) -> AIMessage:
    """Build one scripted reply. `tool_calls` items are {name, args}."""
    calls = [{"name": c["name"], "args": c.get("args", {}), "id": f"call_{i}"}
             for i, c in enumerate(tool_calls or [])]
    return AIMessage(
        content=text,
        tool_calls=calls,
        usage_metadata={"input_tokens": input_tokens, "output_tokens": output_tokens,
                        "total_tokens": input_tokens + output_tokens},
    )


def _fresh(message: AIMessage) -> AIMessage:
    """
    A copy with a new id.

    LangGraph's add_messages reducer deduplicates by message id, so handing out
    the same AIMessage object twice would overwrite the first instead of
    appending — which silently shortens the conversation. Emitting a fresh copy
    each time makes `[reply] * 3` behave the way a reader expects.
    """
    return message.model_copy(update={"id": None})


class ScriptedChatModel(BaseChatModel):
    """Returns `replies` in order; repeats the last one once exhausted."""

    replies: list[AIMessage] = []
    calls: list[list[BaseMessage]] = []

    def __init__(self, replies: Sequence[AIMessage] | None = None, **kw: Any):
        super().__init__(replies=list(replies or [ai("(no reply scripted)")]), calls=[], **kw)

    @property
    def _llm_type(self) -> str:
        return "scripted"

    def bind_tools(self, tools: Sequence[Any], **kw: Any):  # type: ignore[override]
        # The script already encodes which tools get called, so binding is a
        # no-op — but it must exist, because the graph calls it.
        return self

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: Optional[list[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kw: Any,
    ) -> ChatResult:
        self.calls.append(list(messages))
        i = min(len(self.calls) - 1, len(self.replies) - 1)
        return ChatResult(generations=[ChatGeneration(message=_fresh(self.replies[i]))])


class KeywordChatModel(ScriptedChatModel):
    """
    Picks a tool from keywords in the question, then answers with a citation.

    Used by the eval harness's --offline mode so the harness itself can be
    tested end to end. Its tool choice is a hand-written rule, so offline
    tool-selection numbers say nothing about how well Gemini chooses.
    """

    RULES: list[tuple[tuple[str, ...], str]] = [
        (("time", "timing", "open", "close", "aarti", "darshan", "address", "phone",
          "contact", "समय", "खुल्", "बन्द", "ठेगाना", "फोन", "सम्पर्क"), "get_temple_info"),
        (("festival", "ekadashi", "purnima", "tomorrow", "today", "calendar", "when is",
          "पर्व", "एकादशी", "पूर्णिमा", "भोलि", "आज", "पात्रो", "कहिले"), "get_calendar_events"),
        (("price", "cost", "how much", "rs", "npr", "duration", "pooja list", "archana",
          "शुल्क", "मूल्य", "कति", "अर्चना"), "get_pooja_info"),
        (("book", "booking", "reserve", "बुक", "आरक्षण"), "get_booking_help"),
    ]

    def _generate(self, messages, stop=None, run_manager=None, **kw) -> ChatResult:
        self.calls.append(list(messages))
        # Second visit in the same question: answer rather than call again.
        already_called = any(getattr(m, "tool_calls", None) for m in messages)
        question = ""
        for m in messages:
            if m.type == "human" and "<devotee_question>" in str(m.content):
                question = str(m.content)
        q = question.lower()

        if not already_called:
            for keywords, name in self.RULES:
                if any(k in q for k in keywords):
                    args: dict = {}
                    if name == "get_calendar_events":
                        from datetime import date, timedelta
                        today = date.today()
                        args = {"date_from": today.isoformat(),
                                "date_to": (today + timedelta(days=30)).isoformat()}
                    elif name == "search_temple_knowledge":
                        args = {"query": q[:80]}
                    elif name == "get_pooja_info":
                        args = {"name_or_keyword": ""}
                    elif name == "get_temple_info":
                        args = {"topic": ""}
                    return ChatResult(generations=[ChatGeneration(
                        message=ai(tool_calls=[{"name": name, "args": args}]))])
            return ChatResult(generations=[ChatGeneration(message=ai(
                tool_calls=[{"name": "search_temple_knowledge", "args": {"query": q[:80]}}]))])

        # Echo the tool output back as the "answer" so must_contain checks can
        # exercise the harness. A citation is added when one was offered.
        tool_text = ""
        for m in reversed(messages):
            if m.type == "tool":
                tool_text = str(m.content)
                break
        cite = " [1]" if "[1]" in tool_text else ""
        return ChatResult(generations=[ChatGeneration(
            message=ai(text=f"{tool_text[:1500]}{cite}"))])
