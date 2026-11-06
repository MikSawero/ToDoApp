from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate

def get_note(db: Session, note_id: int, user_id: int) -> Optional[Note]:
    return db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()

def get_notes_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Note]:
    return db.query(Note).filter(Note.user_id == user_id).offset(skip).limit(limit).all()

def create_user_note(db: Session, note_in: NoteCreate, user_id: int) -> Note:
    db_note = Note(**note_in.model_dump(), user_id=user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def update_note(db: Session, db_note: Note, note_in: NoteUpdate) -> Note:
    update_data = note_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)
    db.commit()
    db.refresh(db_note)
    return db_note

def delete_note(db: Session, db_note: Note) -> Note:
    db.delete(db_note)
    db.commit()
    return db_note