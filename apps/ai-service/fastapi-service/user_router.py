from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.user import UserRead
from services.user_service import get_user_by_username
from db import get_db

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_users_me(username: str, db: Session = Depends(get_db)):
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
