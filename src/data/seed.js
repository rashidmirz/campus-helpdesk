// ─────────────────────────────────────────────────────────────────────────────
// Silver Oak University Helpdesk · seed data
// Everything the UI shows comes from here via src/services/api.js.
// Timestamps are generated relative to "now" so SLA clocks look alive in a demo.
// ─────────────────────────────────────────────────────────────────────────────
import { HOUR, DAY } from '../lib/utils';

export const CATEGORIES = [
  { id: 'it', name: 'IT & Wi-Fi', icon: 'Wifi', team: 'IT Services', hint: 'Wi-Fi, portal login, email, lab computers' },
  { id: 'hostel', name: 'Hostel & Housing', icon: 'BedDouble', team: 'Hostel Office', hint: 'Room change, mess, repairs, visitors' },
  { id: 'acad', name: 'Academics', icon: 'GraduationCap', team: 'Academic Office', hint: 'Timetable, attendance, course registration' },
  { id: 'fees', name: 'Fees & Scholarships', icon: 'Wallet', team: 'Accounts', hint: 'Payments, receipts, refunds, scholarships' },
  { id: 'exam', name: 'Exams & Results', icon: 'ClipboardCheck', team: 'Exam Cell', hint: 'Hall tickets, revaluation, marksheets' },
  { id: 'lib', name: 'Library', icon: 'Library', team: 'Library', hint: 'Books, fines, access, e-resources' },
  { id: 'transport', name: 'Transport', icon: 'Bus', team: 'Transport Desk', hint: 'Bus routes, passes, timings' },
  { id: 'facilities', name: 'Facilities', icon: 'Wrench', team: 'Estates', hint: 'Classrooms, AC, projectors, cleanliness' },
  { id: 'cert', name: 'Certificates', icon: 'FileBadge', team: 'Records Office', hint: 'Bonafide, transcripts, NOC, ID card' },
  { id: 'safety', name: 'Safety & Security', icon: 'ShieldAlert', team: 'Campus Security', hint: 'Emergencies, harassment, safe walk' },
];
export const PRIORITIES = [
  { id: 'low', name: 'Low', slaHours: 120, first: 24 },
  { id: 'medium', name: 'Medium', slaHours: 72, first: 8 },
  { id: 'high', name: 'High', slaHours: 24, first: 4 },
  { id: 'urgent', name: 'Urgent', slaHours: 8, first: 1 },
];
export const STATUSES = [
  { id: 'new', name: 'Submitted', step: 0, tone: 'info' },
  { id: 'in_review', name: 'Under review', step: 1, tone: 'violet' },
  { id: 'in_progress', name: 'In progress', step: 2, tone: 'warn' },
  { id: 'waiting', name: 'Waiting on you', step: 2, tone: 'neutral' },
  { id: 'resolved', name: 'Resolved', step: 3, tone: 'ok' },
  { id: 'closed', name: 'Closed', step: 3, tone: 'neutral' },
];

// ── People ──────────────────────────────────────────────────────────────────
export const AGENTS = [
  { id: 'AGT-01', name: 'Meera Iyer', role: 'agent', title: 'IT Services Engineer', team: 'IT Services', email: 'meera.iyer@silveroak.edu.in' },
  { id: 'AGT-02', name: 'Rohan Desai', role: 'agent', title: 'Hostel Coordinator', team: 'Hostel Office', email: 'rohan.desai@silveroak.edu.in' },
  { id: 'AGT-03', name: 'Kavita Nair', role: 'agent', title: 'Accounts Officer', team: 'Accounts', email: 'kavita.nair@silveroak.edu.in' },
  { id: 'AGT-04', name: 'Imran Qureshi', role: 'agent', title: 'Exam Cell Executive', team: 'Exam Cell', email: 'imran.q@silveroak.edu.in' },
  { id: 'AGT-05', name: 'Neha Kapoor', role: 'agent', title: 'Records Assistant', team: 'Records Office', email: 'neha.kapoor@silveroak.edu.in' },
  { id: 'AGT-06', name: 'Suresh Pillai', role: 'agent', title: 'Estates Supervisor', team: 'Estates', email: 'suresh.p@silveroak.edu.in' },
];
export const TEAM_FOR_CATEGORY = Object.fromEntries(CATEGORIES.map(c => [c.id, c.team]));
export const DEFAULT_AGENT_FOR_CATEGORY = { it: 'AGT-01', hostel: 'AGT-02', fees: 'AGT-03', exam: 'AGT-04', cert: 'AGT-05', facilities: 'AGT-06', lib: 'AGT-05', transport: 'AGT-06', acad: 'AGT-04', safety: 'AGT-06' };

