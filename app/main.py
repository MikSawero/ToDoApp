from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from sqlalchemy import text
from app.api.v1.api import api_router
from app.db.session import Base, engine

import app.models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

app.mount("/static", StaticFiles(directory="frontend"), name="static")

Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time VARCHAR"))
    conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT FALSE"))

@app.get("/")
def root():
    return RedirectResponse(url="/static/login.html")