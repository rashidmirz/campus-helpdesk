from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import User, Agent, Ticket, CannedReply, SavedView, Checklist
from app.schemas import CannedReplyCreate, SavedViewCreate, ChecklistToggle
from app.deps import get_current_user, require_admin

router = APIRouter(tags=["people_admin"])

DEPARTMENTS_DATA = [
    {"id": "CSE", "name": "Computer Science & Engineering", "head": "Dr. Priya Nair", "students": 812, "faculty": 46},
    {"id": "ECE", "name": "Electronics & Communication", "head": "Dr. Rajesh Kulkarni", "students": 540, "faculty": 32},
    {"id": "IT", "name": "Information Technology", "head": "Prof. Ananya Sen", "students": 498, "faculty": 28},
    {"id": "Mech", "name": "Mechanical Engineering", "head": "Prof. Dilip Varma", "students": 460, "faculty": 30},
    {"id": "Civil", "name": "Civil Engineering", "head": "Dr. Sunita Reddy", "students": 388, "faculty": 24},
    {"id": "MBA", "name": "Management Studies", "head": "Dr. Meera Joshi", "students": 352, "faculty": 21},
    {"id": "Pharmacy", "name": "Pharmacy", "head": "Dr. Nikhil Joshi", "students": 410, "faculty": 19},
    {"id": "BBA", "name": "Business Administration", "head": "Prof. Alok Rane", "students": 382, "faculty": 14},
]

@router.get("/people")
async def get_people(
    type: str = "students",
    dept: str | None = None,
    q: str | None = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    if type == "depts":
        return DEPARTMENTS_DATA

    if type == "staff":
        res = await db.execute(select(Agent))
        agents = res.scalars().all()
        out = []
        for a in agents:
            tk_count = await db.scalar(select(func.count(Ticket.id)).where(Ticket.assignee_id == a.id))
            out.append({
                "id": a.id,
                "name": a.name,
                "role": a.role,
                "title": a.title,
                "team": a.team,
                "email": a.email,
                "dept": "",
                "ticketCount": tk_count or 0
            })
        return out

    role = "student" if type in ("student", "students") else "faculty"
    stmt = select(User).where(User.role == role)
    if dept and dept != "all":
        stmt = stmt.where(User.dept == dept)
    if q and q.strip():
        search = f"%{q.strip().lower()}%"
        stmt = stmt.where(User.name.ilike(search) | User.id.ilike(search) | User.email.ilike(search))

    users_res = await db.execute(stmt)
    users = users_res.scalars().all()

    out = []
    for u in users:
        tk_count = await db.scalar(select(func.count(Ticket.id)).where(Ticket.requester_id == u.id))
        extra = u.extra or {}
        out.append({
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "course": extra.get("course", u.title),
            "sem": extra.get("sem", ""),
            "designation": extra.get("designation", u.title),
            "dept": u.dept,
            "email": u.email,
            "phone": u.phone,
            "status": extra.get("status", "Active"),
            "attendance": float(str(extra.get("attendance", "85%")).replace("%", "")),
            "fees": extra.get("fees", "Paid"),
            "cgpa": float(str(extra.get("cgpa", "8.0"))),
            "hostel": extra.get("hostel", ""),
            "ticketCount": tk_count or 0
        })
    return out

# --- Canned replies ---
@router.get("/canned-replies")
async def get_canned_replies(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CannedReply))
    return [{"id": c.id, "title": c.title, "body": c.body} for c in res.scalars().all()]

@router.post("/canned-replies")
async def add_canned_reply(
    req: CannedReplyCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    import time
    cid = f"c-{int(time.time()*1000)%10000}"
    c = CannedReply(id=cid, title=req.title, body=req.body, owner_id=current_user.id)
    db.add(c)
    await db.commit()
    return {"id": c.id, "title": c.title, "body": c.body}

@router.delete("/canned-replies/{cid}")
async def delete_canned_reply(
    cid: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(CannedReply).where(CannedReply.id == cid))
    c = res.scalar_one_or_none()
    if c:
        await db.delete(c)
        await db.commit()
    return {"status": "ok"}

# --- Saved views ---
@router.get("/saved-views")
async def get_saved_views(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(SavedView).where(SavedView.user_id == current_user.id))
    return [{"id": v.id, "name": v.name, "filters": v.filters} for v in res.scalars().all()]

@router.post("/saved-views")
async def save_view(
    req: SavedViewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import time
    vid = f"v-{int(time.time()*1000)%10000}"
    v = SavedView(id=vid, user_id=current_user.id, name=req.name, filters=req.filters)
    db.add(v)
    await db.commit()
    return {"id": v.id, "name": v.name, "filters": v.filters}

@router.delete("/saved-views/{vid}")
async def delete_saved_view(
    vid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(SavedView).where(SavedView.id == vid, SavedView.user_id == current_user.id))
    v = res.scalar_one_or_none()
    if v:
        await db.delete(v)
        await db.commit()
    return {"status": "ok"}

# --- Checklist ---
@router.get("/checklist")
async def get_checklist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Checklist).where(Checklist.user_id == current_user.id))
    return {c.key: c.done for c in res.scalars().all()}

@router.post("/checklist/toggle")
async def toggle_checklist(
    req: ChecklistToggle,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Checklist).where(Checklist.user_id == current_user.id, Checklist.key == req.key))
    c = res.scalar_one_or_none()
    if c:
        c.done = not c.done
    else:
        c = Checklist(user_id=current_user.id, key=req.key, done=True)
        db.add(c)
    await db.commit()
    return {"key": c.key, "done": c.done}
