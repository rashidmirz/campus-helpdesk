import asyncio
import sys
import time
from sqlalchemy import select, delete
from app.database import engine, AsyncSessionLocal, Base
from app.models import (
    User, Agent, Ticket, TicketMessage, Attachment, KBArticle, KBVote,
    Notification, Event, EventRegistration, LostFound, Fee, Receipt,
    Exam, Document, Announcement, CannedReply, SavedView, Checklist, UserSettings
)
from app.security import get_password_hash

HOUR = 3600 * 1000
DAY = 24 * HOUR

STUDENT_USERS = [
    {
        "id": "STU-8842",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@silveroak.edu.in",
        "password": "Aarav@2026",
        "title": "B.Tech CSE · 6th semester",
        "dept": "Computer Science & Engineering",
        "phone": "+91 98765 43210",
        "id_label": "Enrollment",
        "id_value": "EN-2023-CS8842",
        "extra": {
            "cgpa": "8.92",
            "attendance": "88.5%",
            "hostel": "Block B · Room 304",
            "advisor": "Dr. Priya Nair",
            "batch": "2022 – 2026",
            "course": "B.Tech CSE",
            "sem": "6th",
            "status": "Active",
            "fees": "Partial"
        }
    },
    {
        "id": "STU-8843",
        "name": "Diya Patel",
        "email": "diya.patel@silveroak.edu.in",
        "password": "Diya@2026",
        "title": "B.Tech ECE · 4th semester",
        "dept": "Electronics & Communication",
        "phone": "+91 98111 22334",
        "id_label": "Enrollment",
        "id_value": "EN-2023-EC8843",
        "extra": {
            "cgpa": "9.15",
            "attendance": "92.0%",
            "hostel": "Block C · Room 112",
            "advisor": "Dr. Rajesh Kulkarni",
            "batch": "2023 – 2027",
            "course": "B.Tech ECE",
            "sem": "4th",
            "status": "Active",
            "fees": "Paid"
        }
    },
    {
        "id": "STU-8844",
        "name": "Rohan Mehta",
        "email": "rohan.mehta@silveroak.edu.in",
        "password": "Rohan@2026",
        "title": "B.Tech ME · 2nd semester",
        "dept": "Mechanical Engineering",
        "phone": "+91 99250 11223",
        "id_label": "Enrollment",
        "id_value": "EN-2024-ME8844",
        "extra": {
            "cgpa": "7.80",
            "attendance": "79.0%",
            "hostel": "Day scholar",
            "advisor": "Prof. Arvind Desai",
            "batch": "2024 – 2028",
            "course": "B.Tech ME",
            "sem": "2nd",
            "status": "Active",
            "fees": "Pending"
        }
    },
    {
        "id": "STU-8845",
        "name": "Ananya Iyer",
        "email": "ananya.iyer@silveroak.edu.in",
        "password": "Ananya@2026",
        "title": "B.Tech Civil · 6th semester",
        "dept": "Civil Engineering",
        "phone": "+91 98980 44556",
        "id_label": "Enrollment",
        "id_value": "EN-2022-CV8845",
        "extra": {
            "cgpa": "8.45",
            "attendance": "85.5%",
            "hostel": "Block C · Room 208",
            "advisor": "Dr. Sunita Reddy",
            "batch": "2022 – 2026",
            "course": "B.Tech Civil",
            "sem": "6th",
            "status": "Active",
            "fees": "Paid"
        }
    },
    {
        "id": "STU-8846",
        "name": "Kabir Singh",
        "email": "kabir.singh@silveroak.edu.in",
        "password": "Kabir@2026",
        "title": "MBA · 3rd semester",
        "dept": "Management Studies",
        "phone": "+91 97270 99887",
        "id_label": "Enrollment",
        "id_value": "EN-2024-MB8846",
        "extra": {
            "cgpa": "8.70",
            "attendance": "88.0%",
            "hostel": "PG Block · Room 21",
            "advisor": "Dr. Meera Joshi",
            "batch": "2024 – 2026",
            "course": "MBA",
            "sem": "3rd",
            "status": "Active",
            "fees": "Paid"
        }
    },
    # Additional students from seed to satisfy tickets & directory
    {
        "id": "STU-8847", "name": "Sneha Joshi", "email": "sneha.joshi@silveroak.edu.in", "password": "Student@2026",
        "title": "B.Tech IT · 5th sem", "dept": "Information Technology", "phone": "+91 98240 77665",
        "id_label": "Enrollment", "id_value": "EN-2022-IT8847",
        "extra": {"cgpa": "9.30", "attendance": "95.0%", "hostel": "Block C · 301", "course": "B.Tech IT", "sem": "5th", "status": "Active", "fees": "Paid"}
    },
    {
        "id": "STU-8848", "name": "Vivek Gupta", "email": "vivek.gupta@silveroak.edu.in", "password": "Student@2026",
        "title": "B.Tech CSE · 3rd sem", "dept": "Computer Science & Engineering", "phone": "+91 99099 33221",
        "id_label": "Enrollment", "id_value": "EN-2024-CS8848",
        "extra": {"cgpa": "7.60", "attendance": "76.0%", "hostel": "Block A · 118", "course": "B.Tech CSE", "sem": "3rd", "status": "Probation", "fees": "Pending"}
    },
    {
        "id": "STU-8849", "name": "Pooja Verma", "email": "pooja.verma@silveroak.edu.in", "password": "Student@2026",
        "title": "B.Pharm · 4th sem", "dept": "Pharmacy", "phone": "+91 98790 66554",
        "id_label": "Enrollment", "id_value": "EN-2023-PH8849",
        "extra": {"cgpa": "8.25", "attendance": "90.5%", "hostel": "Block C · 115", "course": "B.Pharm", "sem": "4th", "status": "Active", "fees": "Paid"}
    },
    {
        "id": "STU-8850", "name": "Aditya Nair", "email": "aditya.nair@silveroak.edu.in", "password": "Student@2026",
        "title": "B.Tech CSE · 6th sem", "dept": "Computer Science & Engineering", "phone": "+91 98250 12121",
        "id_label": "Enrollment", "id_value": "EN-2022-CS8850",
        "extra": {"cgpa": "8.10", "attendance": "83.0%", "hostel": "Block B · 210", "course": "B.Tech CSE", "sem": "6th", "status": "Active", "fees": "Paid"}
    },
    {
        "id": "STU-8851", "name": "Meghna Rao", "email": "meghna.rao@silveroak.edu.in", "password": "Student@2026",
        "title": "B.Tech ECE · 2nd sem", "dept": "Electronics & Communication", "phone": "+91 98255 34343",
        "id_label": "Enrollment", "id_value": "EN-2024-EC8851",
        "extra": {"cgpa": "8.80", "attendance": "91.0%", "hostel": "Block C · 220", "course": "B.Tech ECE", "sem": "2nd", "status": "Active", "fees": "Paid"}
    },
    {
        "id": "STU-8852", "name": "Dev Malhotra", "email": "dev.malhotra@silveroak.edu.in", "password": "Student@2026",
        "title": "BBA · 4th sem", "dept": "Business Administration", "phone": "+91 98260 56565",
        "id_label": "Enrollment", "id_value": "EN-2023-BB8852",
        "extra": {"cgpa": "7.90", "attendance": "81.0%", "hostel": "Day scholar", "course": "BBA", "sem": "4th", "status": "Active", "fees": "Partial"}
    },
    {
        "id": "STU-8853", "name": "Ishita Banerjee", "email": "ishita.b@silveroak.edu.in", "password": "Student@2026",
        "title": "B.Tech IT · 3rd sem", "dept": "Information Technology", "phone": "+91 98270 78787",
        "id_label": "Enrollment", "id_value": "EN-2024-IT8853",
        "extra": {"cgpa": "9.00", "attendance": "94.0%", "hostel": "Block C · 305", "course": "B.Tech IT", "sem": "3rd", "status": "Active", "fees": "Paid"}
    }
]

