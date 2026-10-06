import uuid
from typing import TYPE_CHECKING

from sqlalchemy import UUID, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.razorpay_transcation import RazorpayTranscation
    from app.db.models.subscription import Subscription


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True
    )
    complete: Mapped[bool] = mapped_column(Boolean, default=False)

    subscription: Mapped["Subscription"] = relationship(back_populates="payment")
    razorpay_transcation: Mapped["RazorpayTranscation"] = relationship(
        back_populates="payment", cascade="all, delete-orphan"
    )
