from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app import crud

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    user_id = 1 
    tasks = crud.get_tasks_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return tasks

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    user_id = 1
    return crud.create_user_task(db=db, task_in=task_in, user_id=user_id)

@router.get("/{task_id}", response_model=TaskResponse)
def read_task(task_id: int, db: Session = Depends(get_db)):
    user_id = 1
    task = crud.get_task(db, task_id=task_id, user_id=user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    user_id = 1
    task = crud.get_task(db, task_id=task_id, user_id=user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.update_task(db=db, db_task=task, task_in=task_in)

@router.delete("/{task_id}", response_model=TaskResponse)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    user_id = 1
    task = crud.get_task(db, task_id=task_id, user_id=user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.delete_task(db=db, db_task=task)