FACULTY_USERS = [
    {
        "id": "FAC-1044",
        "name": "Dr. Priya Nair",
        "email": "priya.nair@silveroak.edu.in",
        "password": "Priya@2026",
        "title": "Associate Professor · CSE",
        "dept": "Computer Science & Engineering",
        "phone": "+91 97654 32109",
        "id_label": "Employee ID",
        "id_value": "EMP-SOU-1044",
        "extra": {
            "subjects": "AI · Compiler Design · ML Lab",
            "cabin": "CSE Block · 312",
            "hours": "Mon & Wed · 2–4 PM",
            "students": "181",
            "designation": "Associate Professor",
            "status": "Active"
        }
    },
    {
        "id": "FAC-1045",
        "name": "Dr. Rajesh Kulkarni",
        "email": "rajesh.kulkarni@silveroak.edu.in",
        "password": "Rajesh@2026",
        "title": "Professor · ECE",
        "dept": "Electronics & Communication",
        "phone": "+91 98230 44551",
        "id_label": "Employee ID",
        "id_value": "EMP-SOU-1045",
        "extra": {
            "subjects": "VLSI Design · Signals & Systems",
            "cabin": "ECE Block · 204",
            "hours": "Tue & Thu · 3–5 PM",
            "students": "140",
            "designation": "Professor",
            "status": "Active"
        }
    },
    {
        "id": "FAC-1046",
        "name": "Dr. Meera Joshi",
        "email": "meera.joshi@silveroak.edu.in",
        "password": "Meera@2026",
        "title": "Associate Professor · MBA",
        "dept": "Management Studies",
        "phone": "+91 98450 77882",
        "id_label": "Employee ID",
        "id_value": "EMP-SOU-1046",
        "extra": {
            "subjects": "Marketing Strategy · Organizational Behavior",
            "cabin": "MBA Block · 108",
            "hours": "Mon & Fri · 11 AM–1 PM",
            "students": "120",
            "designation": "Associate Professor",
            "status": "Active"
        }
    },
    {
        "id": "FAC-1047",
        "name": "Prof. Arvind Desai",
        "email": "arvind.desai@silveroak.edu.in",
        "password": "Arvind@2026",
        "title": "Professor · ME",
        "dept": "Mechanical Engineering",
        "phone": "+91 98920 11229",
        "id_label": "Employee ID",
        "id_value": "EMP-SOU-1047",
        "extra": {
            "subjects": "Thermodynamics · Fluid Mechanics",
            "cabin": "Mech Block · 301",
            "hours": "Wed & Thu · 2–4 PM",
            "students": "165",
            "designation": "Professor",
            "status": "Active"
        }
    },
    {
        "id": "FAC-1048",
        "name": "Dr. Sunita Reddy",
        "email": "sunita.reddy@silveroak.edu.in",
        "password": "Sunita@2026",
        "title": "Professor · Civil",
        "dept": "Civil Engineering",
        "phone": "+91 99887 76655",
        "id_label": "Employee ID",
        "id_value": "EMP-SOU-1048",
        "extra": {
            "subjects": "Structural Analysis · Geotech",
            "cabin": "Civil Block · 210",
            "hours": "Mon & Wed · 10 AM–12 PM",
            "students": "110",
            "designation": "Professor",
            "status": "Active"
        }
    },
    # Additional faculty for references in tickets / directory
    {
        "id": "FAC-1021", "name": "Prof. Dilip Varma", "email": "dilip.varma@silveroak.edu.in", "password": "Faculty@2026",
        "title": "Professor · Mech", "dept": "Mechanical Engineering", "phone": "+91 90123 45678",
        "id_label": "Employee ID", "id_value": "EMP-SOU-1021",
        "extra": {"subjects": "Thermodynamics", "cabin": "Mech · 204", "designation": "Professor", "status": "Active"}
    },
    {
        "id": "FAC-1033", "name": "Dr. Kiran Zaveri", "email": "kiran.zaveri@silveroak.edu.in", "password": "Faculty@2026",
        "title": "Assistant Professor · CSE", "dept": "Computer Science & Engineering", "phone": "+91 80012 56789",
        "id_label": "Employee ID", "id_value": "EMP-SOU-1033",
        "extra": {"subjects": "Distributed Systems", "cabin": "CSE · 212", "designation": "Assistant Professor", "status": "Active"}
    },
    {
        "id": "FAC-1056", "name": "Prof. Ananya Sen", "email": "a.sen@silveroak.edu.in", "password": "Faculty@2026",
        "title": "Professor · CSE", "dept": "Computer Science & Engineering", "phone": "+91 91234 56780",
        "id_label": "Employee ID", "id_value": "EMP-SOU-1056",
        "extra": {"subjects": "Neural Networks", "cabin": "CSE · 315", "designation": "Professor", "status": "Active"}
    }
]

ADMIN_USERS = [
    {
        "id": "ADM-001",
        "name": "Vikram Anand",
        "email": "vikram.anand@silveroak.edu.in",
        "password": "Admin@2026",
        "title": "Helpdesk Lead · Dean’s Office",
        "dept": "Student Affairs",
        "phone": "+91 79 2630 5000",
        "id_label": "Staff ID",
        "id_value": "ADMIN-SYS-001",
        "extra": {"team": "All teams", "queue": "Full access"}
    },
    {
        "id": "ADM-002",
        "name": "Neha Kapoor",
        "email": "neha.kapoor@silveroak.edu.in",
        "password": "Admin@2027",
        "title": "Senior Helpdesk Operations Lead",
        "dept": "Student Affairs",
        "phone": "+91 79 2630 5001",
        "id_label": "Staff ID",
        "id_value": "ADMIN-SYS-002",
        "extra": {"team": "All teams", "queue": "Full access"}
    }
]

