import time
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Ticket, TicketMessage, Attachment, Notification, User, Agent
from app.schemas import (
    TicketCreate, TicketPatch, BulkTicketPatch, MessageCreate, TicketRating
)
from app.deps import get_current_user, require_admin
from app.helpers import (
    get_category_name, get_category_team, get_status_name,
    get_sla_hours, DEFAULT_AGENT_FOR_CATEGORY
)
from app.config import settings

router = APIRouter(prefix="/tickets", tags=["tickets"])

async def get_ticket_with_relations(ticket_id: str, db: AsyncSession) -> Ticket | None:
    stmt = (
        select(Ticket)
        .options(
            selectinload(Ticket.messages).selectinload(TicketMessage.attachments)
        )
        .where(Ticket.id == ticket_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

def format_ticket(t: Ticket, is_admin: bool = False) -> dict:
    msgs = []
    for m in t.messages:
        if not is_admin and m.type == "internal":
            continue
        atts = [{"name": a.filename, "size": a.size, "url": f"/uploads/{a.path}"} for a in m.attachments]
        msgs.append({
            "id": m.id,
            "authorId": m.author_id,
            "type": m.type,
            "body": m.body,
            "at": m.at,
            "attachments": atts
        })
    msgs.sort(key=lambda x: x["at"])

    csat = None
    if t.csat_rating is not None:
        csat = {
            "rating": t.csat_rating,
            "comment": t.csat_comment or ""
        }

    return {
        "id": t.id,
        "subject": t.subject,
        "description": t.description,
        "category": t.category,
        "categoryName": get_category_name(t.category),
        "priority": t.priority,
        "status": t.status,
        "requesterId": t.requester_id,
        "assigneeId": t.assignee_id,
        "channel": t.channel or "Portal",
        "location": t.location or "",
        "tags": t.tags or [],
        "createdAt": t.created_at,
        "updatedAt": t.updated_at,
        "dueAt": t.due_at,
        "firstResponseAt": t.first_response_at,
        "resolvedAt": t.resolved_at,
        "csat": csat,
        "messages": msgs
    }

@router.get("")
async def get_tickets(
    status: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    assignee: str | None = None,
    q: str | None = None,
    sla: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ticket).options(
        selectinload(Ticket.messages).selectinload(TicketMessage.attachments)
    ).order_by(Ticket.created_at.desc())

    # Role enforcement: students and faculty only see their own tickets
    if current_user.role != "admin":
        stmt = stmt.where(Ticket.requester_id == current_user.id)

    if status and status != "all":
        stmt = stmt.where(Ticket.status == status)
    if category and category != "all":
        stmt = stmt.where(Ticket.category == category)
    if priority and priority != "all":
        stmt = stmt.where(Ticket.priority == priority)
    if assignee:
        if assignee == "none":
            stmt = stmt.where(Ticket.assignee_id.is_(None))
        elif assignee != "all":
            stmt = stmt.where(Ticket.assignee_id == assignee)

    if q and q.strip():
        search = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(
            Ticket.id.ilike(search),
            Ticket.subject.ilike(search),
            Ticket.description.ilike(search),
            Ticket.location.ilike(search)
        ))

    result = await db.execute(stmt)
    tickets = result.scalars().all()

    now = int(time.time() * 1000)
    out = []
    for t in tickets:
        formatted = format_ticket(t, is_admin=(current_user.role == "admin"))
        if sla:
            done = t.status in ("resolved", "closed")
            target = t.resolved_at if done else t.due_at
            remaining = target - now
            pct = 1.0 if done else max(0.0, min(1.0, (now - t.created_at) / max(1, t.due_at - t.created_at)))
            is_breached = not done and remaining < 0
            is_at_risk = not done and remaining >= 0 and pct >= 0.75

            if sla == "breached" and not is_breached:
                continue
            if sla in ("at_risk", "risk") and not is_at_risk:
                continue
        out.append(formatted)

    return out

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    req: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = int(time.time() * 1000)

    # Compute next ticket ID
    res = await db.execute(select(Ticket.id))
    all_ids = res.scalars().all()
    max_num = 2000
    for tid in all_ids:
        if tid.startswith("HD-"):
            try:
                num = int(tid[3:])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass
    next_id = f"HD-{max_num + 1}"

    requester_id = req.requesterId if (current_user.role == "admin" and req.requesterId) else current_user.id
    sla_h = get_sla_hours(req.priority)
    due_at = now + sla_h * 3600 * 1000
    assignee_id = DEFAULT_AGENT_FOR_CATEGORY.get(req.category)

    ticket = Ticket(
        id=next_id,
        subject=req.subject,
        description=req.description,
        category=req.category,
        priority=req.priority,
        status="new",
        requester_id=requester_id,
        assignee_id=assignee_id,
        channel=req.channel or "Portal",
        location=req.location or "",
        tags=req.tags or [],
        created_at=now,
        updated_at=now,
        due_at=due_at,
        first_response_at=None,
        resolved_at=None,
        csat_rating=None,
        csat_comment=None
    )
    db.add(ticket)
    await db.flush()

    # Initial message
    m0_id = f"{next_id}-m0"
    m0 = TicketMessage(
        id=m0_id,
        ticket_id=next_id,
        author_id=requester_id,
        type="public",
        body=req.description,
        at=now
    )
    db.add(m0)
    await db.flush()

    if req.attachments:
        for idx, att in enumerate(req.attachments):
            db.add(Attachment(
                id=f"att-{next_id}-{idx}",
                ticket_id=next_id,
                message_id=m0_id,
                filename=att.get("name", "attachment"),
                path=att.get("url", "").replace("/uploads/", "") or att.get("name", ""),
                size=att.get("size", ""),
                mime=att.get("mime", "")
            ))

    # Routing system message
    team_name = get_category_team(req.category)
    m1 = TicketMessage(
        id=f"{next_id}-m1",
        ticket_id=next_id,
        author_id=None,
        type="system",
        body=f"Request received and routed to {team_name}",
        at=now + 1000
    )
    db.add(m1)

    # Notifications
    db.add(Notification(
        id=f"notif-{int(time.time()*1000)}-adm",
        for_user="ADM-001",
        kind="new",
        title=f"New request {next_id}",
        body=req.subject,
        link=f"/app/tickets/{next_id}",
        read=False,
        at=now
    ))
    db.add(Notification(
        id=f"notif-{int(time.time()*1000)}-req",
        for_user=requester_id,
        kind="status",
        title=f"We received {next_id}",
        body=f"Routed to {team_name}. Expect a first reply soon.",
        link=f"/app/tickets/{next_id}",
        read=True,
        at=now
    ))

    await db.commit()

    created = await get_ticket_with_relations(next_id, db)
    return format_ticket(created, is_admin=(current_user.role == "admin"))

@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    t = await get_ticket_with_relations(ticket_id, db)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    if current_user.role != "admin" and t.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return format_ticket(t, is_admin=(current_user.role == "admin"))

@router.patch("/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    patch: TicketPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    is_admin = (current_user.role == "admin")
    is_requester = (t.requester_id == current_user.id)

    if not is_admin and not is_requester:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Requester can only resolve or reopen
    if not is_admin and (patch.priority or patch.category or patch.assigneeId):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only staff can modify priority, category or assignee")

    now = int(time.time() * 1000)
    sys_messages = []

    if patch.status and patch.status != t.status:
        old_status = t.status
        t.status = patch.status
        sys_messages.append(f"Status changed to {get_status_name(patch.status)}")
        if patch.status in ("resolved", "closed"):
            t.resolved_at = t.resolved_at or now
            # Notify requester to rate if resolved by staff
            if is_admin and not is_requester:
                db.add(Notification(
                    id=f"notif-res-{now}",
                    for_user=t.requester_id,
                    kind="rate",
                    title=f"{ticket_id} is now Resolved",
                    body="Tell us in one tap how the resolution went.",
                    link=f"/app/tickets/{ticket_id}",
                    read=False,
                    at=now
                ))
        elif patch.status == "in_progress":
            t.resolved_at = None

    if patch.assigneeId is not None and patch.assigneeId != t.assignee_id:
        t.assignee_id = patch.assigneeId if patch.assigneeId else None
        if t.assignee_id:
            ag_res = await db.execute(select(Agent).where(Agent.id == t.assignee_id))
            ag = ag_res.scalar_one_or_none()
            sys_messages.append(f"Assigned to {ag.name if ag else t.assignee_id}")
        else:
            sys_messages.append("Unassigned")

    if patch.priority and patch.priority != t.priority:
        t.priority = patch.priority
        t.due_at = t.created_at + get_sla_hours(patch.priority) * 3600 * 1000
        sys_messages.append(f"Priority changed to {patch.priority}")

    if patch.category and patch.category != t.category:
        t.category = patch.category
        sys_messages.append(f"Moved to {get_category_name(patch.category)}")

    if patch.tags is not None:
        t.tags = patch.tags

    if patch.note:
        sys_messages.append(patch.note)

    t.updated_at = now

    for idx, body in enumerate(sys_messages):
        db.add(TicketMessage(
            id=f"{ticket_id}-sys-{now}-{idx}",
            ticket_id=ticket_id,
            author_id=None,
            type="system",
            body=body,
            at=now + idx
        ))

    await db.commit()

    updated = await get_ticket_with_relations(ticket_id, db)
    return format_ticket(updated, is_admin=is_admin)

@router.post("/{ticket_id}/messages")
async def add_message(
    ticket_id: str,
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    is_admin = (current_user.role == "admin")
    is_requester = (t.requester_id == current_user.id)

    if not is_admin and not is_requester:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Internal messages are ADMIN ONLY
    if req.type == "internal" and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students and faculty cannot post internal notes")

    now = int(time.time() * 1000)
    mid = f"{ticket_id}-m{int(time.time()*1000)}"

    msg = TicketMessage(
        id=mid,
        ticket_id=ticket_id,
        author_id=current_user.id,
        type=req.type,
        body=req.body,
        at=now
    )
    db.add(msg)
    await db.flush()

    if req.attachments:
        for idx, att in enumerate(req.attachments):
            db.add(Attachment(
                id=f"att-{mid}-{idx}",
                ticket_id=ticket_id,
                message_id=mid,
                filename=att.get("name", "attachment"),
                path=att.get("url", "").replace("/uploads/", "") or att.get("name", ""),
                size=att.get("size", ""),
                mime=att.get("mime", "")
            ))

    # Update ticket status rules
    sys_msgs = []
    if req.type == "public":
        if not is_requester:
            if t.status == "new":
                t.status = "in_review"
                sys_msgs.append("Status changed to Under review")
            if t.first_response_at is None:
                t.first_response_at = now
            # Notify requester
            db.add(Notification(
                id=f"notif-rep-{now}",
                for_user=t.requester_id,
                kind="reply",
                title=f"{current_user.name.split(' ')[0]} replied on {ticket_id}",
                body=req.body[:90],
                link=f"/app/tickets/{ticket_id}",
                read=False,
                at=now
            ))
        else:
            if t.status in ("waiting", "resolved"):
                t.status = "in_progress"
                t.resolved_at = None
                sys_msgs.append("Status changed to In progress")

    t.updated_at = now
    for idx, b in enumerate(sys_msgs):
        db.add(TicketMessage(
            id=f"{ticket_id}-sys-{now}-{idx}",
            ticket_id=ticket_id,
            author_id=None,
            type="system",
            body=b,
            at=now + idx + 1
        ))

    await db.commit()

    updated = await get_ticket_with_relations(ticket_id, db)
    return format_ticket(updated, is_admin=is_admin)

@router.post("/{ticket_id}/attachments")
async def upload_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    is_admin = (current_user.role == "admin")
    if not is_admin and t.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    upload_folder = Path(settings.UPLOAD_DIR)
    upload_folder.mkdir(parents=True, exist_ok=True)

    safe_name = f"{int(time.time()*1000)}_{file.filename}"
    file_path = upload_folder / safe_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size_bytes = file_path.stat().st_size
    size_str = f"{size_bytes // 1024} KB" if size_bytes > 1024 else f"{size_bytes} B"

    att = Attachment(
        id=f"att-{int(time.time()*1000)}",
        ticket_id=ticket_id,
        message_id=None,
        filename=file.filename,
        path=safe_name,
        size=size_str,
        mime=file.content_type or ""
    )
    db.add(att)
    await db.commit()

    return {
        "id": att.id,
        "name": file.filename,
        "size": size_str,
        "url": f"/uploads/{safe_name}"
    }

@router.post("/{ticket_id}/rating")
async def rate_ticket(
    ticket_id: str,
    rating_data: TicketRating,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    if current_user.role != "admin" and t.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    t.csat_rating = rating_data.rating
    t.csat_comment = rating_data.comment or ""
    if t.status == "resolved":
        t.status = "closed"
    t.updated_at = int(time.time() * 1000)

    await db.commit()

    updated = await get_ticket_with_relations(ticket_id, db)
    return format_ticket(updated, is_admin=(current_user.role == "admin"))

@router.post("/bulk")
async def bulk_update_tickets(
    bulk: BulkTicketPatch,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    now = int(time.time() * 1000)
    for tid in bulk.ids:
        res = await db.execute(select(Ticket).where(Ticket.id == tid))
        t = res.scalar_one_or_none()
        if not t:
            continue
        p = bulk.patch
        if "status" in p and p["status"] != t.status:
            t.status = p["status"]
            db.add(TicketMessage(
                id=f"{tid}-sys-{now}", ticket_id=tid, author_id=None, type="system",
                body=f"Status changed to {get_status_name(p['status'])}", at=now
            ))
            if p["status"] in ("resolved", "closed"):
                t.resolved_at = t.resolved_at or now
        if "assigneeId" in p and p["assigneeId"] != t.assignee_id:
            t.assignee_id = p["assigneeId"] or None
        if "priority" in p and p["priority"] != t.priority:
            t.priority = p["priority"]
            t.due_at = t.created_at + get_sla_hours(p["priority"]) * 3600 * 1000
        if "category" in p and p["category"] != t.category:
            t.category = p["category"]
        t.updated_at = now
    await db.commit()
    return {"updated": len(bulk.ids)}
