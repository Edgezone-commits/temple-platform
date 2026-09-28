r"""
Build / refresh the "Ask the Pandit" knowledge base.

    cd backend && venv\Scripts\activate          # uses the backend's virtualenv
    python ../ai-services/scripts/ingest.py      # incremental (skips unchanged)
    python ../ai-services/scripts/ingest.py --force   # re-embed everything
    python ../ai-services/scripts/ingest.py --files-only   # knowledge_base/ files only

Reads SUPABASE_URL / SUPABASE_SERVICE_KEY from backend/.env or ai-services/.env.
Re-run after adding books, changing temple info, or yearly calendar updates.
The first run downloads the embedding model (~470 MB) once.
"""
import argparse
import logging
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(HERE.parent / "backend" / ".env")
from temple_rag.config import load_config  # noqa: E402
from temple_rag.ingest import run_ingest  # noqa: E402

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--force", action="store_true", help="re-embed every source even if unchanged")
    ap.add_argument("--files-only", action="store_true", help="only ingest ai-services/knowledge_base files")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    rep = run_ingest(load_config(), force=args.force, include_db=not args.files_only)
    print(f"Done: {rep.embedded} sources embedded ({rep.chunks} chunks), {rep.skipped} unchanged, {rep.removed} removed.")
