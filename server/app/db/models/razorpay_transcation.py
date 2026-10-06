import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.payment import Payment


class RazorpayTranscation(Base):
    __tablename__ = "razorpay_transcations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payments.id")
    )

    razorpay_order_id: Mapped[str] = mapped_column()
    razorpay_payment_id: Mapped[str] = mapped_column()
    razorpay_signature: Mapped[str] = mapped_column()

    payment: Mapped["Payment"] = relationship(back_populates="razorpay_transcation")
