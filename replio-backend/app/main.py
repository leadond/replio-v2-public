from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.database import engine
from app.core.config import settings
from sqlmodel import SQLModel
from app.routers import health, auth, callers, conversations, signalwire, elevenlabs, dashboard, ollama, audit, phase4_features, local_ai, plivo
from app.routers import settings as settings_router
from app.routers.signalwire import calls_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup.")
    # Create all tables
    SQLModel.metadata.create_all(engine)
    print("Database tables initialized.")
    yield
    print("Shutdown complete.")

app = FastAPI(
    title="Replio API",
    description="AI Auto-Attendant Platform",
    version="2.0.0",
    lifespan=lifespan,
)

# allow_credentials=True is incompatible with a "*" origin - browsers reject the
# combination - so only send credentials when origins are explicitly listed.
_cors_origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(callers.router)
app.include_router(conversations.router)
app.include_router(signalwire.router)
app.include_router(calls_router)
app.include_router(elevenlabs.router)
app.include_router(dashboard.router)
app.include_router(settings_router.router)
app.include_router(ollama.router)
app.include_router(audit.router)
app.include_router(phase4_features.router)
app.include_router(local_ai.router)
app.include_router(plivo.router)

@app.get("/api/")
async def root():
    return {"name": "Replio API", "version": "2.0.0", "status": "operational"}
