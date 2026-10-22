from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.routers import (
    auth, me, tickets, kb, notifications, events,
    lost_found, fees, exams, documents, announcements,
    people, analytics, assistant, public
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create uploads directory if not exists
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Initialize tables and seed if empty
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database(reset=False)

    yield

app = FastAPI(
    title="Silver Oak Campus Helpdesk API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded attachments
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# Health check
@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "app": "Silver Oak Campus Helpdesk API"}

# Include routers under /api
api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(me.router, prefix=api_prefix)
app.include_router(tickets.router, prefix=api_prefix)
app.include_router(kb.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(events.router, prefix=api_prefix)
app.include_router(lost_found.router, prefix=api_prefix)
app.include_router(fees.router, prefix=api_prefix)
app.include_router(exams.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(announcements.router, prefix=api_prefix)
app.include_router(people.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(assistant.router, prefix=api_prefix)
app.include_router(public.router, prefix=api_prefix)
app.include_router(public.router)  # Also available directly at /public/track/{id}
