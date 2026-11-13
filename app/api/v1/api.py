from fastapi import APIRouter
from app.api.v1.endpoints import auth, tasks, users, events, notes, tags, folders

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(notes.router, prefix="/notes", tags=["Notes"])
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
api_router.include_router(folders.router, prefix="/folders", tags=["Folders"])