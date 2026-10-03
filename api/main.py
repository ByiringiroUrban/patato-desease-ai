from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from api.routes.prediction import router as prediction_router
from api.routes.auth import router as auth_router
from api.routes.admin import router as admin_router
from api.routes.projects import router as projects_router
from api.routes.chat import router as chat_router
from api.routes.payments import router as payments_router
from api.database import engine
from api.models import Base

# Ensure uploads directory exists
Path("uploads/leaves").mkdir(parents=True, exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Potato Disease AI API",
    version="2.0.0",
    description="Multimodal LLM & Computer Vision Agronomy API for potato leaf disease detection and treatment.",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static media uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API Routers
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(prediction_router, prefix="/api/v1/predictions")
app.include_router(projects_router, prefix="/api/v1/projects")
app.include_router(chat_router, prefix="/api/v1/chat")
app.include_router(payments_router, prefix="/api/v1/payments")
app.include_router(admin_router, prefix="/api/v1/admin")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Error: {str(exc)}"},
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "potato-disease-ai", "version": "2.0.0"}


@app.get("/")
def root():
    return {
        "message": "Potato Disease AI API — Multimodal Agronomy Engine",
        "docs": "/docs",
        "health": "/health",
    }

