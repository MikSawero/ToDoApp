from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.folder import Folder
from app.schemas.folder import FolderCreate, FolderUpdate

def get_folder(db: Session, folder_id: int, user_id: int) -> Optional[Folder]:
    return db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()

def get_folders_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Folder]:
    return db.query(Folder).filter(Folder.user_id == user_id).offset(skip).limit(limit).all()

def create_user_folder(db: Session, folder_in: FolderCreate, user_id: int) -> Folder:
    db_folder = Folder(**folder_in.model_dump(), user_id=user_id)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

def delete_folder(db: Session, db_folder: Folder) -> Folder:
    db.delete(db_folder)
    db.commit()
    return db_folder