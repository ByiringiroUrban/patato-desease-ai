from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.prediction import router as prediction_router
from api.database import engine
from api.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Potato Disease AI API",
    version="1.0.0",
    description="Image classification API for potato leaf disease detection.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to your frontend domain in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "potato-disease-ai"}


@app.get("/")
def root():
    return {
        "message": "Potato Disease AI API",
        "docs": "/docs",
        "health": "/health",
    }
