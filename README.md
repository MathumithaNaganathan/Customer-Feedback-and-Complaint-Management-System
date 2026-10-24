# ResolveDesk - Customer Feedback & Complaint Management System

A self-contained single-page web application (SPA) built with pure **HTML5, CSS3, and Vanilla JavaScript** utilizing browser **LocalStorage** for data persistence and a banking-grade CRM UI.

---

## 🌟 Key Highlights & Implemented Features

### 1. Admin Authentication System
- **Secure Login Modal**:
  - Gated access to the Admin Dashboard requiring authentication.
  - Pre-configured demo credentials: `admin` / `admin123`.
  - Convenient **Auto-fill** button for quick evaluator testing.
  - Show/Hide password toggle and invalid credential error alerts.
- **Session Tracking via LocalStorage**:
  - Remembers login state across refreshes under `resolveDesk_admin_session_v1`.
- **Top Navigation Indicator & Quick Session End**:
  - Green pulse indicator badge showing **Admin Active** in the header.
  - Instant **Logout** button that ends the session and returns seamlessly to the Customer Portal.

### 2. Customer Portal
- **Complaint & Feedback Submission**:
  - Full Name, Email Address, Category selection (`Service`, `Billing`, `Product`, `Technical Issue`, `Privacy & Security`, `General Feedback`).
  - Interactive **1–5 Star Rating System** with hover feedback and descriptive labels.
  - Subject and Details with live character counter (1000 max).
  - Client-side validation with real-time error states and inline guidance.
  - **Instant Unique Tracking Code**: Generates a distinct reference ID (e.g. `CMP-84920`).
  - **Success Modal**: Shows generated ID with **One-Click Copy** and a direct shortcut button to **Track Status Now**.
- **Real-Time Status Tracking**:
  - Search by Complaint ID.
  - Dynamic 3-stage visual progress timeline (`Submitted` → `In Review` → `Resolved`).
  - Full complaint summary with timestamp, star rating, and official **Admin Resolution Notes**.
  - Quick-click demo pills to test existing complaints immediately.

### 3. Admin Dashboard
- **Dynamic KPI Metric Counters**:
  - **Total Complaints**: All-time submissions count.
  - **Pending Action**: Count of tickets requiring triage (amber badge).
  - **In Progress**: Count of tickets under active investigation (blue badge).
  - **Resolved**: Count of satisfactorily closed tickets (emerald green badge).
  - **Average Satisfaction Rating**: Score out of 5 with dynamic star rendering.
- **Filtering & Live Search**:
  - Live search across Complaint ID, Customer Name, Email, and Subject.
  - Filter by Status (`All`, `Pending`, `In Progress`, `Resolved`).
  - Filter by Category.
  - Sort by Newest, Oldest, Rating (High-to-Low, Low-to-High).
- **Status & Resolution Update Modal**:
  - Inspect customer statements and contact details.
  - Update status (`Pending`, `In Progress`, `Resolved`).
  - Add or update official **Admin Resolution Notes** (instantly reflected on Customer Tracker).
- **Ticket Deletion**:
  - Trash action on table rows with confirmation modal.
  - Permanently removes records from state and LocalStorage.
- **JSON & CSV Data Export**:
  - **Export JSON**: One-click download of formatted JSON database export.
  - **Export CSV**: Download spreadsheet CSV format.
- **Demo Data Restoration**:
  - Ability to reset back to initial realistic banking seed data at any time.

### 4. LocalStorage Persistence
- Automatically populates realistic sample banking tickets if local storage is fresh.
- Synchronizes all customer submissions, admin edits, deletions, and admin sessions in real time.

---

## 🚀 How to Run the Application

### Option 1: Direct Browser Launch (Single-File Self-Contained)
Double-click [index.html](file:///c:/Users/mathu/.gemini/antigravity/scratch/customer-feedback-system/index.html) or open it in any modern web browser:
```text
c:\Users\mathu\.gemini\antigravity\scratch\customer-feedback-system\index.html
```
Because `index.html` embeds the complete CSS and JavaScript logic, it runs standalone with zero local file dependencies!

### Option 2: Local HTTP Server (Node.js)
Run the included lightweight local server:
```powershell
node server.js
```
Then visit **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 📁 File Structure
```text
customer-feedback-system/
├── index.html       # Self-contained Single Page Application (HTML + Embedded CSS & JS)
├── styles.css       # Complete modern CRM & banking stylesheet (Modular)
├── app.js           # Modular client-side JS (LocalStorage, State, UI handlers)
├── server.js        # Lightweight Node.js static HTTP server
└── README.md        # Documentation and feature guide
```