export const STUDENTS = [
  { id: 'STU-8842', name: 'Aarav Sharma', course: 'B.Tech CSE', dept: 'CSE', sem: '6th', cgpa: 8.92, attendance: 88.5, status: 'Active', fees: 'Partial', enrollment: 'EN-2023-CS8842', email: 'aarav.sharma@silveroak.edu.in', phone: '+91 98765 43210', hostel: 'Block B · 304' },
  { id: 'STU-8843', name: 'Diya Patel', course: 'B.Tech ECE', dept: 'ECE', sem: '4th', cgpa: 9.15, attendance: 92, status: 'Active', fees: 'Paid', enrollment: 'EN-2023-EC8843', email: 'diya.patel@silveroak.edu.in', phone: '+91 98111 22334', hostel: 'Block C · 112' },
  { id: 'STU-8844', name: 'Rohan Mehta', course: 'B.Tech ME', dept: 'Mech', sem: '2nd', cgpa: 7.8, attendance: 79, status: 'Active', fees: 'Pending', enrollment: 'EN-2024-ME8844', email: 'rohan.mehta@silveroak.edu.in', phone: '+91 99250 11223', hostel: 'Day scholar' },
  { id: 'STU-8845', name: 'Ananya Iyer', course: 'B.Tech Civil', dept: 'Civil', sem: '6th', cgpa: 8.45, attendance: 85.5, status: 'Active', fees: 'Paid', enrollment: 'EN-2022-CV8845', email: 'ananya.iyer@silveroak.edu.in', phone: '+91 98980 44556', hostel: 'Block C · 208' },
  { id: 'STU-8846', name: 'Kabir Singh', course: 'MBA', dept: 'MBA', sem: '3rd', cgpa: 8.7, attendance: 88, status: 'Active', fees: 'Paid', enrollment: 'EN-2024-MB8846', email: 'kabir.singh@silveroak.edu.in', phone: '+91 97270 99887', hostel: 'PG Block · 21' },
  { id: 'STU-8847', name: 'Sneha Joshi', course: 'B.Tech IT', dept: 'IT', sem: '5th', cgpa: 9.3, attendance: 95, status: 'Active', fees: 'Paid', enrollment: 'EN-2022-IT8847', email: 'sneha.joshi@silveroak.edu.in', phone: '+91 98240 77665', hostel: 'Block C · 301' },
  { id: 'STU-8848', name: 'Vivek Gupta', course: 'B.Tech CSE', dept: 'CSE', sem: '3rd', cgpa: 7.6, attendance: 76, status: 'Probation', fees: 'Pending', enrollment: 'EN-2024-CS8848', email: 'vivek.gupta@silveroak.edu.in', phone: '+91 99099 33221', hostel: 'Block A · 118' },
  { id: 'STU-8849', name: 'Pooja Verma', course: 'B.Pharm', dept: 'Pharmacy', sem: '4th', cgpa: 8.25, attendance: 90.5, status: 'Active', fees: 'Paid', enrollment: 'EN-2023-PH8849', email: 'pooja.verma@silveroak.edu.in', phone: '+91 98790 66554', hostel: 'Block C · 115' },
  { id: 'STU-8850', name: 'Aditya Nair', course: 'B.Tech CSE', dept: 'CSE', sem: '6th', cgpa: 8.1, attendance: 83, status: 'Active', fees: 'Paid', enrollment: 'EN-2022-CS8850', email: 'aditya.nair@silveroak.edu.in', phone: '+91 98250 12121', hostel: 'Block B · 210' },
  { id: 'STU-8851', name: 'Meghna Rao', course: 'B.Tech ECE', dept: 'ECE', sem: '2nd', cgpa: 8.8, attendance: 91, status: 'Active', fees: 'Paid', enrollment: 'EN-2024-EC8851', email: 'meghna.rao@silveroak.edu.in', phone: '+91 98255 34343', hostel: 'Block C · 220' },
  { id: 'STU-8852', name: 'Dev Malhotra', course: 'BBA', dept: 'BBA', sem: '4th', cgpa: 7.9, attendance: 81, status: 'Active', fees: 'Partial', enrollment: 'EN-2023-BB8852', email: 'dev.malhotra@silveroak.edu.in', phone: '+91 98260 56565', hostel: 'Day scholar' },
  { id: 'STU-8853', name: 'Ishita Banerjee', course: 'B.Tech IT', dept: 'IT', sem: '3rd', cgpa: 9.0, attendance: 94, status: 'Active', fees: 'Paid', enrollment: 'EN-2024-IT8853', email: 'ishita.b@silveroak.edu.in', phone: '+91 98270 78787', hostel: 'Block C · 305' },
];
export const FACULTY = [
  { id: 'FAC-1044', name: 'Dr. Priya Nair', dept: 'CSE', subject: 'Artificial Intelligence', designation: 'Associate Professor', email: 'priya.nair@silveroak.edu.in', phone: '+91 97654 32109', status: 'Active' },
  { id: 'FAC-1045', name: 'Dr. Rajesh Kulkarni', dept: 'ECE', subject: 'VLSI Design', designation: 'Professor', email: 'rajesh.kulkarni@silveroak.edu.in', phone: '+91 98230 44551', status: 'Active' },
  { id: 'FAC-1046', name: 'Dr. Meera Joshi', dept: 'MBA', subject: 'Marketing', designation: 'Associate Professor', email: 'meera.joshi@silveroak.edu.in', phone: '+91 98450 77882', status: 'Active' },
  { id: 'FAC-1047', name: 'Prof. Arvind Desai', dept: 'Mech', subject: 'Thermodynamics', designation: 'Professor', email: 'arvind.desai@silveroak.edu.in', phone: '+91 98920 11229', status: 'Active' },
  { id: 'FAC-1048', name: 'Dr. Sunita Reddy', dept: 'Civil', subject: 'Structures', designation: 'Professor', email: 'sunita.reddy@silveroak.edu.in', phone: '+91 99887 76655', status: 'Active' },
  { id: 'FAC-1021', name: 'Prof. Dilip Varma', dept: 'Mech', subject: 'Fluid Mechanics', designation: 'Professor', email: 'dilip.varma@silveroak.edu.in', phone: '+91 90123 45678', status: 'Active' },
  { id: 'FAC-1033', name: 'Dr. Kiran Zaveri', dept: 'CSE', subject: 'Distributed Systems', designation: 'Assistant Professor', email: 'kiran.zaveri@silveroak.edu.in', phone: '+91 80012 56789', status: 'Active' },
  { id: 'FAC-1056', name: 'Prof. Ananya Sen', dept: 'CSE', subject: 'Neural Networks', designation: 'Professor', email: 'a.sen@silveroak.edu.in', phone: '+91 91234 56780', status: 'Active' },
];
export const DEPARTMENTS = [
  { id: 'CSE', name: 'Computer Science & Engineering', head: 'Dr. Priya Nair', students: 812, faculty: 46 },
  { id: 'ECE', name: 'Electronics & Communication', head: 'Dr. Rajesh Kulkarni', students: 540, faculty: 32 },
  { id: 'IT', name: 'Information Technology', head: 'Prof. Ananya Sen', students: 498, faculty: 28 },
  { id: 'Mech', name: 'Mechanical Engineering', head: 'Prof. Dilip Varma', students: 460, faculty: 30 },
  { id: 'Civil', name: 'Civil Engineering', head: 'Dr. Sunita Reddy', students: 388, faculty: 24 },
  { id: 'MBA', name: 'Management Studies', head: 'Dr. Meera Joshi', students: 352, faculty: 21 },
  { id: 'Pharmacy', name: 'Pharmacy', head: 'Dr. Nikhil Joshi', students: 410, faculty: 19 },
  { id: 'BBA', name: 'Business Administration', head: 'Prof. Alok Rane', students: 382, faculty: 14 },
];