AGENTS = [
    {"id": "AGT-01", "name": "Meera Iyer", "title": "IT Services Engineer", "team": "IT Services", "email": "meera.iyer@silveroak.edu.in", "category_ids": ["it"]},
    {"id": "AGT-02", "name": "Rohan Desai", "title": "Hostel Coordinator", "team": "Hostel Office", "email": "rohan.desai@silveroak.edu.in", "category_ids": ["hostel"]},
    {"id": "AGT-03", "name": "Kavita Nair", "title": "Accounts Officer", "team": "Accounts", "email": "kavita.nair@silveroak.edu.in", "category_ids": ["fees"]},
    {"id": "AGT-04", "name": "Imran Qureshi", "title": "Exam Cell Executive", "team": "Exam Cell", "email": "imran.q@silveroak.edu.in", "category_ids": ["exam", "acad"]},
    {"id": "AGT-05", "name": "Neha Kapoor", "title": "Records Assistant", "team": "Records Office", "email": "neha.kapoor@silveroak.edu.in", "category_ids": ["cert", "lib"]},
    {"id": "AGT-06", "name": "Suresh Pillai", "title": "Estates Supervisor", "team": "Estates", "email": "suresh.p@silveroak.edu.in", "category_ids": ["facilities", "transport", "safety"]},
]

CATEGORIES = [
    {"id": "it", "name": "IT & Wi-Fi", "team": "IT Services"},
    {"id": "hostel", "name": "Hostel & Housing", "team": "Hostel Office"},
    {"id": "acad", "name": "Academics", "team": "Academic Office"},
    {"id": "fees", "name": "Fees & Scholarships", "team": "Accounts"},
    {"id": "exam", "name": "Exams & Results", "team": "Exam Cell"},
    {"id": "lib", "name": "Library", "team": "Library"},
    {"id": "transport", "name": "Transport", "team": "Transport Desk"},
    {"id": "facilities", "name": "Facilities", "team": "Estates"},
    {"id": "cert", "name": "Certificates", "team": "Records Office"},
    {"id": "safety", "name": "Safety & Security", "team": "Campus Security"},
]

