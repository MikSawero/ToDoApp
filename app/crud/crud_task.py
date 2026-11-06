from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

def get_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()

def get_tasks_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
    return db.query(Task).filter(Task.user_id == user_id).offset(skip).limit(limit).all()

def create_user_task(db: Session, task_in: TaskCreate, user_id: int) -> Task:
    db_task = Task(
        **task_in.model_dump(),
        user_id=user_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, db_task: Task, task_in: TaskUpdate) -> Task:
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, db_task: Task) -> Task:
    db.delete(db_task)
    db.commit()
    return db_task