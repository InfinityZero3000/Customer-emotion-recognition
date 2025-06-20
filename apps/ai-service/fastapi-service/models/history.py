from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class History(Base):
    __tablename__ = "history"
    __table_args__ = (
        Index('idx_user_id_created_at', "user_id", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_type = Column(String, nullable=False)  # image, audio, text, video
    input_info = Column(String)  # file name, text snippet, etc.
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
