from typing import Optional
from pydantic import BaseModel, Field, model_validator

class EventBase(BaseModel):
    title: str
    date: str
    time: Optional[str] = "12:00"
    end_time: Optional[str] = "13:00"
    is_all_day: Optional[bool] = False
    category: Optional[str] = "meeting"
    description: Optional[str] = None
    folder_id: Optional[int] = None

class EventCreate(EventBase):
    title: str = Field(..., max_length=50)
    description: Optional[str] = Field(default=None, max_length=300)

    @model_validator(mode="after")
    def check_time_order(self):
        if not self.is_all_day and self.time and self.end_time and self.end_time <= self.time:
            raise ValueError("End time must be later than start time")
        return self

class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=50)
    date: Optional[str] = None
    time: Optional[str] = None
    end_time: Optional[str] = None
    is_all_day: Optional[bool] = None
    category: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=300)
    folder_id: Optional[int] = None

    @model_validator(mode="after")
    def check_time_order(self):
        if not self.is_all_day and self.time and self.end_time and self.end_time <= self.time:
            raise ValueError("End time must be later than start time")
        return self

class EventResponse(EventBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True