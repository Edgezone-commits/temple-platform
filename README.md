<<<<<<< HEAD
# 🙏 Shree Laxminarayan Mandir — Temple Platform

Official website and management platform for **Shree Laxminarayan Mandir**, Hetauda, Nepal.
Following the **Sri Vaishnava Totadri** tradition.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Gemini API + LangChain + ChromaDB |
| Deploy | Vercel + Render |

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # Fill in values
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local    # Fill in values
npm run dev
```

### AI Services
```bash
cd ai-services
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Place temple PDFs in knowledge_base/
python scripts/ingest.py
```

## Project Structure
```
temple-platform/
├── frontend/        # Next.js app
├── backend/         # FastAPI API
├── ai-services/     # RAG engine + knowledge base
├── scripts/         # Utility scripts
├── tests/           # Test files
└── docs/            # Documentation
```

## License
Private — Shree Laxminarayan Mandir, Hetauda, Nepal
=======
# temple-platform
>>>>>>> 484a25e72bcb21b950c3268963faeff0ed0df2f4
