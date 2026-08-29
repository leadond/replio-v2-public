from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine
from app.core.config import settings
from sqlmodel import SQLModel
from app.routers import health, auth, callers, conversations, signalwire, elevenlabs

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    print("Database tables ensured.")
    yield
    print("Shutdown complete.")

app = FastAPI(
    title="Replio API",
    description="AI Auto-Attendant Platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(callers.router)
app.include_router(conversations.router)
app.include_router(signalwire.router)
app.include_router(elevenlabs.router)

@app.get("/")
async def root():
    return {"name": "Replio API", "version": "2.0.0", "status": "operational"}
