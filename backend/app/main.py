"""
Shree Laxminarayan Mandir - FastAPI Application
Main entry point for the backend API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Backend API for Shree Laxminarayan Mandir, Hetauda, Nepal",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Jai Shree Laxminarayan! 🙏",
        "temple": "Shree Laxminarayan Mandir",
        "location": "Hetauda, Nepal",
        "tradition": "Sri Vaishnava Totadri",
        "api_docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
