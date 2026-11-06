from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.tag import task_tags

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    priority = Column(String(20), default="medium")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)

    owner = relationship("User", back_populates="tasks")
    folder = relationship("Folder", back_populates="tasks")
    tags = relationship("Tag", secondary=task_tags, back_populates="tasks")