RAW_TICKETS = [
    ("HD-2044", "Request to change room from B-304", "hostel", "medium", "new", "STU-8842", None, 2, "My roommate and I have different study schedules and I would like to move to a single or a quieter block. I have no pending hostel dues. Please tell me what the process is and which rooms are free.", [], {"loc": "Hostel Block B"}),
    ("HD-2041", "Wi-Fi keeps dropping in Hostel Block B, 3rd floor", "it", "high", "in_progress", "STU-8842", "AGT-01", 15, "Since Saturday the SOU-Secure Wi-Fi disconnects every 10–15 minutes on the 3rd floor of Block B. It reconnects but video calls and portal uploads fail. Three other rooms (302, 305, 309) have the same problem.", [
        (None, "system", 0.2, "Request received and routed to IT Services"),
        ("AGT-01", "public", 1.5, "Hi Aarav, thanks for the details. We can see the access point on B-3F restarting itself. Could you tell us if it happens at a specific time of day?"),
        ("STU-8842", "public", 3.0, "Mostly between 9 PM and midnight when everyone is online. During the day it is fine."),
        ("AGT-01", "internal", 4.0, "AP-B3-02 logs show memory exhaustion at peak load. Firmware 7.2 has a known leak. Vendor patch ready, needs a maintenance window."),
        (None, "system", 4.2, "Status changed to In progress"),
        ("AGT-01", "public", 12.0, "We have confirmed a firmware fault on the access point serving your floor. A patch is scheduled for tonight 11 PM to midnight. You may lose connection for about 15 minutes."),
    ], {"loc": "Hostel Block B · 3rd floor", "tags": ["network", "hostel"]}),
    ("HD-2036", "Hall ticket shows the wrong exam centre", "exam", "urgent", "in_review", "STU-8842", "AGT-04", 5, "My hall ticket for Cloud Computing lists Hall C-12 in the Mechanical Block but my seat allocation email says Hall A-04 in the Academic Block. The exam is in 4 days and I need the correct one.", [
        (None, "system", 0.1, "Marked Urgent because an exam is within 7 days"),
        ("AGT-04", "public", 1.2, "Thank you for flagging this, Aarav. I am checking the seating plan against the hall ticket database. I will update you within two hours."),
    ], {"tags": ["hall-ticket"]}),
    ("HD-2027", "Lab exam fee still shows ₹450 due after payment", "fees", "medium", "waiting", "STU-8842", "AGT-03", 52, "I paid the ₹450 lab examination fee on 28 Sept through UPI but the fee page still shows it as due. My bank has debited the amount.", [
        ("AGT-03", "public", 6.0, "Hello Aarav, we cannot find this payment in the gateway settlement file. Please upload the UPI payment screenshot or the UTR number so we can match it."),
        (None, "system", 6.1, "Status changed to Waiting on you"),
    ], {"tags": ["payment"]}),
    ("HD-2009", "Bonafide certificate for internship application", "cert", "low", "resolved", "STU-8842", "AGT-05", 120, "I need a bonafide certificate addressed to the HR team at Northwind Labs for an internship application. Digital copy with QR verification is fine.", [
        ("AGT-05", "public", 20.0, "Your certificate has been generated with a verification QR. You can download it from the attachment below."),
        (None, "system", 20.5, "Status changed to Resolved"),
    ], {"resolvedAfter": 20.5, "tags": ["certificate"]}),
    ("HD-1988", "Library card not scanning at the entry gate", "lib", "low", "closed", "STU-8842", "AGT-05", 400, "My library card shows “invalid” at the turnstile even though the card is active in the portal.", [
        ("AGT-05", "public", 5.0, "We re-encoded the RFID chip. Please try again and tell us if it still fails."),
        ("STU-8842", "public", 9.0, "Works now, thank you!"),
    ], {"resolvedAfter": 10.0, "csat": {"rating": 5, "comment": "Quick and friendly."}}),

    ("HD-2043", "Projector in Lecture Hall 3 has no HDMI signal", "facilities", "high", "new", "FAC-1044", None, 1.5, "The ceiling projector in LH-3 shows “No signal” from both the lectern HDMI and the wireless dongle. I have a 2 PM class with 90 students.", [], {"loc": "Academic Block · LH-3"}),
    ("HD-2040", "Need seminar hall booked for AI Symposium (24 Oct)", "facilities", "medium", "in_progress", "FAC-1044", "AGT-06", 40, "Request the Main Seminar Hall for the Department AI Symposium on 24 Oct, 9 AM to 4 PM. Expecting 220 attendees. Needs 4 wireless mics and a livestream setup.", [
        ("AGT-06", "public", 8.0, "Seminar Hall is free that day. I have pencilled it in. Sending the AV checklist for your confirmation."),
    ], {}),
    ("HD-2038", "Lab network blocks GitHub for ML Lab", "it", "medium", "resolved", "FAC-1044", "AGT-01", 90, "Students in CS604 cannot clone repositories from GitHub in Lab 2. It is needed for this week’s practical.", [
        ("AGT-01", "public", 12.0, "GitHub was in a blocked category by mistake. We have whitelisted it for lab subnets."),
    ], {"resolvedAfter": 13.0, "csat": {"rating": 4, "comment": "Fixed the same day."}}),

    ("HD-2042", "Mess food quality — repeated complaint, Block A", "hostel", "high", "in_review", "STU-8848", "AGT-02", 18, "The dinner served on Monday and Tuesday had undercooked rice and the dal smelled sour. Several students felt unwell.", [
        ("AGT-02", "public", 3.0, "Thank you for reporting. The mess committee has been informed and an inspection is planned tomorrow morning."),
        ("AGT-02", "internal", 3.2, "Loop in Health Centre. Check last vendor delivery log."),
    ], {"tags": ["health"]}),
    ("HD-2039", "Cannot log in to student portal: “account locked”", "it", "high", "in_progress", "STU-8844", "AGT-01", 26, "After three wrong password attempts my account got locked and the reset email never arrives.", [
        ("AGT-01", "public", 2.0, "We have unlocked the account. Reset email is failing because your recovery address bounced. Could you confirm your personal email?"),
    ], {}),
    ("HD-2037", "Revaluation form for Compiler Design not opening", "exam", "medium", "in_progress", "STU-8850", "AGT-04", 34, "The revaluation link shows a blank page on Chrome and Safari. Deadline is Friday.", [
        ("AGT-04", "public", 10.0, "We have reproduced the issue and the portal team is fixing it. We will extend your deadline if it is not live by Thursday."),
    ], {}),
    ("HD-2035", "Scholarship instalment not credited", "fees", "medium", "in_progress", "STU-8845", "AGT-03", 60, "Merit scholarship instalment for semester 6 was due on 1 Oct and has not reached my account.", [
        ("AGT-03", "public", 14.0, "The instalment was released by the trust on 8 Oct. Bank processing normally takes 5 working days. I will confirm once credited."),
    ], {}),
    ("HD-2034", "Air conditioner not working in Seminar Room 2", "facilities", "medium", "resolved", "FAC-1056", "AGT-06", 70, "AC has been blowing warm air for a week.", [
        ("AGT-06", "public", 26.0, "Compressor gas refilled and filters cleaned.")
    ], {"resolvedAfter": 27.0, "csat": {"rating": 5, "comment": ""}}),
    ("HD-2033", "Bus route 7 skips Satellite stop", "transport", "medium", "new", "STU-8846", None, 9, "Route 7 (morning) has skipped Satellite Crossroads three days in a row. Many of us wait there.", [], {"loc": "Satellite Crossroads"}),
    ("HD-2032", "Transcript request for MS application", "cert", "medium", "in_progress", "STU-8847", "AGT-05", 44, "Need official transcript with semester 1–5 results sent directly to the university abroad.", [
        ("AGT-05", "public", 12.0, "We are preparing the sealed transcript. Courier option is available for ₹850.")
    ], {}),
    ("HD-2031", "Library fine waiver after medical leave", "lib", "low", "new", "STU-8852", None, 12, "I was on medical leave for 3 weeks and have a ₹240 fine. Please waive it. Certificate attached.", [], {}),
    ("HD-2030", "Unwanted visitor near Girls Hostel gate at night", "safety", "urgent", "in_progress", "STU-8849", "AGT-06", 3, "A man was waiting near gate 2 of the girls hostel around 10:30 PM and followed two students towards Block C.", [
        ("AGT-06", "public", 0.4, "Security has been alerted and a guard is now stationed at gate 2. A patrol has started around Block C. You can reach the control room on 0 79 2630 5099 anytime."),
        (None, "system", 0.5, "Escalated to Campus Security Head"),
    ], {"tags": ["safety"]}),
    ("HD-2029", "Attendance shortfall: need condonation", "acad", "medium", "resolved", "STU-8848", "AGT-04", 150, "My attendance in Data Structures is 72% because of a hospital stay. How do I apply for condonation?", [
        ("AGT-04", "public", 30.0, "Your condonation was approved by the Dean. The updated attendance will reflect in 24 hours.")
    ], {"resolvedAfter": 31.0, "csat": {"rating": 4, "comment": "Helpful, thanks."}}),
    ("HD-2028", "ID card replacement after loss", "cert", "low", "closed", "STU-8853", "AGT-05", 210, "Lost my ID card. Need replacement.", [
        ("AGT-05", "public", 20.0, "New ID card is ready at the Records Office.")
    ], {"resolvedAfter": 30.0, "csat": {"rating": 5, "comment": ""}}),
    ("HD-2026", "Wi-Fi password not working in Library", "it", "low", "closed", "STU-8851", "AGT-01", 230, "Cannot connect to Library Wi-Fi.", [
        ("AGT-01", "public", 4.0, "Forget the network and reconnect with your portal credentials.")
    ], {"resolvedAfter": 4.5, "csat": {"rating": 3, "comment": "Took a while to hear back."}}),
    ("HD-2025", "Room heater needed, Block A is freezing", "hostel", "low", "closed", "STU-8848", "AGT-02", 260, "Request for room heater in A-118.", [
        ("AGT-02", "public", 50.0, "Heater installed.")
    ], {"resolvedAfter": 52.0, "csat": {"rating": 5, "comment": ""}}),
    ("HD-2024", "Hall ticket missing practical exam entries", "exam", "high", "resolved", "STU-8853", "AGT-04", 170, "Practical exam entries are missing from my hall ticket.", [
        ("AGT-04", "public", 20.0, "Added and re-issued. Please download again.")
    ], {"resolvedAfter": 21.0, "csat": {"rating": 5, "comment": "Thanks for the quick fix."}}),
    ("HD-2023", "Fee refund for cancelled hostel seat", "fees", "medium", "resolved", "STU-8852", "AGT-03", 300, "I cancelled my hostel seat on 1 Sept and need the deposit back.", [
        ("AGT-03", "public", 90.0, "Refund of ₹10,000 initiated to your source account.")
    ], {"resolvedAfter": 96.0, "csat": {"rating": 4, "comment": ""}}),
    ("HD-2022", "Water cooler leaking in Block B corridor", "facilities", "medium", "closed", "STU-8850", "AGT-06", 320, "Water cooler on B-2F is leaking onto the corridor.", [
        ("AGT-06", "public", 20.0, "Replaced the valve.")
    ], {"resolvedAfter": 21.0, "csat": {"rating": 4, "comment": ""}}),
    ("HD-2021", "Course registration clash: AI Lab and Networks", "acad", "medium", "closed", "STU-8850", "AGT-04", 340, "AI Lab and Networks both on Wednesday 2 PM.", [
        ("AGT-04", "public", 40.0, "Moved AI Lab to batch B.")
    ], {"resolvedAfter": 41.0, "csat": {"rating": 5, "comment": ""}}),
    ("HD-2020", "Bus pass renewal failing at payment step", "transport", "low", "closed", "STU-8846", "AGT-06", 380, "Payment fails with error code 51.", [
        ("AGT-06", "public", 8.0, "Gateway issue fixed. Please retry.")
    ], {"resolvedAfter": 8.5, "csat": {"rating": 4, "comment": ""}}),
]

SLA_HOURS = {"low": 120, "medium": 72, "high": 24, "urgent": 8}

