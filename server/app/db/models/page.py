import uuid

from app.db.base import Base

from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm._orm_constructors import relationship

class Page(Base):
    __tablename__ = "pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number = Column(Integer, nullable=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    assiciated_text = Column(JSONB, nullable=True)

    book = relationship("Book", back_populates="pages")