export const DEMO_USERS = {
  student: { id: 'STU-8842', role: 'student', name: 'Aarav Sharma', email: 'aarav.sharma@silveroak.edu.in', title: 'B.Tech CSE · 6th semester', dept: 'Computer Science & Engineering', phone: '+91 98765 43210', idLabel: 'Enrollment', idValue: 'EN-2023-CS8842', extra: { cgpa: '8.92', attendance: '88.5%', hostel: 'Block B · Room 304', advisor: 'Dr. Priya Nair', batch: '2022 – 2026' } },
  faculty: { id: 'FAC-1044', role: 'faculty', name: 'Dr. Priya Nair', email: 'priya.nair@silveroak.edu.in', title: 'Associate Professor · CSE', dept: 'Computer Science & Engineering', phone: '+91 97654 32109', idLabel: 'Employee ID', idValue: 'EMP-SOU-1044', extra: { subjects: 'AI · Compiler Design · ML Lab', cabin: 'CSE Block · 312', hours: 'Mon & Wed · 2–4 PM', students: '181' } },
  admin: { id: 'ADM-001', role: 'admin', name: 'Vikram Anand', email: 'vikram.anand@silveroak.edu.in', title: 'Helpdesk Lead · Dean’s Office', dept: 'Student Affairs', phone: '+91 79 2630 5000', idLabel: 'Staff ID', idValue: 'ADMIN-SYS-001', extra: { team: 'All teams', queue: 'Full access' } },
};

// ── Tickets ─────────────────────────────────────────────────────────────────
const slaOf = (p) => PRIORITIES.find(x => x.id === p).slaHours * HOUR;