KB_ARTICLES = [
    {
        "id": "kb1", "slug": "connect-campus-wifi", "title": "Connect to SOU-Secure Wi-Fi on any device", "category": "it", "mins": 3, "views": 5230, "up_count": 412, "down_count": 18, "updated_at": 6,
        "summary": "Step-by-step setup for Windows, macOS, Android and iOS, plus fixes for the most common errors.",
        "body": [
            {"t": "p", "v": "SOU-Secure is available in every academic block, the library and all hostels. You sign in with your student portal email and password, so there is no separate Wi-Fi password to remember."},
            {"t": "h", "v": "Connect your device"},
            {"t": "ol", "v": ["Open Wi-Fi settings and choose SOU-Secure.", "Enter your portal email (name@silveroak.edu.in) as the username.", "Enter your portal password and accept the certificate when asked.", "Wait for the “Connected” status. This takes about 10 seconds."]},
            {"t": "h", "v": "If it keeps disconnecting"},
            {"t": "ul", "v": ["Forget the network and connect again to clear an old saved password.", "Turn off “Private Wi-Fi address” (iOS) or “Randomised MAC” (Android) for SOU-Secure.", "Move closer to the ceiling access point. Thick walls cut the signal."]},
            {"t": "tip", "v": "Changed your portal password recently? Forget SOU-Secure on every device first. A stale password can lock your account after three attempts."}
        ]
    },
    {
        "id": "kb2", "slug": "reset-portal-password", "title": "Reset a forgotten or locked portal password", "category": "it", "mins": 2, "views": 4410, "up_count": 380, "down_count": 22, "updated_at": 12,
        "summary": "Use self-service reset, or what to do when the reset email does not arrive.",
        "body": [
            {"t": "p", "v": "Your portal account is locked automatically after three wrong attempts. It unlocks by itself after 30 minutes, or immediately if you reset the password."},
            {"t": "ol", "v": ["Go to the sign-in page and choose “Forgot password”.", "Enter your university email or enrollment number.", "Open the reset link sent to your registered personal email. It stays valid for 20 minutes.", "Choose a new password with at least 10 characters."]},
            {"t": "tip", "v": "If the email never arrives, your recovery address may be out of date. Raise a request under IT & Wi-Fi and we will verify your identity and update it."}
        ]
    },
    {
        "id": "kb3", "slug": "download-hall-ticket", "title": "Download your hall ticket and check your exam seat", "category": "exam", "mins": 2, "views": 6120, "up_count": 520, "down_count": 31, "updated_at": 3,
        "summary": "Where to find your hall ticket, what it must show, and who to contact if details are wrong.",
        "body": [
            {"t": "p", "v": "Hall tickets are published 10 days before the first paper. You need a printed or on-screen copy and your university ID card to enter the exam hall."},
            {"t": "h", "v": "What to check"},
            {"t": "ul", "v": ["Your name, enrollment number and photograph", "The paper list, with date, time and hall", "Your seat number", "Practical exam entries if you have lab papers"]},
            {"t": "p", "v": "If anything is wrong, raise an Exams & Results request straight away. Attach a photo of the hall ticket. Requests raised within 7 days of an exam are marked Urgent automatically."}
        ]
    },
    {
        "id": "kb4", "slug": "pay-fees-and-get-receipts", "title": "Pay fees online and download receipts", "category": "fees", "mins": 4, "views": 3890, "up_count": 301, "down_count": 14, "updated_at": 9,
        "summary": "UPI, cards and net banking, due dates, instalments and how long receipts take to appear.",
        "body": [
            {"t": "p", "v": "Fees can be paid from the Fees page. Receipts are generated instantly and also emailed to you."},
            {"t": "h", "v": "Payment options"},
            {"t": "ul", "v": ["UPI: usually confirmed within a minute", "Debit and credit cards", "Net banking from 40+ banks", "Bank challan at the SBI campus branch (receipt takes 2 working days)"]},
            {"t": "tip", "v": "Money debited but fee still showing as due? Wait 30 minutes, then raise a Fees request with the UTR number or a screenshot."}
        ]
    },
    {
        "id": "kb5", "slug": "bonafide-certificate", "title": "Apply for a bonafide certificate", "category": "cert", "mins": 2, "views": 3200, "up_count": 265, "down_count": 9, "updated_at": 15,
        "summary": "Who can apply, what it costs, and how long it takes.",
        "body": [
            {"t": "p", "v": "A bonafide certificate confirms that you are a current student. It is free for the first copy and ₹50 for each additional copy."},
            {"t": "ol", "v": ["Open Documents and choose “Bonafide certificate”.", "Tell us who it is addressed to and what it is for.", "Submit. We will send you updates by email and in your notifications."]},
            {"t": "p", "v": "Most certificates are ready within 2 working days. You will get a PDF with a QR code that anyone can scan to verify it."}
        ]
    },
    {
        "id": "kb6", "slug": "hostel-room-change", "title": "Hostel room change: rules and how to apply", "category": "hostel", "mins": 3, "views": 2780, "up_count": 190, "down_count": 41, "updated_at": 21,
        "summary": "When room changes are allowed, what the Warden checks, and expected timelines.",
        "body": [
            {"t": "p", "v": "Room changes are reviewed twice a semester, in the first and the seventh week. Emergency changes (safety or health) can be requested at any time."},
            {"t": "h", "v": "Before you apply"},
            {"t": "ul", "v": ["Clear all hostel dues", "Have your current roommate’s name ready if the request involves swapping", "Mention your preferred block and floor"]},
            {"t": "p", "v": "The Hostel Office replies within 3 working days with available options. Approved changes happen on the following Saturday."}
        ]
    },
    {
        "id": "kb7", "slug": "lost-id-card", "title": "Lost your ID card? Get a replacement", "category": "cert", "mins": 2, "views": 2150, "up_count": 144, "down_count": 6, "updated_at": 30,
        "summary": "Block your old card, report the loss and collect a new one.",
        "body": [
            {"t": "p", "v": "A lost ID card should be reported at once because it opens hostel and library gates."},
            {"t": "ol", "v": ["Raise a Certificates request titled “ID card replacement”.", "Pay the ₹200 replacement fee from the Fees page.", "Collect the new card from the Records Office. It takes 2 working days."]},
            {"t": "tip", "v": "Found someone else’s card? Post it on Lost & Found or drop it at any security desk."}
        ]
    },
    {
        "id": "kb8", "slug": "library-borrow-renew", "title": "Borrow, renew and return library books", "category": "lib", "mins": 3, "views": 1960, "up_count": 120, "down_count": 7, "updated_at": 40,
        "summary": "Limits, loan periods, fines and e-resources.",
        "body": [
            {"t": "p", "v": "Undergraduates may borrow 4 books for 14 days. Postgraduates and research scholars may borrow 6 books for 21 days."},
            {"t": "ul", "v": ["Renew twice from the portal if nobody has reserved the book", "Fine: ₹2 per day per book", "Journals and e-books are available off campus with your portal login"]}
        ]
    },
    {
        "id": "kb9", "slug": "exam-revaluation", "title": "Exam revaluation and re-totalling", "category": "exam", "mins": 3, "views": 2640, "up_count": 205, "down_count": 17, "updated_at": 18,
        "summary": "Eligibility, fees and the timeline for each step.",
        "body": [
            {"t": "p", "v": "You can apply for revaluation within 7 days of results being declared. The fee is ₹500 per paper."},
            {"t": "ol", "v": ["Download your answer script copy (₹300) if you want to review it first.", "Apply for revaluation from the Exams page.", "Results of revaluation are published within 15 days."]},
            {"t": "tip", "v": "Marks can go up, stay the same or go down. The higher of the two is not guaranteed."}
        ]
    },
    {
        "id": "kb10", "slug": "bus-routes-passes", "title": "Bus routes, timings and monthly passes", "category": "transport", "mins": 2, "views": 1730, "up_count": 98, "down_count": 11, "updated_at": 11,
        "summary": "All 12 routes, how to renew a pass and who to call if a bus is late.",
        "body": [
            {"t": "p", "v": "University buses run on 12 routes from 7:00 AM to 7:30 PM. Passes are monthly (₹1,200) or per semester (₹6,000)."},
            {"t": "ul", "v": ["Renew from the Fees page before the 5th of each month", "Late renewals need a fresh application", "Live bus status: 0 79 2630 5077"]}
        ]
    },
    {
        "id": "kb11", "slug": "book-seminar-hall", "title": "Book a seminar hall, lab or classroom", "category": "facilities", "mins": 2, "views": 980, "up_count": 66, "down_count": 4, "updated_at": 50,
        "summary": "Booking windows, AV support and cancellation.",
        "body": [
            {"t": "p", "v": "Faculty and registered student clubs can request rooms up to 30 days ahead."},
            {"t": "ol", "v": ["Raise a Facilities request with date, time, headcount and needs.", "Estates confirms availability within one working day.", "Cancel at least 24 hours ahead so the slot can be reused."]}
        ]
    },
    {
        "id": "kb12", "slug": "campus-safety-contacts", "title": "Emergency contacts and the Safe Walk service", "category": "safety", "mins": 2, "views": 4020, "up_count": 360, "down_count": 3, "updated_at": 5,
        "summary": "Who to call, day or night, and how to request a security escort on campus.",
        "body": [
            {"t": "p", "v": "In an emergency call the 24×7 control room first. Then raise a Safety request so we can follow up."},
            {"t": "ul", "v": ["Control room: 0 79 2630 5099", "Medical centre: 0 79 2630 5055 (ambulance on call)", "Safe Walk: request an escort between 8 PM and 6 AM from any security post"]},
            {"t": "tip", "v": "Safety requests always go to the front of the queue. A Campus Security officer will contact you within 15 minutes."}
        ]
    }
]

