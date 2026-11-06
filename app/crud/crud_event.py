from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate

def get_event(db: Session, event_id: int, user_id: int) -> Optional[Event]:
    return db.query(Event).filter(Event.id == event_id, Event.user_id == user_id).first()

def get_events_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Event]:
    return db.query(Event).filter(Event.user_id == user_id).offset(skip).limit(limit).all()

def create_user_event(db: Session, event_in: EventCreate, user_id: int) -> Event:
    db_event = Event(**event_in.model_dump(), user_id=user_id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(db: Session, db_event: Event, event_in: EventUpdate) -> Event:
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, db_event: Event) -> Event:
    db.delete(db_event)
    db.commit()
    return db_event