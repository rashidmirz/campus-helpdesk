from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Index, Text, JSON, Float
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # STU-8842, FAC-1044, ADM-001
    role = Column(String, nullable=False)  # student | faculty | admin
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    title = Column(String, default="")
    dept = Column(String, default="")
    phone = Column(String, default="")
    id_label = Column(String, default="")
    id_value = Column(String, default="")
    avatar_color = Column(String, default="")
    extra = Column(JSON, default=dict)
    created_at = Column(Integer, nullable=False)  # epoch ms

    tickets_requested = relationship("Ticket", back_populates="requester", foreign_keys="Ticket.requester_id")
    notifications = relationship("Notification", back_populates="user")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True)  # AGT-01
    name = Column(String, nullable=False)
    role = Column(String, default="agent")
    title = Column(String, default="")
    team = Column(String, nullable=False)
    email = Column(String, nullable=False)
    category_ids = Column(JSON, default=list)

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, index=True)  # HD-xxxx
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(String, nullable=False)  # low | medium | high | urgent
    status = Column(String, nullable=False)    # new | in_review | in_progress | waiting | resolved | closed
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(String, nullable=True)  # AGT-xx or user id
    channel = Column(String, default="Portal")
    location = Column(String, default="")
    tags = Column(JSON, default=list)
    created_at = Column(Integer, nullable=False)  # epoch ms
    updated_at = Column(Integer, nullable=False)  # epoch ms
    due_at = Column(Integer, nullable=False)      # epoch ms
    first_response_at = Column(Integer, nullable=True)
    resolved_at = Column(Integer, nullable=True)
    csat_rating = Column(Integer, nullable=True)
    csat_comment = Column(Text, nullable=True)

    requester = relationship("User", back_populates="tickets_requested", foreign_keys=[requester_id])
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.at")
    attachments = relationship("Attachment", back_populates="ticket")

    __table_args__ = (
        Index("idx_tickets_status", "status"),
        Index("idx_tickets_category", "category"),
        Index("idx_tickets_assignee_id", "assignee_id"),
        Index("idx_tickets_requester_id", "requester_id"),
    )

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(String, primary_key=True, index=True)
    ticket_id = Column(String, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String, nullable=True)
    type = Column(String, nullable=False)  # public | internal | system
    body = Column(Text, nullable=False)
    at = Column(Integer, nullable=False)  # epoch ms

    ticket = relationship("Ticket", back_populates="messages")
    attachments = relationship("Attachment", back_populates="message")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String, primary_key=True, index=True)
    ticket_id = Column(String, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=True)
    message_id = Column(String, ForeignKey("ticket_messages.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)
    size = Column(String, nullable=False)
    mime = Column(String, default="")

    ticket = relationship("Ticket", back_populates="attachments")
    message = relationship("TicketMessage", back_populates="attachments")

class KBArticle(Base):
    __tablename__ = "kb_articles"

    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    summary = Column(Text, default="")
    body = Column(JSON, default=list)
    views = Column(Integer, default=0)
    mins = Column(Integer, default=2)
    up_count = Column(Integer, default=0)
    down_count = Column(Integer, default=0)
    updated_at = Column(Integer, default=0)

class KBVote(Base):
    __tablename__ = "kb_votes"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    article_id = Column(String, ForeignKey("kb_articles.id"), primary_key=True)
    up = Column(Boolean, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    for_user = Column(String, ForeignKey("users.id"), nullable=False)
    kind = Column(String, nullable=False)  # reply | status | action | event | rate | sla | new | csat
    title = Column(String, nullable=False)
    body = Column(Text, default="")
    link = Column(String, default="")
    read = Column(Boolean, default=False)
    at = Column(Integer, nullable=False)

    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("idx_notifications_user_read", "for_user", "read"),
    )

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    tag = Column(String, default="General")
    in_days = Column(Integer, default=0)
    time = Column(String, default="")
    venue = Column(String, default="")
    description = Column(Text, default="")
    capacity = Column(Integer, default=100)
    registered_count = Column(Integer, default=0)

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    event_id = Column(String, ForeignKey("events.id"), primary_key=True)

class LostFound(Base):
    __tablename__ = "lost_found"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # lost | found
    title = Column(String, nullable=False)
    cat = Column(String, nullable=False)
    place = Column(String, nullable=False)
    desc = Column(Text, default="")
    status = Column(String, default="Open")  # Open | Claimed
    by_user = Column(String, ForeignKey("users.id"), nullable=False)
    reward = Column(Boolean, default=False)
    at = Column(Integer, nullable=False)

class Fee(Base):
    __tablename__ = "fees"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="due")  # due | paid
    due_date = Column(String, default="")
    paid_on = Column(String, default="")

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    items = Column(JSON, default=list)
    total = Column(Integer, nullable=False)
    method = Column(String, default="UPI")
    at = Column(Integer, nullable=False)

class Exam(Base):
    __tablename__ = "exams"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    course = Column(String, default="B.Tech CSE")
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    in_days = Column(Integer, default=0)
    time = Column(String, default="")
    hall = Column(String, default="")
    seat = Column(String, default="")
    credits = Column(Integer, default=4)
    kind = Column(String, default="Theory")  # Theory | Practical
    hall_ticket_status = Column(String, default="Available")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    copies = Column(Integer, default=1)
    note = Column(Text, default="")
    status = Column(String, default="Processing")
    ticket_id = Column(String, ForeignKey("tickets.id"), nullable=False)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    tone = Column(String, default="info")  # info | warn | ok
    pinned = Column(Boolean, default=False)
    by_name = Column(String, default="Administration")
    audience = Column(String, default="all")
    at = Column(Integer, nullable=False)

class CannedReply(Base):
    __tablename__ = "canned_replies"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)

class SavedView(Base):
    __tablename__ = "saved_views"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    filters = Column(JSON, default=dict)

class Checklist(Base):
    __tablename__ = "checklist"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    key = Column(String, primary_key=True)
    done = Column(Boolean, default=False)

class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    theme = Column(JSON, default=dict)
    notification_prefs = Column(JSON, default=dict)
