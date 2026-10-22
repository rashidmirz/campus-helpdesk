import re
import time
import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models import Ticket, KBArticle, Agent, User
from app.schemas import AssistantAskRequest
from app.deps import get_current_user
from app.helpers import get_status_name
import logging
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["assistant"])

PROMPTS = [
    "My Wi-Fi keeps disconnecting",
    "How do I get my hall ticket?",
    "Where is my request HD-2041?",
    "I lost my ID card",
    "How do I pay hostel fees?",
    "Room change process"
]

def format_duration(ms: int) -> str:
    abs_ms = abs(ms)
    hours = abs_ms // (3600 * 1000)
    minutes = (abs_ms % (3600 * 1000)) // (60 * 1000)
    if hours > 24:
        return f"{hours // 24}d {hours % 24}h"
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"

def resolve_ai_credentials():
    key = (settings.AI_API_KEY or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY or settings.GROQ_API_KEY or "").strip()
    if not key or key in ("your_api_key_here", "your_actual_api_key_here"):
        return None, None, None

    provider = (settings.AI_PROVIDER or "auto").strip().lower()
    model = (settings.AI_MODEL or "").strip()

    if provider == "openrouter" or key.startswith("sk-or-"):
        return "openrouter", key, model or "google/gemini-flash-1.5"
    elif provider == "gemini" or key.startswith("AIza") or bool(settings.GEMINI_API_KEY):
        return "gemini", key, model or "gemini-1.5-flash"
    elif provider == "groq" or key.startswith("gsk_") or bool(settings.GROQ_API_KEY):
        return "groq", key, model or "llama-3.3-70b-versatile"
    elif provider == "openai" or key.startswith("sk-") or bool(settings.OPENAI_API_KEY):
        return "openai", key, model or "gpt-4o-mini"
    else:
        return "gemini", key, model or "gemini-1.5-flash"

def extract_kb_text(body) -> str:
    if not body:
        return ""
    if isinstance(body, str):
        return body
    parts = []
    if isinstance(body, list):
        for b in body:
            if isinstance(b, dict):
                if b.get("c"):
                    parts.append(str(b["c"]))
                if b.get("items") and isinstance(b["items"], list):
                    parts.extend(f"- {it}" for it in b["items"])
    return "\n".join(parts)

