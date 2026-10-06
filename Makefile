# Shortcuts for the common Docker commands.
#
#   make help      list every target
#   make up        start the website and API
#   make ingest    rebuild the AI knowledge base
#
# Every target is a thin wrapper — the raw `docker compose` command is printed
# so you can see what it does and run it yourself if you prefer.
#
# Windows: `make` is not installed by default. Either use the raw commands from
# MANUAL_STEPS_V2.md § I, or install it:  winget install ezwinports.make

COMPOSE      ?= docker compose
PROD_COMPOSE ?= docker compose -f docker-compose.yml -f docker-compose.prod.yml
# Set PY=python if `python3` isn't on your PATH (usually the case on Windows).
PY           ?= python3

.DEFAULT_GOAL := help
.PHONY: help up down logs ingest smoke fmt test build ps restart clean prod-up prod-down prod-logs

help: ## List the available targets
	@echo "Temple platform — make targets:"
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# ------------------------------------------------------------------ everyday
up: ## Start the website and API in the background
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  Website  http://localhost:3000"
	@echo "  API      http://localhost:8000/docs"
	@echo ""
	@echo "  Logs: make logs   ·   Stop: make down"
	@echo "  First run? Build the AI index with: make ingest"

down: ## Stop everything (the AI index is kept)
	$(COMPOSE) down

logs: ## Follow the logs of every service (Ctrl+C to stop watching)
	$(COMPOSE) logs -f

ps: ## Show what is running
	$(COMPOSE) ps

restart: ## Restart without rebuilding
	$(COMPOSE) restart

build: ## Rebuild the images without starting them
	$(COMPOSE) build

# ------------------------------------------------------------------- the AI
ingest: ## Rebuild the AI knowledge base (run after changing temple content)
	$(COMPOSE) run --rm ingest

ingest-force: ## Re-embed every source, even unchanged ones
	$(COMPOSE) run --rm ingest --force

smoke: ## Ask the live assistant 3 test questions (needs GOOGLE_API_KEY)
	$(COMPOSE) run --rm --entrypoint python ingest scripts/smoke_chat.py

evals: ## Run the 40-case eval suite offline (no API key needed)
	$(COMPOSE) run --rm --entrypoint python ingest evals/run_evals.py --offline

# -------------------------------------------------------------- development
# These run on the host, not in Docker, because they need the dev dependencies
# (pytest, eslint) that the production images deliberately leave out.
test: ## Run the Python test suites and the frontend checks
	@echo "==> backend tests"
	cd backend && $(PY) -m pytest -q
	@echo "==> RAG tests"
	@# Run separately: both test folders are packages named `tests`, so
	@# collecting them in one pytest invocation would clash on that name.
	cd backend && $(PY) -m pytest ../ai-services/tests -q
	@echo "==> frontend typecheck + lint"
	cd frontend && npx tsc --noEmit && npx eslint src

fmt: ## Auto-fix what can be auto-fixed (eslint; ruff if installed)
	cd frontend && npx eslint src --fix
	@command -v ruff >/dev/null 2>&1 \
	  && (echo "==> ruff format" && ruff format backend/app ai-services/temple_rag ai-services/evals) \
	  || echo "==> ruff not installed; skipping Python formatting (pip install ruff)"

# -------------------------------------------------------------- production
prod-up: ## Start with the production overlay (no published ports)
	$(PROD_COMPOSE) up -d --build

prod-down: ## Stop the production stack
	$(PROD_COMPOSE) down

prod-logs: ## Follow the production logs
	$(PROD_COMPOSE) logs -f

# ------------------------------------------------------------------ cleanup
clean: ## Remove the containers AND DELETE the AI index (needs a re-ingest)
	@echo "This deletes the chroma_data volume. The index must be rebuilt afterwards."
	@printf "Type 'yes' to continue: " && read ans && [ "$$ans" = "yes" ]
	$(COMPOSE) down -v
