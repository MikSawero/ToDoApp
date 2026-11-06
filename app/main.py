from fastapi import FastAPI
from app.api.v1.api import api_router
from app.db.session import Base, engine

import app.models

app = FastAPI(
    title="Modular FastAPI App",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
Base.metadata.create_all(bind=engine)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Welcome"}