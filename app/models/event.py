from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False, index=True)
    time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    is_all_day = Column(Boolean, default=False)
    category = Column(String, default="meeting")
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)

    owner = relationship("User", back_populates="events")
    folder = relationship("Folder", back_populates="events")