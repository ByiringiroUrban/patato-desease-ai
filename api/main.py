from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.prediction import router as prediction_router
from api.routes.auth import router as auth_router
from api.routes.admin import router as admin_router
from api.database import engine
from api.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Potato Disease AI API",
    version="1.0.0",
    description="Image classification API for potato leaf disease detection.",
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

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(prediction_router, prefix="/api/v1/predictions")
app.include_router(admin_router, prefix="/api/v1/admin")

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Error: {str(exc)}"},
    )


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
