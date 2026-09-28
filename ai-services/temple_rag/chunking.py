"""Split long texts into overlapping chunks on sentence boundaries (English + Devanagari)."""
import re

# Sentence ends: . ! ? and the Devanagari danda । / double danda ॥ — or a blank line.
_SENT_SPLIT = re.compile(r"(?<=[.!?।॥])\s+|\n\s*\n")


def normalize(text: str) -> str:
    text = text.replace("\r", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _sentences(text: str, size: int) -> list[str]:
    out = []
    for s in _SENT_SPLIT.split(text):
        s = s.strip()
        while len(s) > size:                 # a single over-long "sentence": hard split
            out.append(s[:size])
            s = s[size:].strip()
        if s:
            out.append(s)
    return out


def chunk_text(text: str, size: int = 900, overlap: int = 150) -> list[str]:
    """
    Greedy packing of sentences into chunks of at most ~`size` characters.
    Each new chunk starts with the previous chunk's last sentences (up to
    `overlap` characters) so a fact split across a boundary stays findable.
    """
    text = normalize(text)
    if not text:
        return []
    if len(text) <= size:
        return [text]

    chunks: list[str] = []
    cur: list[str] = []
    for sent in _sentences(text, size):
        if cur and len(" ".join(cur + [sent])) > size:
            chunks.append(" ".join(cur))
            tail: list[str] = []
            for prev in reversed(cur):          # carry trailing sentences as overlap
                if len(" ".join([prev] + tail)) > overlap:
                    break
                tail.insert(0, prev)
            cur = tail
        cur.append(sent)
    if cur:
        chunks.append(" ".join(cur))
    return chunks
