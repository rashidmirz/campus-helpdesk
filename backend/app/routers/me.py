from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, UserSettings
from app.schemas import ProfileUpdateRequest
from app.deps import get_current_user
from app.routers.auth import user_to_dict

router = APIRouter(tags=["me"])

@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    user_settings = settings_res.scalar_one_or_none()
    return user_to_dict(current_user, user_settings)

@router.patch("/me")
async def update_me(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.name is not None and req.name.strip():
        current_user.name = req.name.strip()
    if req.phone is not None:
        current_user.phone = req.phone
    if req.extra is not None:
        merged_extra = dict(current_user.extra or {})
        merged_extra.update(req.extra)
        current_user.extra = merged_extra

    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    user_settings = settings_res.scalar_one_or_none()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id, theme={}, notification_prefs={})
        db.add(user_settings)

    if req.theme is not None:
        merged_theme = dict(user_settings.theme or {})
        merged_theme.update(req.theme)
        user_settings.theme = merged_theme

    if req.notification_prefs is not None:
        merged_prefs = dict(user_settings.notification_prefs or {})
        merged_prefs.update(req.notification_prefs)
        user_settings.notification_prefs = merged_prefs

    await db.commit()
    await db.refresh(current_user)
    await db.refresh(user_settings)
    return user_to_dict(current_user, user_settings)