EVENTS = [
    {"id": "ev1", "title": "BuildFest 2026: 24-hour hackathon", "tag": "Tech", "in_days": 6, "time": "9:00 AM", "venue": "Innovation Lab", "capacity": 200, "registered_count": 164, "description": "Teams of up to four build something useful for campus in one day. Mentors from three product companies."},
    {"id": "ev2", "title": "Guest lecture: Building safe AI systems", "tag": "Talk", "in_days": 9, "time": "3:00 PM", "venue": "Main Seminar Hall", "capacity": 400, "registered_count": 212, "description": "A research scientist walks through how large models are tested and monitored in production."},
    {"id": "ev3", "title": "Career fair: 60 companies on campus", "tag": "Career", "in_days": 14, "time": "10:00 AM", "venue": "Central Quadrangle", "capacity": 1500, "registered_count": 1140, "description": "Bring five printed résumés. Walk-in interviews for final-year students in all branches."},
    {"id": "ev4", "title": "Blood donation camp", "tag": "Community", "in_days": 17, "time": "9:30 AM", "venue": "Health Centre", "capacity": 150, "registered_count": 61, "description": "Run with the Red Cross. Free health check-up for every donor."},
    {"id": "ev5", "title": "Vibrance 2026: cultural fest", "tag": "Culture", "in_days": 33, "time": "4:00 PM", "venue": "Open Air Theatre", "capacity": 3000, "registered_count": 1822, "description": "Three days of music, dance, drama and food. Early-bird passes close on 31 October."},
    {"id": "ev6", "title": "Inter-college cricket: quarter finals", "tag": "Sports", "in_days": 12, "time": "8:00 AM", "venue": "Main Ground", "capacity": 600, "registered_count": 388, "description": "Cheer on the Silver Oak Falcons against Nirma and CEPT."},
]

LOST_FOUND = [
    {"id": "LF-105", "type": "lost", "title": "Brown leather notebook, “CS602 Algorithms”", "cat": "Books & notes", "place": "Lecture Hall 3, Academic Block", "ago_days": 3, "status": "Open", "by_user": "STU-8850", "desc": "Contains handwritten project diagrams and a library slip inside the cover.", "reward": True},
    {"id": "LF-104", "type": "found", "title": "Cobalt blue Hydro Flask bottle", "cat": "Personal items", "place": "Gymnasium", "ago_days": 2, "status": "Open", "by_user": "FAC-1021", "desc": "Has NASA and GitHub stickers. Kept at the sports desk.", "reward": False},
    {"id": "LF-103", "type": "lost", "title": "Student ID card and bus pass in black pouch", "cat": "Cards & ID", "place": "Food court", "ago_days": 5, "status": "Claimed", "by_user": "STU-8853", "desc": "CSE department card with a green lanyard.", "reward": False},
    {"id": "LF-102", "type": "found", "title": "Casio fx-991EX calculator", "cat": "Stationery", "place": "Mechanical Block A, Room 204", "ago_days": 4, "status": "Open", "by_user": "FAC-1021", "desc": "Initials “R.K.” on the back lid. At the Block A security desk.", "reward": False},
    {"id": "LF-101", "type": "lost", "title": "Apple AirPods Pro with blue case", "cat": "Electronics", "place": "Central Library, 2nd floor", "ago_days": 1, "status": "Open", "by_user": "STU-8842", "desc": "Transparent blue silicone cover with a small cat keychain.", "reward": True},
    {"id": "LF-100", "type": "found", "title": "Set of three keys on a red ring", "cat": "Keys", "place": "Parking lot P2", "ago_days": 6, "status": "Open", "by_user": "STU-8847", "desc": "Two small keys and one bike key with a Honda tag.", "reward": False},
    {"id": "LF-099", "type": "found", "title": "Black umbrella with wooden handle", "cat": "Personal items", "place": "Bus stop, Gate 1", "ago_days": 8, "status": "Open", "by_user": "STU-8846", "desc": "Left on the bench after the evening rain.", "reward": False},
    {"id": "LF-098", "type": "lost", "title": "Silver wrist watch, Titan Edge", "cat": "Valuables", "place": "Sports complex changing room", "ago_days": 7, "status": "Open", "by_user": "STU-8844", "desc": "Engraved “To A. from Dad” on the back.", "reward": True},
]

EXAMS = [
    {"id": "ex1", "code": "CS601", "name": "Cloud Computing", "in_days": 8, "time": "10:00 AM – 1:00 PM", "hall": "A-04, Academic Block", "seat": "A-04/27", "credits": 4, "kind": "Theory", "course": "B.Tech CSE"},
    {"id": "ex2", "code": "CS602", "name": "Advanced Compiler Design", "in_days": 10, "time": "2:00 PM – 5:00 PM", "hall": "A-04, Academic Block", "seat": "A-04/27", "credits": 4, "kind": "Theory", "course": "B.Tech CSE"},
    {"id": "ex3", "code": "CS603", "name": "Software Architecture", "in_days": 13, "time": "10:00 AM – 1:00 PM", "hall": "B-11, Academic Block", "seat": "B-11/09", "credits": 3, "kind": "Theory", "course": "B.Tech CSE"},
    {"id": "ex4", "code": "CS604", "name": "Machine Learning Lab", "in_days": 15, "time": "9:00 AM – 12:00 PM", "hall": "Lab 2, CSE Block", "seat": "Station 14", "credits": 2, "kind": "Practical", "course": "B.Tech CSE"},
    {"id": "ex5", "code": "HS601", "name": "Professional Ethics", "in_days": 18, "time": "2:00 PM – 4:00 PM", "hall": "Main Seminar Hall", "seat": "M-212", "credits": 2, "kind": "Theory", "course": "B.Tech CSE"},
]

