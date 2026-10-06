# The FastAPI backend, plus the temple_rag package it imports.
#
# Build context is the REPO ROOT, not backend/ — because backend/requirements.txt
# installs its sibling with `-e ../ai-services`, which only resolves if both
# folders are present. docker-compose.yml sets `context: .` for this reason.
#
#   docker build -f backend/Dockerfile -t temple-backend .
#
# Layout inside the image mirrors the repo, so CHROMA_PERSIST_DIR and the
# editable install resolve to the same paths they do in development:
#   /app/backend       the FastAPI app
#   /app/ai-services   the temple_rag package (+ chroma_db mount point)
#   /opt/venv          the virtualenv

# ---------------------------------------------------------------- builder
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# build-essential is needed by a few wheels that still compile from source.
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only what pip needs first, so a code change doesn't reinstall PyTorch.
WORKDIR /app
COPY backend/requirements.txt          backend/requirements.txt
COPY ai-services/pyproject.toml        ai-services/pyproject.toml
COPY ai-services/requirements.txt      ai-services/requirements.txt
COPY ai-services/temple_rag/__init__.py ai-services/temple_rag/__init__.py

WORKDIR /app/backend
RUN pip install --upgrade pip && pip install -r requirements.txt

# ---------------------------------------------------------------- runtime
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH" \
    # sentence-transformers caches the embedding model here. Mounted as a
    # volume in compose so the ~470 MB download happens once, not per rebuild.
    HF_HOME=/app/.cache/huggingface

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
# temple_rag was installed editable, so its source must exist at this exact
# path at runtime too — the .pth file in the venv points here.
COPY ai-services/ ai-services/
COPY backend/     backend/

# Drop privileges. Nothing in the image needs root, and the chat endpoint is
# reachable by anyone on the internet.
RUN useradd --create-home --uid 10001 temple \
 && mkdir -p /app/.cache/huggingface /app/ai-services/chroma_db \
 && chown -R temple:temple /app
USER temple

WORKDIR /app/backend
EXPOSE 8000

# No curl in python:slim, and installing it just for this would be waste.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD python -c "import sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"

# 2 workers suits a small VPS. Note the in-memory chat rate limiter counts per
# worker, so the effective limit is CHAT_PER_MINUTE x workers; see the comment
# on RateLimiter in app/routers/chat.py.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
