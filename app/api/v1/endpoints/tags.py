from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.tag import TagCreate, TagResponse
from app import crud

router = APIRouter()

@router.get("/", response_model=List[TagResponse])
def read_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    user_id = 1 
    tags = crud.get_tags_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return tags

@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(tag_in: TagCreate, db: Session = Depends(get_db)):
    user_id = 1
    return crud.create_user_tag(db=db, tag_in=tag_in, user_id=user_id)

@router.get("/{tag_id}", response_model=TagResponse)
def read_tag(tag_id: int, db: Session = Depends(get_db)):
    user_id = 1
    tag = crud.get_tag(db, tag_id=tag_id, user_id=user_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

@router.delete("/{tag_id}", response_model=TagResponse)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    user_id = 1
    tag = crud.get_tag(db, tag_id=tag_id, user_id=user_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return crud.delete_tag(db=db, db_tag=tag)