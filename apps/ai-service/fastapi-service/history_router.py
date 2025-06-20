from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas.history import HistoryRead, HistoryCreate
from services.history_service import create_history, get_user_history
from db import get_db
from typing import List

router = APIRouter()

@router.post("/", response_model=HistoryRead)
def add_history(history: HistoryCreate, db: Session = Depends(get_db)):
    return create_history(db, history)

@router.get("/{user_id}", response_model=List[HistoryRead])
def get_history(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_user_history(db, user_id, skip=skip, limit=limit)