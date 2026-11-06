from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: bool = False
    priority: str = "medium"
    folder_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    priority: Optional[str] = None
    folder_id: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)