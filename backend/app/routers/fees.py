import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Fee, Receipt, User
from app.schemas import PayFeesRequest
from app.deps import get_current_user

router = APIRouter(prefix="/fees", tags=["fees"])

def fee_to_dict(f: Fee) -> dict:
    return {
        "id": f.id,
        "name": f.name,
        "amount": f.amount,
        "status": f.status,
        "due": f.due_date,
        "paidOn": f.paid_on
    }

def receipt_to_dict(r: Receipt) -> dict:
    return {
        "id": r.id,
        "items": r.items or [],
        "total": r.total,
        "method": r.method,
        "at": r.at
    }

@router.get("")
async def get_fees(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Fee)
    if current_user.role != "admin":
        stmt = stmt.where(Fee.user_id == current_user.id)
    res = await db.execute(stmt)
    fees = res.scalars().all()
    return [fee_to_dict(f) for f in fees]

@router.post("/pay")
async def pay_fees(
    req: PayFeesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not req.ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fee items selected")

    res = await db.execute(select(Fee).where(Fee.id.in_(req.ids)))
    items = res.scalars().all()
    if not items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching fee items found")

    total = sum(i.amount for i in items)
    now = int(time.time() * 1000)
    paid_on_str = "Today"

    for item in items:
        item.status = "paid"
        item.paid_on = paid_on_str

    rc_id = f"RC-{str(now)[-6:]}"
    receipt = Receipt(
        id=rc_id,
        user_id=current_user.id,
        items=[i.name for i in items],
        total=total,
        method=req.method or "UPI",
        at=now
    )
    db.add(receipt)
    await db.commit()
    await db.refresh(receipt)
    return receipt_to_dict(receipt)

@router.get("/receipts")
async def get_receipts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Receipt).where(Receipt.user_id == current_user.id).order_by(Receipt.at.desc())
    res = await db.execute(stmt)
    receipts = res.scalars().all()
    return [receipt_to_dict(r) for r in receipts]
