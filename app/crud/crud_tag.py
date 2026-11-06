from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate

def get_tag(db: Session, tag_id: int, user_id: int) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()

def get_tags_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Tag]:
    return db.query(Tag).filter(Tag.user_id == user_id).offset(skip).limit(limit).all()

def create_user_tag(db: Session, tag_in: TagCreate, user_id: int) -> Tag:
    db_tag = Tag(**tag_in.model_dump(), user_id=user_id)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

def delete_tag(db: Session, db_tag: Tag) -> Tag:
    db.delete(db_tag)
    db.commit()
    return db_tag