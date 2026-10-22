from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models import KBArticle, KBVote, User
from app.schemas import KBVoteRequest
from app.deps import get_current_user, get_optional_user

router = APIRouter(prefix="/kb", tags=["kb"])

def article_to_dict(a: KBArticle, user_vote: bool | None = None) -> dict:
    return {
        "id": a.id,
        "slug": a.slug,
        "title": a.title,
        "category": a.category,
        "mins": a.mins,
        "views": a.views,
        "up": a.up_count,
        "down": a.down_count,
        "updated": a.updated_at,
        "summary": a.summary,
        "body": a.body,
        "userVote": user_vote
    }

@router.get("")
async def get_kb_articles(
    q: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(KBArticle)
    if category and category != "all":
        stmt = stmt.where(KBArticle.category == category)
    if q and q.strip():
        search = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(
            KBArticle.title.ilike(search),
            KBArticle.summary.ilike(search),
            KBArticle.slug.ilike(search)
        ))
    result = await db.execute(stmt)
    articles = result.scalars().all()
    return [article_to_dict(a) for a in articles]

@router.get("/suggest")
async def suggest_articles(
    q: str = "",
    limit: int = 4,
    db: AsyncSession = Depends(get_db)
):
    terms = [w.lower() for w in q.strip().split() if len(w) > 2]
    if not terms:
        return []

    res = await db.execute(select(KBArticle))
    articles = res.scalars().all()

    scored = []
    for a in articles:
        haystack = f"{a.title} {a.summary} {a.category} {' '.join(str(b) for b in a.body)}".lower()
        score = sum(1 for t in terms if t in haystack)
        if score > 0:
            scored.append((score, a))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [article_to_dict(a) for _, a in scored[:limit]]

@router.get("/{slug}")
async def get_kb_article(
    slug: str,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(KBArticle).where(or_(KBArticle.slug == slug, KBArticle.id == slug)))
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    article.views += 1
    await db.commit()

    user_vote = None
    if current_user:
        vote_res = await db.execute(select(KBVote).where(KBVote.user_id == current_user.id, KBVote.article_id == article.id))
        vote = vote_res.scalar_one_or_none()
        if vote:
            user_vote = vote.up

    return article_to_dict(article, user_vote)

@router.post("/{article_id}/vote")
async def vote_kb_article(
    article_id: str,
    req: KBVoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(KBArticle).where(or_(KBArticle.id == article_id, KBArticle.slug == article_id)))
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    vote_res = await db.execute(select(KBVote).where(KBVote.user_id == current_user.id, KBVote.article_id == article.id))
    existing_vote = vote_res.scalar_one_or_none()

    if existing_vote:
        if existing_vote.up == req.up:
            # Toggle off
            if req.up:
                article.up_count = max(0, article.up_count - 1)
            else:
                article.down_count = max(0, article.down_count - 1)
            await db.delete(existing_vote)
            user_vote = None
        else:
            # Switch vote
            if req.up:
                article.up_count += 1
                article.down_count = max(0, article.down_count - 1)
            else:
                article.down_count += 1
                article.up_count = max(0, article.up_count - 1)
            existing_vote.up = req.up
            user_vote = req.up
    else:
        new_vote = KBVote(user_id=current_user.id, article_id=article.id, up=req.up)
        db.add(new_vote)
        if req.up:
            article.up_count += 1
        else:
            article.down_count += 1
        user_vote = req.up

    await db.commit()
    return {"up": article.up_count, "down": article.down_count, "userVote": user_vote}