async def call_gemini(key: str, model: str, system_prompt: str, question: str) -> str:
    models_to_try = [model]
    for alt in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"]:
        if alt not in models_to_try:
            models_to_try.append(alt)

    last_err = ""
    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Question: {question}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }
        try:
            async with httpx.AsyncClient(timeout=14.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                last_err = f"{res.status_code} {res.text}"
        except Exception as e:
            last_err = str(e)
    raise RuntimeError(f"Gemini API failure: {last_err}")

async def call_openai_compatible(url: str, key: str, model: str, system_prompt: str, question: str) -> str:
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ],
        "temperature": 0.2,
        "max_tokens": 800
    }
    async with httpx.AsyncClient(timeout=14.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
        raise RuntimeError(f"API error ({res.status_code}): {res.text}")

async def ask_assistant(question: str, current_user: User, db: AsyncSession) -> dict:
    q_clean = question.strip()

    # 1. Custom webhook HTTP URL if configured
    if settings.AI_API_URL and settings.AI_API_URL.strip():
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    settings.AI_API_URL.strip(),
                    json={"question": question, "user_id": current_user.id, "user_role": current_user.role}
                )
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, dict) and "text" in data:
                        return data
        except Exception:
            pass

    # 2. Direct LLM API Key (Gemini / OpenAI / Groq) with Database Context
    provider, ai_key, ai_model = resolve_ai_credentials()
    if provider and ai_key:
        try:
            # Fetch user's recent tickets
            t_stmt = select(Ticket).where(Ticket.requester_id == current_user.id).order_by(Ticket.created_at.desc()).limit(6)
            t_res = await db.execute(t_stmt)
            user_tickets = t_res.scalars().all()

            # Fetch Knowledge Base articles
            kb_res = await db.execute(select(KBArticle))
            articles = kb_res.scalars().all()

            # Build KB summary
            kb_lines = []
            for a in articles:
                kb_lines.append(f"- [{a.category.upper()}] {a.title}: {a.summary}\n  Details: {extract_kb_text(a.body)[:400]}")
            kb_context = "\n".join(kb_lines)

            # Build Tickets summary
            ticket_lines = []
            for t in user_tickets:
                ticket_lines.append(f"- Request {t.id}: '{t.subject}' | Status: {t.status} | Priority: {t.priority}")
            ticket_context = "\n".join(ticket_lines) if ticket_lines else "No active requests."

            system_prompt = (
                f"You are Oak, the official campus helpdesk AI assistant for Silver Oak University.\n"
                f"Your task is to help students, faculty, and campus members quickly, politely, and accurately.\n\n"
                f"User Profile:\n"
                f"Name: {current_user.name}\n"
                f"Role: {current_user.role}\n"
                f"Email: {current_user.email}\n"
                f"Department: {current_user.dept}\n\n"
                f"User's Helpdesk Requests:\n"
                f"{ticket_context}\n\n"
                f"Campus Knowledge Base & FAQs:\n"
                f"{kb_context}\n\n"
                f"Guidelines:\n"
                f"1. Respond directly and helpfully in 2-4 sentences or clear bullet points.\n"
                f"2. Use the Knowledge Base and Ticket records above as your official source.\n"
                f"3. If the user asks about their request or ticket (e.g. HD-2041 or request status), cite the ticket ID and status accurately.\n"
                f"4. If something requires manual staff action (like lost ID card printing or physical repairs), advise them to submit a ticket.\n"
                f"5. Maintain a polite, reassuring tone."
            )

            if provider == "openrouter":
                ai_text = await call_openai_compatible("https://openrouter.ai/api/v1/chat/completions", ai_key, ai_model, system_prompt, q_clean)
            elif provider == "gemini":
                ai_text = await call_gemini(ai_key, ai_model, system_prompt, q_clean)
            elif provider == "groq":
                ai_text = await call_openai_compatible("https://api.groq.com/openai/v1/chat/completions", ai_key, ai_model, system_prompt, q_clean)
            elif provider == "openai":
                ai_text = await call_openai_compatible("https://api.openai.com/v1/chat/completions", ai_key, ai_model, system_prompt, q_clean)
            else:
                ai_text = await call_gemini(ai_key, ai_model, system_prompt, q_clean)

            # Find matching ticket if referenced
            matched_ticket = None
            t_match = re.search(r"HD-?\s?(\d{3,4})", q_clean + " " + ai_text, re.IGNORECASE)
            if t_match:
                t_id = f"HD-{t_match.group(1)}"
                for t in user_tickets:
                    if t.id.upper() == t_id.upper():
                        matched_ticket = {
                            "id": t.id,
                            "subject": t.subject,
                            "status": t.status,
                            "category": t.category,
                            "priority": t.priority,
                            "requesterId": t.requester_id
                        }
                        break

            # Find matching KB article for card display
            terms = [w.lower() for w in q_clean.split() if len(w) > 2]
            scored = []
            for a in articles:
                haystack = f"{a.title} {a.summary} {a.category}".lower()
                score = sum(1 for term in terms if term in haystack)
                if score > 0:
                    scored.append((score, a))
            scored.sort(key=lambda x: x[0], reverse=True)

            article_dict = None
            more_articles = []
            if scored:
                top_art = scored[0][1]
                article_dict = {
                    "id": top_art.id,
                    "slug": top_art.slug,
                    "title": top_art.title,
                    "category": top_art.category,
                    "summary": top_art.summary
                }
                for _, art in scored[1:3]:
                    more_articles.append({
                        "id": art.id,
                        "slug": art.slug,
                        "title": art.title,
                        "category": art.category
                    })

            return {
                "text": ai_text,
                "ticket": matched_ticket,
                "article": article_dict,
                "more": more_articles,
                "chips": PROMPTS[:3],
                "raise": q_clean
            }
        except Exception as e:
            logger.warning("AI provider call failed, falling back to local KB search: %s", e)

    # 3. Built-in logic: Ticket lookup
    match = re.search(r"HD-?\s?(\d{3,4})", q_clean, re.IGNORECASE)
    if match:
        ticket_id = f"HD-{match.group(1)}"
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        res = await db.execute(stmt)
        t = res.scalar_one_or_none()

        if not t or (current_user.role != "admin" and t.requester_id != current_user.id):
            return {
                "text": f"I cannot find a request called {ticket_id} on your account. Check the ID in your confirmation email."
            }

        now = int(time.time() * 1000)
        done = t.status in ("resolved", "closed")
        remaining = (t.resolved_at if done else t.due_at) - now

        assignee_name = "It is waiting to be assigned."
        if t.assignee_id:
            ag_res = await db.execute(select(Agent).where(Agent.id == t.assignee_id))
            ag = ag_res.scalar_one_or_none()
            if ag:
                assignee_name = f"{ag.name} is handling it."
            else:
                assignee_name = f"{t.assignee_id} is handling it."

        if done:
            target_str = ""
        elif remaining > 0:
            target_str = f" The target is {format_duration(remaining)} away."
        else:
            target_str = f" It is past its target by {format_duration(remaining)}."

        status_text = get_status_name(t.status).lower()
        return {
            "text": f"{t.id} “{t.subject}” is {status_text}. {assignee_name}{target_str}",
            "ticket": {
                "id": t.id,
                "subject": t.subject,
                "status": t.status,
                "category": t.category,
                "priority": t.priority,
                "requesterId": t.requester_id
            }
        }

    # 3. Greetings & Courtesy
    if re.match(r"^(hi|hello|hey|namaste)\b", q_clean, re.IGNORECASE):
        return {
            "text": "Hello! What do you need help with today?",
            "chips": PROMPTS[:3]
        }
    if re.search(r"\bthank", q_clean, re.IGNORECASE):
        return {
            "text": "You are welcome. I am here whenever you need me."
        }

    # 4. Knowledge Base suggest
    terms = [w.lower() for w in q_clean.split() if len(w) > 2]
    kb_res = await db.execute(select(KBArticle))
    articles = kb_res.scalars().all()

    scored = []
    for a in articles:
        haystack = f"{a.title} {a.summary} {a.category} {' '.join(str(b) for b in (a.body or []))}".lower()
        score = sum(1 for term in terms if term in haystack)
        if score > 0:
            scored.append((score, a))

    if not scored:
        return {
            "text": "I could not find a matching answer. The fastest way forward is to send the details to the right team.",
            "raise": q_clean
        }

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[0][1]

    # Find steps block
    steps_block = None
    first_p = None
    if top.body and isinstance(top.body, list):
        for b in top.body:
            if isinstance(b, dict):
                if b.get("t") in ("ol", "ul") and steps_block is None:
                    steps_block = b
                if b.get("t") == "p" and first_p is None:
                    first_p = b

    more_articles = []
    for _, art in scored[1:4]:
        more_articles.append({
            "id": art.id,
            "slug": art.slug,
            "title": art.title,
            "category": art.category
        })

    top_dict = {
        "id": top.id,
        "slug": top.slug,
        "title": top.title,
        "category": top.category,
        "summary": top.summary,
        "body": top.body
    }

    return {
        "text": top.summary,
        "article": top_dict,
        "steps": steps_block,
        "more": more_articles,
        "raise": q_clean,
        "first": first_p
    }

@router.post("/ask")
async def assistant_ask(
    req: AssistantAskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ask_assistant(req.question, current_user, db)
