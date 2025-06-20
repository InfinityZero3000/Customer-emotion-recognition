from sqlalchemy.orm import Session
from models.history import History
from schemas.history import HistoryCreate

def create_history(db: Session, history: HistoryCreate):
    db_history = History(**history.dict())
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_user_history(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(History).filter(History.user_id == user_id).offset(skip).limit(limit).all()
