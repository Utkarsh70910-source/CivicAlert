# CivicAlert - Community Issue Reporting System

A full-stack municipal grievance reporting and management platform designed to bridge the gap between everyday citizens and municipal authorities. 

---

## 🏛️ Project Architecture & Portals

CivicAlert provides three role-separated interfaces:

1. **Public / Citizen Portal**:
   - Report local civic issues (Roads & Potholes, Streetlights, Garbage & Sanitation, Water & Drainage, Other).
   - Attach photo evidence and location text.
   - Receive an official Reference ID (e.g. `CA-12345` or `CA-100201`).
   - Track complaint resolution in real-time with an interactive 4-stage progress stepper.
   - View assigned field worker name, target completion date, days remaining, and resolution notes.
   - **Privacy Guarantee**: Does not expose citizens' phone numbers or personal names on the public tracking board.

2. **Field Worker Portal** (`/worker/dashboard`, `/worker/complaints/:id`):
   - Secure staff login using **Worker ID** (e.g. `W-101`) and password.
   - Task-oriented dashboard displaying only work assigned to that specific officer.
   - View citizen contact details exclusively for field coordination.
   - Dedicated task inspection & update route (`/worker/complaints/:id`).
   - Update complaint status (`Under Review`, `In Progress`, `Resolved`).
   - Add resolution inspection notes and upload photo proof of completed work.
   - **Cross-Worker Isolation**: Field personnel cannot access administrative features or view/modify tasks assigned to other workers (enforced with 403 Forbidden).

3. **Municipal Admin Portal** (`/admin/dashboard`, `/admin/complaints`, `/admin/workers`, `/admin/complaints/:id`):
   - High-level municipal oversight dashboard.
   - Live aggregated counters (Total Grievances, Submitted, Under Review, In Progress, Resolved, Overdue SLAs).
   - Full complaints roster with text search and filtering by Category, Status, and Overdue status.
   - Dispatch & Assignment: Assign grievances to technicians matching their specialization:
     - Roads & Potholes &rarr; Road Maintenance
     - Streetlights &rarr; Electrician
     - Garbage & Sanitation &rarr; Sanitation
     - Water & Drainage &rarr; Plumbing/Water
     - Other &rarr; Admin Review
   - Worker Management: View field worker roster, specializations, active status, workload counts, and register new workers.

---

## 🚀 Quick Start Guide (Local Development)

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm

---

### 1. Start the Backend API Server

Open a terminal in the project root:

```bash
cd backend
npm install
npm run dev
# or
npm start
```

The Express API server will start on **`http://localhost:5000`**.
- Health Check: `http://localhost:5000/api/health`
- Root Welcome: `http://localhost:5000/`

To run the automated security and RBAC test suite:
```bash
npm test
```

---

### 2. Start the Frontend React Application

Open a second terminal window:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will launch at **`http://localhost:5173`**.

---

## 🔑 Test Credentials (For College Viva & Evaluation)

| Role | Portal URL | Username / Worker ID | Password | Specialization / Department |
|---|---|---|---|---|
| **Municipal Admin** | `/admin/login` | `admin` | `admin123` | City Administration Officer |
| **Field Worker 1** | `/worker/login` | `W-101` or `worker101` | `worker123` | Road Maintenance (*Ramesh Kumar*) |
| **Field Worker 2** | `/worker/login` | `W-102` or `worker102` | `worker123` | Electrician (*Priya Sharma*) |
| **Field Worker 3** | `/worker/login` | `W-103` or `worker103` | `worker123` | Sanitation (*Suresh Patel*) |
| **Field Worker 4** | `/worker/login` | `W-104` or `worker104` | `worker123` | Plumbing/Water (*Anita Desai*) |
| **Field Worker 5** | `/worker/login` | `W-105` or `worker105` | `worker123` | Admin Review (*Vikram Malhotra*) |

*Tip: Quick 1-click test buttons are provided directly on the login pages and tracking page for presentation convenience.*

---

## 📋 Sample Reference IDs for Tracking

Use these IDs on the **Track Complaint** page (`/track`) to demonstrate various workflow stages:

- **`CA-12345`**: Water & Drainage &bull; In Progress (Assigned to Anita Desai, on track)
- **`CA-100201`**: Roads & Potholes &bull; Submitted (New, waiting for admin review & dispatch)
- **`CA-100202`**: Streetlights &bull; In Progress (Assigned to Priya Sharma, on track)
- **`CA-100205`**: Roads & Potholes &bull; In Progress (OVERDUE - Target completion date elapsed)
- **`CA-100206`**: Garbage & Sanitation &bull; Resolved (Cleaned and closed with resolution notes)
- **`CA-100208`**: Water & Drainage &bull; Under Review (Inspecting site with silt-clearing equipment)

---

## 🌐 Full Route Map

### Public Routes
- `/` — Homepage (Hero, Issue Categories, Workflow Overview, Report Modal)
- `/categories` — Dedicated Issue Categories Showcase
- `/report` — Standalone Citizen Issue Report Page
- `/track` — Citizen Complaint Tracking Page (SLA, timeline, assigned worker)
- `/login` — Portal Access Selector

### Field Worker Routes (Protected)
- `/worker/login` — Worker Authentication
- `/worker/dashboard` — Assigned Work List & Quick Updates
- `/worker/complaints/:id` — Task Inspection, Citizen Coordination & Status/Photo Submission

### Municipal Admin Routes (Protected)
- `/admin/login` — Admin Authentication
- `/admin/dashboard` — Overview Statistics, Complaints Roster, Worker Management
- `/admin/complaints` — Filtered & Searchable Complaints Roster
- `/admin/workers` — Worker Roster & Registration
- `/admin/complaints/:id` — Grievance Dossier, Citizen Information & Worker Dispatch

---

## 🛡️ Role-Based Access Control (RBAC) Architecture

- **Backend Enforcement**: Express middleware (`backend/middleware/auth.js`) inspects incoming `Authorization: Bearer <token>` headers. Endpoints verify roles via `authorize(['admin'])` or `authorize(['worker', 'admin'])`. Unauthorized attempts immediately trigger an HTTP `403 Forbidden` response.
- **Cross-Worker Isolation**: Worker B is strictly prevented from reading or modifying Worker A's assigned tasks (`403 Forbidden`).
- **Frontend Guarding**: Protected routes wrap sensitive pages in `<ProtectedRoute allowedRoles={['admin']}>`. Unauthorized visits trigger a dedicated **403 Access Restricted** view rather than an uncaught error.
- **Zero Password Exposure**: API responses sanitize user profiles, omitting password hashes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, Plain Modular CSS, Vite
- **Backend**: Node.js, Express 5, CORS, Dotenv
- **Data Persistence (Today's Milestone)**: In-Memory Data Store (ready for drop-in MongoDB / Mongoose models)

---

## 📅 Roadmap (Future Integration Phases)
- [ ] MongoDB & Mongoose database persistence
- [ ] Production JWT authentication & bcrypt password hashing
- [ ] Google Maps API interactive location picker
- [ ] Cloud file storage (AWS S3 / Cloudinary) for evidence photos
- [ ] Automated Email / SMS notification alerts
- [ ] Docker containerization & production deployment
