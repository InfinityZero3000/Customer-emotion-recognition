from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class HistoryBase(BaseModel):
    data_type: str
    input_info: Optional[str]
    result: Optional[Dict[str, Any]]

class HistoryCreate(HistoryBase):
    user_id: int

class HistoryRead(HistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