// [id, subject, cat, priority, status, requester, assignee, ageHours, description, thread, extras]
// thread entries: [author|null, type, hoursAfterCreate, text]
const RAW = [
  ['HD-2044', 'Request to change room from B-304', 'hostel', 'medium', 'new', 'STU-8842', null, 2, 'My roommate and I have different study schedules and I would like to move to a single or a quieter block. I have no pending hostel dues. Please tell me what the process is and which rooms are free.', [], { loc: 'Hostel Block B' }],
  ['HD-2041', 'Wi-Fi keeps dropping in Hostel Block B, 3rd floor', 'it', 'high', 'in_progress', 'STU-8842', 'AGT-01', 15, 'Since Saturday the SOU-Secure Wi-Fi disconnects every 10–15 minutes on the 3rd floor of Block B. It reconnects but video calls and portal uploads fail. Three other rooms (302, 305, 309) have the same problem.', [
    [null, 'system', 0.2, 'Request received and routed to IT Services'],
    ['AGT-01', 'public', 1.5, 'Hi Alex, thanks for the details. We can see the access point on B-3F restarting itself. Could you tell us if it happens at a specific time of day?'],
    ['STU-8842', 'public', 3, 'Mostly between 9 PM and midnight when everyone is online. During the day it is fine.'],
    ['AGT-01', 'internal', 4, 'AP-B3-02 logs show memory exhaustion at peak load. Firmware 7.2 has a known leak. Vendor patch ready, needs a maintenance window.'],
    [null, 'system', 4.2, 'Status changed to In progress'],
    ['AGT-01', 'public', 12, 'We have confirmed a firmware fault on the access point serving your floor. A patch is scheduled for tonight 11 PM to midnight. You may lose connection for about 15 minutes.'],
  ], { loc: 'Hostel Block B · 3rd floor', tags: ['network', 'hostel'] }],
  ['HD-2036', 'Hall ticket shows the wrong exam centre', 'exam', 'urgent', 'in_review', 'STU-8842', 'AGT-04', 5, 'My hall ticket for Cloud Computing lists Hall C-12 in the Mechanical Block but my seat allocation email says Hall A-04 in the Academic Block. The exam is in 4 days and I need the correct one.', [
    [null, 'system', 0.1, 'Marked Urgent because an exam is within 7 days'],
    ['AGT-04', 'public', 1.2, 'Thank you for flagging this, Alex. I am checking the seating plan against the hall ticket database. I will update you within two hours.'],
  ], { tags: ['hall-ticket'] }],
  ['HD-2027', 'Lab exam fee still shows ₹450 due after payment', 'fees', 'medium', 'waiting', 'STU-8842', 'AGT-03', 52, 'I paid the ₹450 lab examination fee on 28 Sept through UPI but the fee page still shows it as due. My bank has debited the amount.', [
    ['AGT-03', 'public', 6, 'Hello Alex, we cannot find this payment in the gateway settlement file. Please upload the UPI payment screenshot or the UTR number so we can match it.'],
    [null, 'system', 6.1, 'Status changed to Waiting on you'],
  ], { tags: ['payment'] }],
  ['HD-2009', 'Bonafide certificate for internship application', 'cert', 'low', 'resolved', 'STU-8842', 'AGT-05', 120, 'I need a bonafide certificate addressed to the HR team at Northwind Labs for an internship application. Digital copy with QR verification is fine.', [
    ['AGT-05', 'public', 20, 'Your certificate has been generated with a verification QR. You can download it from the attachment below.'],
    [null, 'system', 20.5, 'Status changed to Resolved'],
  ], { resolvedAfter: 20.5, tags: ['certificate'] }],
  ['HD-1988', 'Library card not scanning at the entry gate', 'lib', 'low', 'closed', 'STU-8842', 'AGT-05', 400, 'My library card shows “invalid” at the turnstile even though the card is active in the portal.', [
    ['AGT-05', 'public', 5, 'We re-encoded the RFID chip. Please try again and tell us if it still fails.'],
    ['STU-8842', 'public', 9, 'Works now, thank you!'],
  ], { resolvedAfter: 10, csat: { rating: 5, comment: 'Quick and friendly.' } }],

  ['HD-2043', 'Projector in Lecture Hall 3 has no HDMI signal', 'facilities', 'high', 'new', 'FAC-1044', null, 1.5, 'The ceiling projector in LH-3 shows “No signal” from both the lectern HDMI and the wireless dongle. I have a 2 PM class with 90 students.', [], { loc: 'Academic Block · LH-3' }],
  ['HD-2040', 'Need seminar hall booked for AI Symposium (24 Oct)', 'facilities', 'medium', 'in_progress', 'FAC-1044', 'AGT-06', 40, 'Request the Main Seminar Hall for the Department AI Symposium on 24 Oct, 9 AM to 4 PM. Expecting 220 attendees. Needs 4 wireless mics and a livestream setup.', [
    ['AGT-06', 'public', 8, 'Seminar Hall is free that day. I have pencilled it in. Sending the AV checklist for your confirmation.'],
  ], {}],
  ['HD-2038', 'Lab network blocks GitHub for ML Lab', 'it', 'medium', 'resolved', 'FAC-1044', 'AGT-01', 90, 'Students in CS604 cannot clone repositories from GitHub in Lab 2. It is needed for this week’s practical.', [
    ['AGT-01', 'public', 12, 'GitHub was in a blocked category by mistake. We have whitelisted it for lab subnets.'],
  ], { resolvedAfter: 13, csat: { rating: 4, comment: 'Fixed the same day.' } }],

  ['HD-2042', 'Mess food quality — repeated complaint, Block A', 'hostel', 'high', 'in_review', 'STU-8848', 'AGT-02', 18, 'The dinner served on Monday and Tuesday had undercooked rice and the dal smelled sour. Several students felt unwell.', [
    ['AGT-02', 'public', 3, 'Thank you for reporting. The mess committee has been informed and an inspection is planned tomorrow morning.'],
    ['AGT-02', 'internal', 3.2, 'Loop in Health Centre. Check last vendor delivery log.'],
  ], { tags: ['health'] }],
  ['HD-2039', 'Cannot log in to student portal: “account locked”', 'it', 'high', 'in_progress', 'STU-8844', 'AGT-01', 26, 'After three wrong password attempts my account got locked and the reset email never arrives.', [
    ['AGT-01', 'public', 2, 'We have unlocked the account. Reset email is failing because your recovery address bounced. Could you confirm your personal email?'],
  ], {}],
  ['HD-2037', 'Revaluation form for Compiler Design not opening', 'exam', 'medium', 'in_progress', 'STU-8850', 'AGT-04', 34, 'The revaluation link shows a blank page on Chrome and Safari. Deadline is Friday.', [
    ['AGT-04', 'public', 10, 'We have reproduced the issue and the portal team is fixing it. We will extend your deadline if it is not live by Thursday.'],
  ], {}],
  ['HD-2035', 'Scholarship instalment not credited', 'fees', 'medium', 'in_progress', 'STU-8845', 'AGT-03', 60, 'Merit scholarship instalment for semester 6 was due on 1 Oct and has not reached my account.', [
    ['AGT-03', 'public', 14, 'The instalment was released by the trust on 8 Oct. Bank processing normally takes 5 working days. I will confirm once credited.'],
  ], {}],
  ['HD-2034', 'Air conditioner not working in Seminar Room 2', 'facilities', 'medium', 'resolved', 'FAC-1056', 'AGT-06', 70, 'AC has been blowing warm air for a week.', [['AGT-06', 'public', 26, 'Compressor gas refilled and filters cleaned.']], { resolvedAfter: 27, csat: { rating: 5, comment: '' } }],
  ['HD-2033', 'Bus route 7 skips Satellite stop', 'transport', 'medium', 'new', 'STU-8846', null, 9, 'Route 7 (morning) has skipped Satellite Crossroads three days in a row. Many of us wait there.', [], { loc: 'Satellite Crossroads' }],
  ['HD-2032', 'Transcript request for MS application', 'cert', 'medium', 'in_progress', 'STU-8847', 'AGT-05', 44, 'Need official transcript with semester 1–5 results sent directly to the university abroad.', [['AGT-05', 'public', 12, 'We are preparing the sealed transcript. Courier option is available for ₹850.']], {}],
  ['HD-2031', 'Library fine waiver after medical leave', 'lib', 'low', 'new', 'STU-8852', null, 12, 'I was on medical leave for 3 weeks and have a ₹240 fine. Please waive it. Certificate attached.', [], {}],
  ['HD-2030', 'Unwanted visitor near Girls Hostel gate at night', 'safety', 'urgent', 'in_progress', 'STU-8849', 'AGT-06', 3, 'A man was waiting near gate 2 of the girls hostel around 10:30 PM and followed two students towards Block C.', [
    ['AGT-06', 'public', 0.4, 'Security has been alerted and a guard is now stationed at gate 2. A patrol has started around Block C. You can reach the control room on 0 79 2630 5099 anytime.'],
    [null, 'system', 0.5, 'Escalated to Campus Security Head'],
  ], { tags: ['safety'] }],
  ['HD-2029', 'Attendance shortfall: need condonation', 'acad', 'medium', 'resolved', 'STU-8848', 'AGT-04', 150, 'My attendance in Data Structures is 72% because of a hospital stay. How do I apply for condonation?', [['AGT-04', 'public', 30, 'Your condonation was approved by the Dean. The updated attendance will reflect in 24 hours.']], { resolvedAfter: 31, csat: { rating: 4, comment: 'Helpful, thanks.' } }],
  ['HD-2028', 'ID card replacement after loss', 'cert', 'low', 'closed', 'STU-8853', 'AGT-05', 210, 'Lost my ID card. Need replacement.', [['AGT-05', 'public', 20, 'New ID card is ready at the Records Office.']], { resolvedAfter: 30, csat: { rating: 5, comment: '' } }],
  ['HD-2026', 'Wi-Fi password not working in Library', 'it', 'low', 'closed', 'STU-8851', 'AGT-01', 230, 'Cannot connect to Library Wi-Fi.', [['AGT-01', 'public', 4, 'Forget the network and reconnect with your portal credentials.']], { resolvedAfter: 4.5, csat: { rating: 3, comment: 'Took a while to hear back.' } }],
  ['HD-2025', 'Room heater needed, Block A is freezing', 'hostel', 'low', 'closed', 'STU-8848', 'AGT-02', 260, 'Request for room heater in A-118.', [['AGT-02', 'public', 50, 'Heater installed.']], { resolvedAfter: 52, csat: { rating: 5, comment: '' } }],
  ['HD-2024', 'Hall ticket missing practical exam entries', 'exam', 'high', 'resolved', 'STU-8853', 'AGT-04', 170, 'Practical exam entries are missing from my hall ticket.', [['AGT-04', 'public', 20, 'Added and re-issued. Please download again.']], { resolvedAfter: 21, csat: { rating: 5, comment: 'Thanks for the quick fix.' } }],
  ['HD-2023', 'Fee refund for cancelled hostel seat', 'fees', 'medium', 'resolved', 'STU-8852', 'AGT-03', 300, 'I cancelled my hostel seat on 1 Sept and need the deposit back.', [['AGT-03', 'public', 90, 'Refund of ₹10,000 initiated to your source account.']], { resolvedAfter: 96, csat: { rating: 4, comment: '' } }],
  ['HD-2022', 'Water cooler leaking in Block B corridor', 'facilities', 'medium', 'closed', 'STU-8850', 'AGT-06', 320, 'Water cooler on B-2F is leaking onto the corridor.', [['AGT-06', 'public', 20, 'Replaced the valve.']], { resolvedAfter: 21, csat: { rating: 4, comment: '' } }],
  ['HD-2021', 'Course registration clash: AI Lab and Networks', 'acad', 'medium', 'closed', 'STU-8850', 'AGT-04', 340, 'AI Lab and Networks both on Wednesday 2 PM.', [['AGT-04', 'public', 40, 'Moved AI Lab to batch B.']], { resolvedAfter: 41, csat: { rating: 5, comment: '' } }],
  ['HD-2020', 'Bus pass renewal failing at payment step', 'transport', 'low', 'closed', 'STU-8846', 'AGT-06', 380, 'Payment fails with error code 51.', [['AGT-06', 'public', 8, 'Gateway issue fixed. Please retry.']], { resolvedAfter: 8.5, csat: { rating: 4, comment: '' } }],
];

