CATEGORIES_META = {
    "it": {"name": "IT & Wi-Fi", "team": "IT Services", "icon": "Wifi"},
    "hostel": {"name": "Hostel & Housing", "team": "Hostel Office", "icon": "BedDouble"},
    "acad": {"name": "Academics", "team": "Academic Office", "icon": "GraduationCap"},
    "fees": {"name": "Fees & Scholarships", "team": "Accounts", "icon": "Wallet"},
    "exam": {"name": "Exams & Results", "team": "Exam Cell", "icon": "ClipboardCheck"},
    "lib": {"name": "Library", "team": "Library", "icon": "Library"},
    "transport": {"name": "Transport", "team": "Transport Desk", "icon": "Bus"},
    "facilities": {"name": "Facilities", "team": "Estates", "icon": "Wrench"},
    "cert": {"name": "Certificates", "team": "Records Office", "icon": "FileBadge"},
    "safety": {"name": "Safety & Security", "team": "Campus Security", "icon": "ShieldAlert"},
}

DEFAULT_AGENT_FOR_CATEGORY = {
    "it": "AGT-01",
    "hostel": "AGT-02",
    "fees": "AGT-03",
    "exam": "AGT-04",
    "cert": "AGT-05",
    "facilities": "AGT-06",
    "lib": "AGT-05",
    "transport": "AGT-06",
    "acad": "AGT-04",
    "safety": "AGT-06",
}

STATUSES_META = {
    "new": {"name": "Submitted", "step": 0, "tone": "info"},
    "in_review": {"name": "Under review", "step": 1, "tone": "violet"},
    "in_progress": {"name": "In progress", "step": 2, "tone": "warn"},
    "waiting": {"name": "Waiting on you", "step": 2, "tone": "neutral"},
    "resolved": {"name": "Resolved", "step": 3, "tone": "ok"},
    "closed": {"name": "Closed", "step": 3, "tone": "neutral"},
}

PRIORITIES_META = {
    "low": {"name": "Low", "slaHours": 120, "first": 24},
    "medium": {"name": "Medium", "slaHours": 72, "first": 8},
    "high": {"name": "High", "slaHours": 24, "first": 4},
    "urgent": {"name": "Urgent", "slaHours": 8, "first": 1},
}

def get_category_name(cat_id: str) -> str:
    return CATEGORIES_META.get(cat_id, {}).get("name", cat_id)

def get_category_team(cat_id: str) -> str:
    return CATEGORIES_META.get(cat_id, {}).get("team", "Helpdesk Team")

def get_status_name(status_id: str) -> str:
    return STATUSES_META.get(status_id, {}).get("name", status_id)

def get_sla_hours(priority: str) -> int:
    return PRIORITIES_META.get(priority, {}).get("slaHours", 72)