FEES_ITEMS = [
    {"id": "f1", "user_id": "STU-8842", "name": "Tuition, semester 6", "amount": 62500, "status": "paid", "paid_on": "12 Aug"},
    {"id": "f2", "user_id": "STU-8842", "name": "Hostel and mess", "amount": 38000, "status": "paid", "paid_on": "12 Aug"},
    {"id": "f3", "user_id": "STU-8842", "name": "Library and lab", "amount": 4500, "status": "paid", "paid_on": "12 Aug"},
    {"id": "f4", "user_id": "STU-8842", "name": "Mid-semester exam fee", "amount": 1800, "status": "paid", "paid_on": "2 Oct"},
    {"id": "f5", "user_id": "STU-8842", "name": "Lab examination fee", "amount": 450, "status": "due", "due_date": "25 Oct"},
    {"id": "f6", "user_id": "STU-8842", "name": "Transport pass, Oct–Mar", "amount": 6000, "status": "due", "due_date": "31 Oct"},
    # Also give fees to other students
    {"id": "f7", "user_id": "STU-8843", "name": "Tuition, semester 4", "amount": 60000, "status": "paid", "paid_on": "10 Aug"},
    {"id": "f8", "user_id": "STU-8844", "name": "Tuition, semester 2", "amount": 58000, "status": "due", "due_date": "25 Oct"},
    {"id": "f9", "user_id": "STU-8845", "name": "Tuition, semester 6", "amount": 62500, "status": "paid", "paid_on": "15 Aug"},
    {"id": "f10", "user_id": "STU-8846", "name": "MBA Tuition, semester 3", "amount": 85000, "status": "paid", "paid_on": "05 Aug"},
]

ANNOUNCEMENTS = [
    {"id": "an1", "tone": "warn", "pinned": True, "title": "Network maintenance on Saturday, 11 PM to 2 AM", "body": "Wi-Fi and the student portal will be unavailable in all hostels while we upgrade core switches. Save your work before 11 PM.", "by_name": "IT Services", "ago_hours": 5},
    {"id": "an2", "tone": "info", "pinned": False, "title": "Mid-semester exam timetable is published", "body": "Papers begin on 20 October. Hall tickets will be available from 10 October on the Exams page.", "by_name": "Exam Cell", "ago_hours": 24},
    {"id": "an3", "tone": "ok", "pinned": False, "title": "Vibrance 2026 registrations are open", "body": "Cultural fest from 14 to 16 November. Register for events before 31 October to get early-bird passes.", "by_name": "Student Council", "ago_hours": 48},
    {"id": "an4", "tone": "info", "pinned": False, "title": "Fee window closes on 25 October", "body": "Pay pending fees before the deadline to avoid a late charge of ₹100 per day.", "by_name": "Accounts", "ago_hours": 72},
]

CANNED = [
    {"id": "c1", "title": "Acknowledge and investigate", "body": "Thanks for reaching out. We have picked this up and are looking into it now. We will update you here within {{hours}} hours."},
    {"id": "c2", "title": "Need more details", "body": "To move this forward we need a little more information. Could you reply with a screenshot or the exact time it happened, and the room or location if relevant?"},
    {"id": "c3", "title": "Fix applied, please confirm", "body": "We have applied a fix. Could you try again and let us know if it works? If it does we will mark this as resolved."},
    {"id": "c4", "title": "Escalated to department", "body": "This needs a decision from the department. We have escalated it and will update you as soon as we hear back."},
    {"id": "c5", "title": "Closing the loop", "body": "We have not heard back, so we are marking this as resolved. You can reopen it by replying within 7 days."},
]

NOTIFICATIONS = [
    ("n1", "STU-8842", "reply", "Meera replied on HD-2041", "A firmware fix is scheduled tonight at 11 PM.", 2, "/app/tickets/HD-2041", False),
    ("n2", "STU-8842", "status", "HD-2036 is now Under review", "The Exam Cell is checking your seat allocation.", 4, "/app/tickets/HD-2036", False),
    ("n3", "STU-8842", "action", "Kavita needs a receipt from you", "Upload the UPI screenshot on HD-2027 to continue.", 20, "/app/tickets/HD-2027", False),
    ("n4", "STU-8842", "event", "BuildFest registrations are open", "36 seats left. Closes in 5 days.", 26, "/app/events", True),
    ("n5", "STU-8842", "rate", "How did we do on HD-2009?", "Tell us in one tap how the bonafide request went.", 90, "/app/tickets/HD-2009", True),
    ("f1", "FAC-1044", "status", "HD-2040 is In progress", "Estates has pencilled in the Seminar Hall for 24 Oct.", 8, "/app/tickets/HD-2040", False),
    ("f2", "FAC-1044", "reply", "New reply on HD-2043", "Estates will inspect the projector within 2 hours.", 1, "/app/tickets/HD-2043", False),
    ("f3", "FAC-1044", "event", "Guest lecture next week", "You are listed as session chair.", 30, "/app/events", True),
    ("a1", "ADM-001", "sla", "3 requests are about to breach SLA", "HD-2042, HD-2036 and HD-2030 need attention.", 1, "/app/tickets?sla=at_risk", False),
    ("a2", "ADM-001", "new", "4 new requests are unassigned", "Assign them to the right team.", 2, "/app/tickets?assignee=none", False),
    ("a3", "ADM-001", "csat", "Satisfaction is up 6 points this week", "Average rating 4.5 out of 5.", 22, "/app/analytics", True),
    ("a4", "ADM-002", "sla", "HD-2036 needs urgent attention", "Exam within 7 days.", 1, "/app/tickets/HD-2036", False),
]

