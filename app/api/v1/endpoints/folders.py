from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.folder import FolderCreate, FolderResponse
from app import crud

router = APIRouter()

@router.get("/", response_model=List[FolderResponse])
def read_folders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    user_id = 1
    folders = crud.get_folders_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return folders

@router.post("/", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(folder_in: FolderCreate, db: Session = Depends(get_db)):
    user_id = 1
    return crud.create_user_folder(db=db, folder_in=folder_in, user_id=user_id)

@router.get("/{folder_id}", response_model=FolderResponse)
def read_folder(folder_id: int, db: Session = Depends(get_db)):
    user_id = 1
    folder = crud.get_folder(db, folder_id=folder_id, user_id=user_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@router.delete("/{folder_id}", response_model=FolderResponse)
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    user_id = 1
    folder = crud.get_folder(db, folder_id=folder_id, user_id=user_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return crud.delete_folder(db=db, db_folder=folder)