export function buildTickets(now = Date.now()) {
  const catName = Object.fromEntries(CATEGORIES.map(c => [c.id, c.name]));
  return RAW.map(([id, subject, category, priority, status, requesterId, assigneeId, age, description, thread, x]) => {
    const createdAt = now - age * HOUR;
    const messages = [{ id: `${id}-m0`, authorId: requesterId, type: 'public', body: description, at: createdAt, attachments: [] }];
    thread.forEach(([authorId, type, h, body], i) => messages.push({ id: `${id}-m${i + 1}`, authorId, type, body, at: createdAt + h * HOUR, attachments: id === 'HD-2009' && i === 0 ? [{ name: 'Bonafide-Certificate.pdf', size: '86 KB' }] : [] }));
    const done = status === 'resolved' || status === 'closed';
    const resolvedAt = done ? createdAt + (x.resolvedAfter ?? age / 2) * HOUR : null;
    const last = messages.reduce((m, c) => Math.max(m, c.at), createdAt);
    return {
      id, subject, description, category, priority, status, requesterId, assigneeId, createdAt,
      updatedAt: Math.max(last, resolvedAt || 0), dueAt: createdAt + slaOf(priority),
      firstResponseAt: messages.find(m => m.authorId?.startsWith('AGT') && m.type === 'public')?.at || null,
      resolvedAt, channel: 'Portal', location: x.loc || '', tags: x.tags || [], csat: x.csat || null,
      messages, categoryName: catName[category],
    };
  }).sort((a, b) => b.createdAt - a.createdAt);
}