async def seed_database(reset: bool = False):
    async with AsyncSessionLocal() as session:
        if reset:
            print("Resetting database...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
                await conn.run_sync(Base.metadata.create_all)
        else:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            res = await session.execute(select(User))
            if res.first() is not None:
                print("Database already seeded. Skipping.")
                return

        now = int(time.time() * 1000)

        print("Seeding users...")
        all_users = []
        for u in STUDENT_USERS:
            all_users.append(User(
                id=u["id"], role="student", name=u["name"], email=u["email"],
                password_hash=get_password_hash(u["password"]),
                title=u["title"], dept=u["dept"], phone=u["phone"],
                id_label=u["id_label"], id_value=u["id_value"],
                extra=u["extra"], created_at=now - 90 * DAY
            ))
        for u in FACULTY_USERS:
            all_users.append(User(
                id=u["id"], role="faculty", name=u["name"], email=u["email"],
                password_hash=get_password_hash(u["password"]),
                title=u["title"], dept=u["dept"], phone=u["phone"],
                id_label=u["id_label"], id_value=u["id_value"],
                extra=u["extra"], created_at=now - 120 * DAY
            ))
        for u in ADMIN_USERS:
            all_users.append(User(
                id=u["id"], role="admin", name=u["name"], email=u["email"],
                password_hash=get_password_hash(u["password"]),
                title=u["title"], dept=u["dept"], phone=u["phone"],
                id_label=u["id_label"], id_value=u["id_value"],
                extra=u["extra"], created_at=now - 200 * DAY
            ))
        session.add_all(all_users)
        await session.flush()

        print("Seeding agents...")
        agent_objs = [
            Agent(
                id=a["id"], name=a["name"], role="agent", title=a["title"],
                team=a["team"], email=a["email"], category_ids=a["category_ids"]
            )
            for a in AGENTS
        ]
        session.add_all(agent_objs)
        await session.flush()

        print("Seeding tickets & threads...")
        ticket_objs = []
        msg_objs = []
        att_objs = []
        doc_objs = []

        for tid, subj, cat, prio, stat, req_id, asgn_id, age_h, desc, thread, x in RAW_TICKETS:
            created_at = now - int(age_h * HOUR)
            due_at = created_at + SLA_HOURS.get(prio, 72) * HOUR
            done = stat in ("resolved", "closed")
            res_after = x.get("resolvedAfter", age_h / 2) if done else None
            resolved_at = created_at + int(res_after * HOUR) if res_after is not None else None
            csat = x.get("csat")
            csat_rating = csat["rating"] if csat else None
            csat_comment = csat.get("comment", "") if csat else None

            # Build initial message
            m0_id = f"{tid}-m0"
            m0 = TicketMessage(
                id=m0_id, ticket_id=tid, author_id=req_id, type="public",
                body=desc, at=created_at
            )
            msg_objs.append(m0)

            # Thread messages
            last_at = created_at
            first_resp = None
            for idx, (auth, mtype, h_after, body_text) in enumerate(thread):
                mid = f"{tid}-m{idx + 1}"
                mat = created_at + int(h_after * HOUR)
                if mat > last_at:
                    last_at = mat
                if auth and auth.startswith("AGT") and mtype == "public" and first_resp is None:
                    first_resp = mat
                msg_objs.append(TicketMessage(
                    id=mid, ticket_id=tid, author_id=auth, type=mtype,
                    body=body_text, at=mat
                ))
                if tid == "HD-2009" and idx == 0:
                    att_objs.append(Attachment(
                        id=f"att-{tid}", ticket_id=tid, message_id=mid,
                        filename="Bonafide-Certificate.pdf", path="Bonafide-Certificate.pdf",
                        size="86 KB", mime="application/pdf"
                    ))

            updated_at = max(last_at, resolved_at or 0)
            ticket_objs.append(Ticket(
                id=tid, subject=subj, description=desc, category=cat, priority=prio,
                status=stat, requester_id=req_id, assignee_id=asgn_id, channel="Portal",
                location=x.get("loc", ""), tags=x.get("tags", []), created_at=created_at,
                updated_at=updated_at, due_at=due_at, first_response_at=first_resp,
                resolved_at=resolved_at, csat_rating=csat_rating, csat_comment=csat_comment
            ))

            # If document ticket (like HD-2009)
            if cat == "cert":
                doc_objs.append(Document(
                    id=f"doc-{tid}", user_id=req_id, type="cert",
                    name=subj.replace("Request: ", ""), copies=1, note=desc,
                    status="Ready" if stat in ("resolved", "closed") else "Processing",
                    ticket_id=tid
                ))

        session.add_all(ticket_objs)
        await session.flush()
        session.add_all(msg_objs)
        await session.flush()
        session.add_all(att_objs)
        session.add_all(doc_objs)
        await session.flush()

        print("Seeding KB articles...")
        kb_objs = [
            KBArticle(
                id=a["id"], slug=a["slug"], title=a["title"], category=a["category"],
                summary=a["summary"], body=a["body"], views=a["views"], mins=a["mins"],
                up_count=a["up_count"], down_count=a["down_count"], updated_at=a["updated_at"]
            )
            for a in KB_ARTICLES
        ]
        session.add_all(kb_objs)

        print("Seeding events & registrations...")
        event_objs = [
            Event(
                id=e["id"], title=e["title"], tag=e["tag"], in_days=e["in_days"],
                time=e["time"], venue=e["venue"], description=e["description"],
                capacity=e["capacity"], registered_count=e["registered_count"]
            )
            for e in EVENTS
        ]
        session.add_all(event_objs)
        session.add(EventRegistration(user_id="STU-8842", event_id="ev2"))

        print("Seeding lost & found...")
        lf_objs = [
            LostFound(
                id=l["id"], type=l["type"], title=l["title"], cat=l["cat"],
                place=l["place"], desc=l["desc"], status=l["status"],
                by_user=l["by_user"], reward=l["reward"],
                at=now - l["ago_days"] * DAY
            )
            for l in LOST_FOUND
        ]
        session.add_all(lf_objs)

        print("Seeding fees...")
        fee_objs = [
            Fee(
                id=f["id"], user_id=f["user_id"], name=f["name"], amount=f["amount"],
                status=f["status"], due_date=f.get("due_date", ""), paid_on=f.get("paid_on", "")
            )
            for f in FEES_ITEMS
        ]
        session.add_all(fee_objs)

        print("Seeding exams...")
        exam_objs = [
            Exam(
                id=e["id"], code=e["code"], name=e["name"], in_days=e["in_days"],
                time=e["time"], hall=e["hall"], seat=e["seat"], credits=e["credits"],
                kind=e["kind"], course=e["course"], hall_ticket_status="Available"
            )
            for e in EXAMS
        ]
        session.add_all(exam_objs)

        print("Seeding announcements...")
        an_objs = [
            Announcement(
                id=a["id"], tone=a["tone"], pinned=a["pinned"], title=a["title"],
                body=a["body"], by_name=a["by_name"], audience="all",
                at=now - a["ago_hours"] * HOUR
            )
            for a in ANNOUNCEMENTS
        ]
        session.add_all(an_objs)

        print("Seeding canned replies...")
        canned_objs = [
            CannedReply(id=c["id"], title=c["title"], body=c["body"])
            for c in CANNED
        ]
        session.add_all(canned_objs)

        print("Seeding notifications...")
        notif_objs = [
            Notification(
                id=nid, for_user=for_u, kind=k, title=title, body=body,
                link=link, read=read, at=now - h * HOUR
            )
            for (nid, for_u, k, title, body, h, link, read) in NOTIFICATIONS
        ]
        session.add_all(notif_objs)

        print("Seeding user settings & checklist...")
        for u in STUDENT_USERS[:2] + ADMIN_USERS[:1]:
            session.add(UserSettings(
                user_id=u["id"],
                theme={"accent": "indigo", "mode": "light", "radius": "soft"},
                notification_prefs={"email": True, "sms": False, "push": True, "reply": True, "status": True}
            ))

        await session.commit()
        print("Database seeding completed successfully!")

if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    asyncio.run(seed_database(reset=reset_flag))
