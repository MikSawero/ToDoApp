from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app import crud

router = APIRouter()

@router.get("/", response_model=List[EventResponse])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    user_id = 1
    events = crud.get_events_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return events

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    user_id = 1
    return crud.create_user_event(db=db, event_in=event_in, user_id=user_id)

@router.get("/{event_id}", response_model=EventResponse)
def read_event(event_id: int, db: Session = Depends(get_db)):
    user_id = 1
    event = crud.get_event(db, event_id=event_id, user_id=user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event_in: EventUpdate, db: Session = Depends(get_db)):
    user_id = 1
    event = crud.get_event(db, event_id=event_id, user_id=user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return crud.update_event(db=db, db_event=event, event_in=event_in)

@router.delete("/{event_id}", response_model=EventResponse)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    user_id = 1
    event = crud.get_event(db, event_id=event_id, user_id=user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return crud.delete_event(db=db, db_event=event)