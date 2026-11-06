from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app import crud

router = APIRouter()

@router.get("/", response_model=List[NoteResponse])
def read_notes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    user_id = 1
    notes = crud.get_notes_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return notes

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(note_in: NoteCreate, db: Session = Depends(get_db)):
    user_id = 1
    return crud.create_user_note(db=db, note_in=note_in, user_id=user_id)

@router.get("/{note_id}", response_model=NoteResponse)
def read_note(note_id: int, db: Session = Depends(get_db)):
    user_id = 1
    note = crud.get_note(db, note_id=note_id, user_id=user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_in: NoteUpdate, db: Session = Depends(get_db)):
    user_id = 1
    note = crud.get_note(db, note_id=note_id, user_id=user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return crud.update_note(db=db, db_note=note, note_in=note_in)

@router.delete("/{note_id}", response_model=NoteResponse)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    user_id = 1
    note = crud.get_note(db, note_id=note_id, user_id=user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return crud.delete_note(db=db, db_note=note)