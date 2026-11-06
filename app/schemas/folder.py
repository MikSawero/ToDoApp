from typing import Optional
from pydantic import BaseModel, ConfigDict

class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None

class FolderResponse(FolderBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)