import uuid
from datetime import datetime, timedelta

from sqlalchemy import UUID, Column, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship

from app.db.base import Base

class RefreshToken(Base):
  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)    
  owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
  token = Column(String, unique=True, nullable=False)
  created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
  expires_at = Column(DateTime(timezone=True), default=lambda: datetime.utcnow() + timedelta(days=7))

  owner = relationship("User", back_populates="refresh_tokens")
