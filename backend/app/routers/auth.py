from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models import User, UserSettings
from app.schemas import (
    LoginRequest, TokenResponse, ProfileUpdateRequest,
    ChangePasswordRequest, ForgotPasswordRequest
)
from app.security import verify_password, get_password_hash, create_access_token
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def user_to_dict(user: User, settings: UserSettings | None = None) -> dict:
    return {
        "id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "title": user.title,
        "dept": user.dept,
        "phone": user.phone,
        "idLabel": user.id_label or ("Enrollment" if user.role == "student" else "Employee ID" if user.role == "faculty" else "Staff ID"),
        "idValue": user.id_value or user.id,
        "avatarColor": user.avatar_color,
        "extra": user.extra or {},
        "theme": settings.theme if settings else {},
        "notificationPrefs": settings.notification_prefs if settings else {}
    }

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    login_id = req.login.strip().lower()
    stmt = select(User).where(or_(User.id.ilike(login_id), User.email.ilike(login_id)))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID or password"
        )

    # Get settings
    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    user_settings = settings_res.scalar_one_or_none()

    token = create_access_token(data={"sub": user.id, "role": user.role})
    return {
        "token": token,
        "user": user_to_dict(user, user_settings)
    }

@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    current_user.password_hash = get_password_hash(req.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    return {"message": f"Password reset instructions have been sent to {req.email}"}