// ── Knowledge base ──────────────────────────────────────────────────────────
const P = (t) => ({ t: 'p', v: t }), H = (t) => ({ t: 'h', v: t }), UL = (...v) => ({ t: 'ul', v }), OL = (...v) => ({ t: 'ol', v }), TIP = (t) => ({ t: 'tip', v: t });
export const KB = [
  { id: 'kb1', slug: 'connect-campus-wifi', title: 'Connect to SOU-Secure Wi-Fi on any device', category: 'it', mins: 3, views: 5230, up: 412, down: 18, updated: 6, summary: 'Step-by-step setup for Windows, macOS, Android and iOS, plus fixes for the most common errors.', body: [
    P('SOU-Secure is available in every academic block, the library and all hostels. You sign in with your student portal email and password, so there is no separate Wi-Fi password to remember.'),
    H('Connect your device'),
    OL('Open Wi-Fi settings and choose SOU-Secure.', 'Enter your portal email (name@silveroak.edu.in) as the username.', 'Enter your portal password and accept the certificate when asked.', 'Wait for the “Connected” status. This takes about 10 seconds.'),
    H('If it keeps disconnecting'),
    UL('Forget the network and connect again to clear an old saved password.', 'Turn off “Private Wi-Fi address” (iOS) or “Randomised MAC” (Android) for SOU-Secure.', 'Move closer to the ceiling access point. Thick walls cut the signal.'),
    TIP('Changed your portal password recently? Forget SOU-Secure on every device first. A stale password can lock your account after three attempts.')] },
  { id: 'kb2', slug: 'reset-portal-password', title: 'Reset a forgotten or locked portal password', category: 'it', mins: 2, views: 4410, up: 380, down: 22, updated: 12, summary: 'Use self-service reset, or what to do when the reset email does not arrive.', body: [
    P('Your portal account is locked automatically after three wrong attempts. It unlocks by itself after 30 minutes, or immediately if you reset the password.'),
    OL('Go to the sign-in page and choose “Forgot password”.', 'Enter your university email or enrollment number.', 'Open the reset link sent to your registered personal email. It stays valid for 20 minutes.', 'Choose a new password with at least 10 characters.'),
    TIP('If the email never arrives, your recovery address may be out of date. Raise a request under IT & Wi-Fi and we will verify your identity and update it.')] },
  { id: 'kb3', slug: 'download-hall-ticket', title: 'Download your hall ticket and check your exam seat', category: 'exam', mins: 2, views: 6120, up: 520, down: 31, updated: 3, summary: 'Where to find your hall ticket, what it must show, and who to contact if details are wrong.', body: [
    P('Hall tickets are published 10 days before the first paper. You need a printed or on-screen copy and your university ID card to enter the exam hall.'),
    H('What to check'),
    UL('Your name, enrollment number and photograph', 'The paper list, with date, time and hall', 'Your seat number', 'Practical exam entries if you have lab papers'),
    P('If anything is wrong, raise an Exams & Results request straight away. Attach a photo of the hall ticket. Requests raised within 7 days of an exam are marked Urgent automatically.')] },
  { id: 'kb4', slug: 'pay-fees-and-get-receipts', title: 'Pay fees online and download receipts', category: 'fees', mins: 4, views: 3890, up: 301, down: 14, updated: 9, summary: 'UPI, cards and net banking, due dates, instalments and how long receipts take to appear.', body: [
    P('Fees can be paid from the Fees page. Receipts are generated instantly and also emailed to you.'),
    H('Payment options'),
    UL('UPI: usually confirmed within a minute', 'Debit and credit cards', 'Net banking from 40+ banks', 'Bank challan at the SBI campus branch (receipt takes 2 working days)'),
    TIP('Money debited but fee still showing as due? Wait 30 minutes, then raise a Fees request with the UTR number or a screenshot.')] },
  { id: 'kb5', slug: 'bonafide-certificate', title: 'Apply for a bonafide certificate', category: 'cert', mins: 2, views: 3200, up: 265, down: 9, updated: 15, summary: 'Who can apply, what it costs, and how long it takes.', body: [
    P('A bonafide certificate confirms that you are a current student. It is free for the first copy and ₹50 for each additional copy.'),
    OL('Open Documents and choose “Bonafide certificate”.', 'Tell us who it is addressed to and what it is for.', 'Submit. We will send you updates by email and in your notifications.'),
    P('Most certificates are ready within 2 working days. You will get a PDF with a QR code that anyone can scan to verify it.')] },
  { id: 'kb6', slug: 'hostel-room-change', title: 'Hostel room change: rules and how to apply', category: 'hostel', mins: 3, views: 2780, up: 190, down: 41, updated: 21, summary: 'When room changes are allowed, what the Warden checks, and expected timelines.', body: [
    P('Room changes are reviewed twice a semester, in the first and the seventh week. Emergency changes (safety or health) can be requested at any time.'),
    H('Before you apply'),
    UL('Clear all hostel dues', 'Have your current roommate’s name ready if the request involves swapping', 'Mention your preferred block and floor'),
    P('The Hostel Office replies within 3 working days with available options. Approved changes happen on the following Saturday.')] },
  { id: 'kb7', slug: 'lost-id-card', title: 'Lost your ID card? Get a replacement', category: 'cert', mins: 2, views: 2150, up: 144, down: 6, updated: 30, summary: 'Block your old card, report the loss and collect a new one.', body: [
    P('A lost ID card should be reported at once because it opens hostel and library gates.'),
    OL('Raise a Certificates request titled “ID card replacement”.', 'Pay the ₹200 replacement fee from the Fees page.', 'Collect the new card from the Records Office. It takes 2 working days.'),
    TIP('Found someone else’s card? Post it on Lost & Found or drop it at any security desk.')] },
  { id: 'kb8', slug: 'library-borrow-renew', title: 'Borrow, renew and return library books', category: 'lib', mins: 3, views: 1960, up: 120, down: 7, updated: 40, summary: 'Limits, loan periods, fines and e-resources.', body: [
    P('Undergraduates may borrow 4 books for 14 days. Postgraduates and research scholars may borrow 6 books for 21 days.'),
    UL('Renew twice from the portal if nobody has reserved the book', 'Fine: ₹2 per day per book', 'Journals and e-books are available off campus with your portal login')] },
  { id: 'kb9', slug: 'exam-revaluation', title: 'Exam revaluation and re-totalling', category: 'exam', mins: 3, views: 2640, up: 205, down: 17, updated: 18, summary: 'Eligibility, fees and the timeline for each step.', body: [
    P('You can apply for revaluation within 7 days of results being declared. The fee is ₹500 per paper.'),
    OL('Download your answer script copy (₹300) if you want to review it first.', 'Apply for revaluation from the Exams page.', 'Results of revaluation are published within 15 days.'),
    TIP('Marks can go up, stay the same or go down. The higher of the two is not guaranteed.')] },
  { id: 'kb10', slug: 'bus-routes-passes', title: 'Bus routes, timings and monthly passes', category: 'transport', mins: 2, views: 1730, up: 98, down: 11, updated: 11, summary: 'All 12 routes, how to renew a pass and who to call if a bus is late.', body: [
    P('University buses run on 12 routes from 7:00 AM to 7:30 PM. Passes are monthly (₹1,200) or per semester (₹6,000).'),
    UL('Renew from the Fees page before the 5th of each month', 'Late renewals need a fresh application', 'Live bus status: 0 79 2630 5077')] },
  { id: 'kb11', slug: 'book-seminar-hall', title: 'Book a seminar hall, lab or classroom', category: 'facilities', mins: 2, views: 980, up: 66, down: 4, updated: 50, summary: 'Booking windows, AV support and cancellation.', body: [
    P('Faculty and registered student clubs can request rooms up to 30 days ahead.'),
    OL('Raise a Facilities request with date, time, headcount and needs.', 'Estates confirms availability within one working day.', 'Cancel at least 24 hours ahead so the slot can be reused.')] },
  { id: 'kb12', slug: 'campus-safety-contacts', title: 'Emergency contacts and the Safe Walk service', category: 'safety', mins: 2, views: 4020, up: 360, down: 3, updated: 5, summary: 'Who to call, day or night, and how to request a security escort on campus.', body: [
    P('In an emergency call the 24×7 control room first. Then raise a Safety request so we can follow up.'),
    UL('Control room: 0 79 2630 5099', 'Medical centre: 0 79 2630 5055 (ambulance on call)', 'Safe Walk: request an escort between 8 PM and 6 AM from any security post'),
    TIP('Safety requests always go to the front of the queue. A Campus Security officer will contact you within 15 minutes.')] },
];

