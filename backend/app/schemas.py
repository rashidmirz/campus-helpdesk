from pydantic import BaseModel, Field
from typing import Any

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    login: str  # User ID or Email
    password: str

class TokenResponse(BaseModel):
    token: str
    user: dict[str, Any]

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    extra: dict[str, Any] | None = None
    theme: dict[str, Any] | None = None
    notification_prefs: dict[str, Any] | None = None

# --- Ticket Schemas ---
class AttachmentSchema(BaseModel):
    name: str
    size: str
    url: str | None = None

class MessageCreate(BaseModel):
    body: str
    type: str = "public"  # public | internal | system
    attachments: list[dict[str, Any]] = []

class MessageOut(BaseModel):
    id: str
    authorId: str | None
    type: str
    body: str
    at: int
    attachments: list[dict[str, Any]] = []

class TicketCreate(BaseModel):
    subject: str
    category: str
    priority: str = "medium"  # low | medium | high | urgent
    description: str
    location: str | None = ""
    tags: list[str] = []
    channel: str = "Portal"
    requesterId: str | None = None
    attachments: list[dict[str, Any]] = []

class TicketPatch(BaseModel):
    status: str | None = None
    assigneeId: str | None = None
    priority: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    note: str | None = None

class BulkTicketPatch(BaseModel):
    ids: list[str]
    patch: dict[str, Any]

class TicketRating(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = ""

# --- KB Schemas ---
class KBVoteRequest(BaseModel):
    up: bool

# --- Notification Schemas ---
class NotificationReadRequest(BaseModel):
    id: str  # specific id or "all"

# --- Event Schemas ---
class EventRegisterRequest(BaseModel):
    pass

# --- Lost & Found Schemas ---
class LostFoundCreate(BaseModel):
    type: str  # lost | found
    title: str
    cat: str
    place: str
    desc: str = ""
    reward: bool = False

# --- Fees Schemas ---
class PayFeesRequest(BaseModel):
    ids: list[str]
    method: str = "UPI"

# --- Document Schemas ---
class DocumentCreate(BaseModel):
    name: str
    copies: int = 1
    note: str = ""

# --- Announcement Schemas ---
class AnnouncementCreate(BaseModel):
    title: str
    body: str
    tone: str = "info"  # info | warn | ok
    pinned: bool = False
    audience: str = "all"

# --- Admin Schemas ---
class CannedReplyCreate(BaseModel):
    title: str
    body: str

class SavedViewCreate(BaseModel):
    name: str
    filters: dict[str, Any]

class ChecklistToggle(BaseModel):
    key: str

# --- Assistant Schemas ---
class AssistantAskRequest(BaseModel):
    question: str
