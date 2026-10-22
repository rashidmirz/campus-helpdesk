# Silver Oak Campus Helpdesk - Backend

FastAPI + SQLite (aiosqlite) backend with JWT authentication, role-based access control, and full CRUD APIs for the Silver Oak Campus Helpdesk web application.

---

## Tech Stack
- **Python**: 3.11+
- **Framework**: FastAPI
- **Database**: SQLite (via SQLAlchemy 2.0 async + aiosqlite, with `PRAGMA foreign_keys=ON` and WAL mode)
- **Authentication**: JWT Bearer tokens (`python-jose`) and password hashing with bcrypt (`passlib`)
- **Validation**: Pydantic v2
- **Testing**: pytest & pytest-asyncio

---

## Project Structure
```
backend/
├── app/
│   ├── main.py          # FastAPI application entrypoint & lifespan
│   ├── config.py        # Settings & environment configuration
│   ├── database.py      # Async SQLAlchemy engine & session maker
│   ├── models.py        # Database models & relationships
│   ├── schemas.py       # Pydantic request & response schemas
│   ├── security.py      # Password hashing & JWT helpers
│   ├── deps.py          # Auth dependencies & role enforcement
│   ├── helpers.py       # Categories, status & SLA helpers
│   ├── seed.py          # Database seeding script
│   └── routers/
│       ├── auth.py          # Login, change password, reset password
│       ├── me.py            # Current user profile & settings
│       ├── tickets.py       # Tickets CRUD, SLA, messages, rating, bulk
│       ├── kb.py            # Knowledge base articles & voting
│       ├── notifications.py # User notifications
│       ├── events.py        # Campus events & registration toggle
│       ├── lost_found.py    # Lost & found reporting and claiming
│       ├── fees.py          # Fee dues, payment, receipts
│       ├── exams.py         # Exam timetable & invigilation
│       ├── documents.py     # Certificate requests (linked to tickets)
│       ├── announcements.py # Announcements
│       ├── people.py        # Student/faculty directory & canned replies
│       ├── analytics.py     # Helpdesk SLA & team workload analytics
│       ├── assistant.py     # Oak assistant (built-in KB / AI URL)
│       └── public.py        # Unauthenticated live ticket tracker
├── tests/
│   └── test_api.py      # Pytest test suite
├── uploads/             # Attached ticket files
├── helpdesk.db          # SQLite database (auto-generated)
├── requirements.txt
└── README.md
```

---

## Getting Started

### 1. Windows Setup

```powershell
# In campus-helpdesk/backend:
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies:
pip install -r requirements.txt

# Reset and seed database:
python -m app.seed --reset

# Start backend server:
uvicorn app.main:app --reload --port 8000
```

### 2. macOS / Linux Setup

```bash
# In campus-helpdesk/backend:
python3 -m venv venv
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Reset and seed database:
python3 -m app.seed --reset

# Start backend server:
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
# In campus-helpdesk:
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`
Backend runs at: `http://localhost:8000`
API Documentation (Swagger UI): `http://localhost:8000/docs`

---

## Running Automated Tests

```bash
# Run pytest:
python -m pytest tests/test_api.py -v
```

---

## Login Credentials

### Students (B.Tech, Silver Oak Campus)
| User ID | Name | Email | Password | Role |
|---|---|---|---|---|
| `STU-8842` | Aarav Sharma | aarav.sharma@silveroak.edu.in | `Aarav@2026` | student |
| `STU-8843` | Diya Patel | diya.patel@silveroak.edu.in | `Diya@2026` | student |
| `STU-8844` | Rohan Mehta | rohan.mehta@silveroak.edu.in | `Rohan@2026` | student |
| `STU-8845` | Ananya Iyer | ananya.iyer@silveroak.edu.in | `Ananya@2026` | student |
| `STU-8846` | Kabir Singh | kabir.singh@silveroak.edu.in | `Kabir@2026` | student |

### Faculty
| User ID | Name | Email | Password | Role |
|---|---|---|---|---|
| `FAC-1044` | Dr. Priya Nair | priya.nair@silveroak.edu.in | `Priya@2026` | faculty |
| `FAC-1045` | Dr. Rajesh Kulkarni | rajesh.kulkarni@silveroak.edu.in | `Rajesh@2026` | faculty |
| `FAC-1046` | Dr. Meera Joshi | meera.joshi@silveroak.edu.in | `Meera@2026` | faculty |
| `FAC-1047` | Prof. Arvind Desai | arvind.desai@silveroak.edu.in | `Arvind@2026` | faculty |
| `FAC-1048` | Dr. Sunita Reddy | sunita.reddy@silveroak.edu.in | `Sunita@2026` | faculty |

### Admins (Helpdesk Team)
| User ID | Name | Email | Password | Role |
|---|---|---|---|---|
| `ADM-001` | Vikram Anand | vikram.anand@silveroak.edu.in | `Admin@2026` | admin |
| `ADM-002` | Neha Kapoor | neha.kapoor@silveroak.edu.in | `Admin@2027` | admin |