// ── Everything else ─────────────────────────────────────────────────────────
export const ANNOUNCEMENTS = [
  { id: 'an1', tone: 'warn', pinned: true, title: 'Network maintenance on Saturday, 11 PM to 2 AM', body: 'Wi-Fi and the student portal will be unavailable in all hostels while we upgrade core switches. Save your work before 11 PM.', by: 'IT Services', at: 5 * HOUR },
  { id: 'an2', tone: 'info', pinned: false, title: 'Mid-semester exam timetable is published', body: 'Papers begin on 20 October. Hall tickets will be available from 10 October on the Exams page.', by: 'Exam Cell', at: 1 * DAY },
  { id: 'an3', tone: 'ok', pinned: false, title: 'Vibrance 2026 registrations are open', body: 'Cultural fest from 14 to 16 November. Register for events before 31 October to get early-bird passes.', by: 'Student Council', at: 2 * DAY },
  { id: 'an4', tone: 'info', pinned: false, title: 'Fee window closes on 25 October', body: 'Pay pending fees before the deadline to avoid a late charge of ₹100 per day.', by: 'Accounts', at: 3 * DAY },
];
export const EVENTS = [
  { id: 'ev1', title: 'BuildFest 2026: 24-hour hackathon', tag: 'Tech', in: 6, time: '9:00 AM', venue: 'Innovation Lab', capacity: 200, registered: 164, desc: 'Teams of up to four build something useful for campus in one day. Mentors from three product companies.' },
  { id: 'ev2', title: 'Guest lecture: Building safe AI systems', tag: 'Talk', in: 9, time: '3:00 PM', venue: 'Main Seminar Hall', capacity: 400, registered: 212, desc: 'A research scientist walks through how large models are tested and monitored in production.' },
  { id: 'ev3', title: 'Career fair: 60 companies on campus', tag: 'Career', in: 14, time: '10:00 AM', venue: 'Central Quadrangle', capacity: 1500, registered: 1140, desc: 'Bring five printed résumés. Walk-in interviews for final-year students in all branches.' },
  { id: 'ev4', title: 'Blood donation camp', tag: 'Community', in: 17, time: '9:30 AM', venue: 'Health Centre', capacity: 150, registered: 61, desc: 'Run with the Red Cross. Free health check-up for every donor.' },
  { id: 'ev5', title: 'Vibrance 2026: cultural fest', tag: 'Culture', in: 33, time: '4:00 PM', venue: 'Open Air Theatre', capacity: 3000, registered: 1822, desc: 'Three days of music, dance, drama and food. Early-bird passes close on 31 October.' },
  { id: 'ev6', title: 'Inter-college cricket: quarter finals', tag: 'Sports', in: 12, time: '8:00 AM', venue: 'Main Ground', capacity: 600, registered: 388, desc: 'Cheer on the Silver Oak Falcons against Nirma and CEPT.' },
];
export const LOST_FOUND = [
  { id: 'LF-105', type: 'lost', title: 'Brown leather notebook, “CS602 Algorithms”', cat: 'Books & notes', place: 'Lecture Hall 3, Academic Block', ago: 3, status: 'Open', by: 'STU-8850', desc: 'Contains handwritten project diagrams and a library slip inside the cover.', reward: true },
  { id: 'LF-104', type: 'found', title: 'Cobalt blue Hydro Flask bottle', cat: 'Personal items', place: 'Gymnasium', ago: 2, status: 'Open', by: 'FAC-1021', desc: 'Has NASA and GitHub stickers. Kept at the sports desk.' },
  { id: 'LF-103', type: 'lost', title: 'Student ID card and bus pass in black pouch', cat: 'Cards & ID', place: 'Food court', ago: 5, status: 'Claimed', by: 'STU-8853', desc: 'CSE department card with a green lanyard.' },
  { id: 'LF-102', type: 'found', title: 'Casio fx-991EX calculator', cat: 'Stationery', place: 'Mechanical Block A, Room 204', ago: 4, status: 'Open', by: 'FAC-1021', desc: 'Initials “R.K.” on the back lid. At the Block A security desk.' },
  { id: 'LF-101', type: 'lost', title: 'Apple AirPods Pro with blue case', cat: 'Electronics', place: 'Central Library, 2nd floor', ago: 1, status: 'Open', by: 'STU-8842', desc: 'Transparent blue silicone cover with a small cat keychain.', reward: true },
  { id: 'LF-100', type: 'found', title: 'Set of three keys on a red ring', cat: 'Keys', place: 'Parking lot P2', ago: 6, status: 'Open', by: 'STU-8847', desc: 'Two small keys and one bike key with a Honda tag.' },
  { id: 'LF-099', type: 'found', title: 'Black umbrella with wooden handle', cat: 'Personal items', place: 'Bus stop, Gate 1', ago: 8, status: 'Open', by: 'STU-8846', desc: 'Left on the bench after the evening rain.' },
  { id: 'LF-098', type: 'lost', title: 'Silver wrist watch, Titan Edge', cat: 'Valuables', place: 'Sports complex changing room', ago: 7, status: 'Open', by: 'STU-8844', desc: 'Engraved “To A. from Dad” on the back.', reward: true },
];
export const EXAMS = [
  { code: 'CS601', name: 'Cloud Computing', in: 8, time: '10:00 AM – 1:00 PM', hall: 'A-04, Academic Block', seat: 'A-04/27', credits: 4, kind: 'Theory' },
  { code: 'CS602', name: 'Advanced Compiler Design', in: 10, time: '2:00 PM – 5:00 PM', hall: 'A-04, Academic Block', seat: 'A-04/27', credits: 4, kind: 'Theory' },
  { code: 'CS603', name: 'Software Architecture', in: 13, time: '10:00 AM – 1:00 PM', hall: 'B-11, Academic Block', seat: 'B-11/09', credits: 3, kind: 'Theory' },
  { code: 'CS604', name: 'Machine Learning Lab', in: 15, time: '9:00 AM – 12:00 PM', hall: 'Lab 2, CSE Block', seat: 'Station 14', credits: 2, kind: 'Practical' },
  { code: 'HS601', name: 'Professional Ethics', in: 18, time: '2:00 PM – 4:00 PM', hall: 'Main Seminar Hall', seat: 'M-212', credits: 2, kind: 'Theory' },
];
export const EXAM_RESOURCES = [
  { id: 'r1', title: 'Cloud Computing: past papers 2021–2025', kind: 'Papers', size: '4.2 MB' },
  { id: 'r2', title: 'Compiler Design: formula and algorithm sheet', kind: 'Notes', size: '1.1 MB' },
  { id: 'r3', title: 'Software Architecture: pattern cheat sheet', kind: 'Notes', size: '860 KB' },
  { id: 'r4', title: 'ML Lab: viva question bank', kind: 'Practice', size: '540 KB' },
  { id: 'r5', title: 'Exam hall rules and calculator policy', kind: 'Policy', size: '210 KB' },
  { id: 'r6', title: 'Revaluation guide and fee schedule', kind: 'Policy', size: '320 KB' },
];
export const FEES = {
  items: [
    { id: 'f1', name: 'Tuition, semester 6', amount: 62500, status: 'paid', paidOn: '12 Aug' },
    { id: 'f2', name: 'Hostel and mess', amount: 38000, status: 'paid', paidOn: '12 Aug' },
    { id: 'f3', name: 'Library and lab', amount: 4500, status: 'paid', paidOn: '12 Aug' },
    { id: 'f4', name: 'Mid-semester exam fee', amount: 1800, status: 'paid', paidOn: '2 Oct' },
    { id: 'f5', name: 'Lab examination fee', amount: 450, status: 'due', due: '25 Oct' },
    { id: 'f6', name: 'Transport pass, Oct–Mar', amount: 6000, status: 'due', due: '31 Oct' },
  ],
};
export const DOCUMENTS = [
  { id: 'd1', name: 'Bonafide certificate', icon: 'BadgeCheck', fee: 0, tat: '2 working days', needs: ['Purpose and addressee'], desc: 'Confirms you are a current student.' },
  { id: 'd2', name: 'Official transcript', icon: 'ScrollText', fee: 300, tat: '5 working days', needs: ['Semesters required', 'Delivery address if couriered'], desc: 'Sealed semester-wise results for admissions or jobs.' },
  { id: 'd3', name: 'Internship NOC', icon: 'Briefcase', fee: 0, tat: '3 working days', needs: ['Offer letter', 'Company, dates, stipend'], desc: 'No-objection letter from your department.' },
  { id: 'd4', name: 'ID card replacement', icon: 'IdCard', fee: 200, tat: '2 working days', needs: ['Passport photo', 'FIR copy if stolen'], desc: 'New card with a fresh QR and RFID chip.' },
  { id: 'd5', name: 'Fee structure certificate', icon: 'ReceiptText', fee: 0, tat: '1 working day', needs: ['Purpose'], desc: 'For education loans and scholarships.' },
  { id: 'd6', name: 'Hostel no-dues certificate', icon: 'KeyRound', fee: 0, tat: '3 working days', needs: ['Room vacated and inspected'], desc: 'Needed when leaving the hostel.' },
];
export const CANNED = [
  { id: 'c1', title: 'Acknowledge and investigate', body: 'Thanks for reaching out. We have picked this up and are looking into it now. We will update you here within {{hours}} hours.' },
  { id: 'c2', title: 'Need more details', body: 'To move this forward we need a little more information. Could you reply with a screenshot or the exact time it happened, and the room or location if relevant?' },
  { id: 'c3', title: 'Fix applied, please confirm', body: 'We have applied a fix. Could you try again and let us know if it works? If it does we will mark this as resolved.' },
  { id: 'c4', title: 'Escalated to department', body: 'This needs a decision from the department. We have escalated it and will update you as soon as we hear back.' },
  { id: 'c5', title: 'Closing the loop', body: 'We have not heard back, so we are marking this as resolved. You can reopen it by replying within 7 days.' },
];

