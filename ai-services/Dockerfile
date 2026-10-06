# The knowledge-base indexer.
#
# Unlike the other two services this container is NOT a server: it runs the
# ingest script, writes to the shared chroma_db volume, and exits. Run it
# whenever temple content changes:
#
#   docker compose run --rm ingest
#   docker compose run --rm ingest --force        # re-embed everything
#   docker compose run --rm ingest --files-only   # only knowledge_base/ files
#
# Build context is ai-services/ (it has no dependency on its siblings).

# ---------------------------------------------------------------- builder
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app/ai-services

# Two steps on purpose.
#
# Step 1 installs ONLY the dependencies, from a stub package, so this layer is
# keyed on pyproject.toml alone — editing a source file doesn't re-download
# PyTorch. The stub is then uninstalled so site-packages never keeps a
# half-empty temple_rag that could shadow the real one.
COPY pyproject.toml ./
RUN pip install --upgrade pip \
 && mkdir -p temple_rag && touch temple_rag/__init__.py \
 && pip install . \
 && pip uninstall -y temple-rag

# Step 2 installs the real package with --no-deps, so nothing is re-resolved.
COPY . .
RUN pip install --no-deps .

# ---------------------------------------------------------------- runtime
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH" \
    # Shared with the backend via a named volume, so the embedding model is
    # downloaded once by whichever container runs first.
    HF_HOME=/app/.cache/huggingface

COPY --from=builder /opt/venv /opt/venv

# Same path as in the backend image, so CHROMA_PERSIST_DIR means the same
# thing in both and one volume can serve both.
WORKDIR /app/ai-services
COPY . .

RUN useradd --create-home --uid 10001 temple \
 && mkdir -p /app/.cache/huggingface /app/ai-services/chroma_db /app/ai-services/knowledge_base \
 && chown -R temple:temple /app
USER temple

# ENTRYPOINT not CMD, so `docker compose run --rm ingest --force` appends the
# flag to the script instead of replacing the whole command.
ENTRYPOINT ["python", "scripts/ingest.py"]
