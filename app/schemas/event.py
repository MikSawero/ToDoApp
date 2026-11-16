from typing import Optional
from pydantic import BaseModel

class EventBase(BaseModel):
    title: str
    date: str
    time: Optional[str] = "12:00"
    category: Optional[str] = "meeting"
    description: Optional[str] = None
    folder_id: Optional[int] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    folder_id: Optional[int] = None

class EventResponse(EventBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True