export function buildNotifications(now = Date.now()) {
  const n = (id, forUser, kind, title, body, h, link, read = false) => ({ id, forUser, kind, title, body, at: now - h * HOUR, link, read });
  return [
    n('n1', 'STU-8842', 'reply', 'Meera replied on HD-2041', 'A firmware fix is scheduled tonight at 11 PM.', 2, '/app/tickets/HD-2041'),
    n('n2', 'STU-8842', 'status', 'HD-2036 is now Under review', 'The Exam Cell is checking your seat allocation.', 4, '/app/tickets/HD-2036'),
    n('n3', 'STU-8842', 'action', 'Kavita needs a receipt from you', 'Upload the UPI screenshot on HD-2027 to continue.', 20, '/app/tickets/HD-2027'),
    n('n4', 'STU-8842', 'event', 'BuildFest registrations are open', '36 seats left. Closes in 5 days.', 26, '/app/events', true),
    n('n5', 'STU-8842', 'rate', 'How did we do on HD-2009?', 'Tell us in one tap how the bonafide request went.', 90, '/app/tickets/HD-2009', true),
    n('f1', 'FAC-1044', 'status', 'HD-2040 is In progress', 'Estates has pencilled in the Seminar Hall for 24 Oct.', 8, '/app/tickets/HD-2040'),
    n('f2', 'FAC-1044', 'reply', 'New reply on HD-2043', 'Estates will inspect the projector within 2 hours.', 1, '/app/tickets/HD-2043'),
    n('f3', 'FAC-1044', 'event', 'Guest lecture next week', 'You are listed as session chair.', 30, '/app/events', true),
    n('a1', 'ADM-001', 'sla', '3 requests are about to breach SLA', 'HD-2042, HD-2036 and HD-2030 need attention.', 1, '/app/tickets?sla=at_risk'),
    n('a2', 'ADM-001', 'new', '4 new requests are unassigned', 'Assign them to the right team.', 2, '/app/tickets?assignee=none'),
    n('a3', 'ADM-001', 'csat', 'Satisfaction is up 6 points this week', 'Average rating 4.5 out of 5.', 22, '/app/analytics', true),
  ];
}
