# Centralized ICT Resource Management System

## University of Zimbabwe

### Complete System Documentation

**Version:** 1.1.0
**Date:** April 2026
**Author:** University of Zimbabwe — ICT Department

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [What the System Does (Overview)](#2-what-the-system-does)
3. [Who Uses the System (User Roles)](#3-who-uses-the-system)
4. [Technology Stack Explained](#4-technology-stack-explained)
5. [System Architecture — How It All Connects](#5-system-architecture)
6. [The Database — Where Data Lives](#6-the-database)
7. [Feature-by-Feature Walkthrough](#7-feature-by-feature-walkthrough)
   - 7.1 [Login Page](#71-login-page)
   - 7.2 [Dashboard](#72-dashboard)
   - 7.3 [Asset Management](#73-asset-management)
   - 7.4 [Fault Reporting](#74-fault-reporting)
   - 7.5 [Maintenance Tracking](#75-maintenance-tracking)
   - 7.6 [Allocation & Movement Tracking](#76-allocation--movement-tracking)
   - 7.7 [Reports](#77-reports)
   - 7.8 [User Management](#78-user-management)
   - 7.9 [Software Asset Tracking](#79-software-asset-tracking)
   - 7.10 [Service Requests](#710-service-requests)
8. [File Structure — What Each File Does](#8-file-structure)
9. [How Data Flows Through the System](#9-how-data-flows)
10. [Security — How the System Stays Safe](#10-security)
11. [Glossary of Terms](#11-glossary-of-terms)

---

## 1. Introduction

This document explains the **Centralized ICT Resource Management System** built for the University of Zimbabwe. It is written for someone who may not have a programming background but needs to understand what the system does, how it works, and how every part connects together.

### What Problem Does This Solve?

The University of Zimbabwe manages hundreds of ICT (Information and Communications Technology) assets — computers, printers, servers, projectors, network equipment, and more — spread across many departments. Before this system:

- There was no single place to see all ICT assets.
- When equipment broke down, there was no organised way to report and track the fault.
- Maintenance records were scattered or missing.
- Moving equipment between departments left no paper trail.
- Generating reports for management was slow and manual.

This system solves all of these problems by putting everything into one web-based application that any authorised staff member can access from a browser.

---

## 2. What the System Does

At a high level, the system performs **seven core functions**:

| Function | What It Means |
|---|---|
| **Register Assets** | Record every ICT asset — its name, serial number, location, department, assigned user, and current condition. |
| **Track Assets** | Know where every asset is at all times. When an asset moves between departments, the system records who moved it, where it came from, and where it went. |
| **Report Faults** | Any user can report that a piece of equipment is broken. The report goes into a queue that ICT technicians can review. |
| **Track Maintenance** | When a technician fixes something, the system records what was wrong, what they did, how much it cost, and when it was completed. |
| **Generate Reports** | Managers can pull reports showing all assets, faulty assets, maintenance history, department breakdowns, and allocation history — and export them to HTML or CSV files. |
| **Manage Software Licences** | Track all software licences across departments, including vendor, version, seat count, expiry dates, and licence type. The system automatically flags licences that are expiring soon or have expired. |
| **Handle Service Requests** | Any user can raise a formal request for new equipment, software, network support, or other ICT services. Admins and technicians can review, approve, and fulfil these requests. |

---

## 3. Who Uses the System

The system has three types of users, called **roles**. Each role can see and do different things:

### 3.1 Administrator (Admin)

The admin has **full control** over the entire system. They can:

- View and manage all ICT assets across every department.
- Add, edit, and delete assets.
- Manage fault reports and maintenance records.
- Move assets between departments (allocations).
- Generate and export any report.
- **Add new users**, change their roles, and deactivate accounts.
- Access the **User Management** page (no other role can).

### 3.2 ICT Technician

Technicians are the hands-on ICT staff who fix equipment. They can:

- View and manage all ICT assets across every department.
- Add, edit, and delete assets.
- Review the fault queue and update fault statuses.
- Create and update maintenance records (they are auto-assigned as the technician).
- Move assets between departments and mark allocations as returned.
- Manage software assets and update service requests.
- Generate and export reports.

They **cannot** manage other users — that is admin-only.

### 3.3 Department Representative

These are ordinary staff members representing their department. They have the most restricted access:

- View only their **own department's** assets.
- Report faults on equipment in their department.
- View fault reports related to their department.
- View maintenance records and allocation history (read-only).
- **Submit service requests** for their department.
- Generate reports (read-only).

They **cannot** add or edit assets, create maintenance records, move assets, or manage software licences.

### How the System Decides What to Show

When a user logs in, the system reads their role from the database and:

1. **Hides buttons** they should not use (e.g., "Add Asset" is hidden from department reps).
2. **Redirects them away** from pages they cannot access (e.g., a technician trying to visit the User Management page is sent back to the Dashboard).
3. **Filters data** so department reps only see their own department's assets and faults.

---

## 4. Technology Stack Explained

This section explains each technology used and its role in simple terms.

### 4.1 Frontend (What the User Sees)

| Technology | What It Does |
|---|---|
| **HTML** | The structure of every page — headings, tables, forms, buttons. Think of it as the skeleton. |
| **CSS** | The visual styling — colours, spacing, fonts, shadows. Think of it as the skin and clothing. |
| **JavaScript (JS)** | The behaviour — what happens when you click a button, how data loads, how forms submit. Think of it as the brain. |
| **Bootstrap 5** | A popular styling library that provides ready-made components like modals (pop-up dialogs), form controls, and grid layouts. Saves time so we don't build everything from scratch. |
| **Bootstrap Icons** | A set of small vector icons (e.g., a pencil for "edit", a trash can for "delete") used throughout the interface. |
| **Google Fonts (Inter)** | A clean, modern typeface loaded from Google's servers, giving the interface a professional look. |

### 4.2 Backend (Where Data Is Stored and Processed)

| Technology | What It Does |
|---|---|
| **Supabase** | An online service that provides a database, user authentication (login system), and security rules — all without needing to write a traditional server. Think of it as the "engine room" that lives in the cloud. |
| **PostgreSQL** | The specific type of database Supabase uses. It stores all the tables (assets, faults, users, etc.) and is very reliable and fast. |
| **Supabase Auth** | The login system. It handles passwords securely, creates session tokens (a kind of digital ID card), and knows who is currently logged in. |
| **Row Level Security (RLS)** | A database-level security feature. Even if someone tries to access data directly (bypassing the interface), the database itself enforces rules — e.g., "department reps can only see their own department's assets." |

### 4.3 How They Connect

```
┌─────────────────────────────────────────────┐
│              USER'S BROWSER                  │
│                                              │
│  HTML Pages ←→ CSS Styling                   │
│       ↕                                      │
│  JavaScript Logic (loads data, handles       │
│  clicks, updates the page)                   │
│       ↕                                      │
│  Supabase JS Client Library                  │
│  (translates JS requests into database       │
│   queries over the internet)                 │
└──────────────────────┬──────────────────────┘
                       │ HTTPS (encrypted internet connection)
                       ↓
┌─────────────────────────────────────────────┐
│         SUPABASE CLOUD SERVICE               │
│                                              │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Auth Service │  │ PostgreSQL Database   │  │
│  │ (login,      │  │ (tables, data,       │  │
│  │  sessions)   │  │  security policies)  │  │
│  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────┘
```

The key insight is: **there is no custom server**. The JavaScript running in the user's browser talks directly to Supabase over a secure internet connection. Supabase handles storing data, checking passwords, and enforcing security rules.

---

## 5. System Architecture

### 5.1 Page-by-Page Architecture

Every page (except the login page) follows the same pattern:

```
┌──────────────────────────────────────────────────────┐
│  HTML Page (e.g., assets.html)                        │
│                                                       │
│  Loads these scripts in order:                        │
│  1. Bootstrap CSS        (styling library)            │
│  2. Bootstrap Icons      (icon library)               │
│  3. Custom CSS           (our own styling)            │
│  4. Bootstrap JS         (modal/dropdown behaviour)   │
│  5. Supabase JS Client   (database communication)     │
│  6. config.js            (shared settings & helpers)  │
│  7. sidebar.js           (navigation menu)            │
│  8. auth.js              (login check & role access)  │
│  9. [page-specific].js   (e.g., assets.js)            │
└──────────────────────────────────────────────────────┘
```

### 5.2 What Happens When a Page Loads

1. **Browser downloads the HTML file** and all linked CSS/JS files.
2. **`auth.js` runs first** — it asks Supabase: "Is there a logged-in user?" If not, it redirects to the login page.
3. If there is a user, `auth.js` **fetches their profile** from the database (name, role, department).
4. `auth.js` calls **`updateUserUI()`** — this puts the user's name and initials in the top-right corner.
5. `auth.js` calls **`checkRoleAccess()`** — this shows or hides buttons depending on the user's role.
6. **The page-specific JavaScript runs** (e.g., `assets.js`), which loads data from the database and fills the page with content.

### 5.3 The Sidebar (Navigation Menu)

The sidebar is the vertical menu on the left side of every page. It is **not written into each HTML file separately**. Instead, a file called `sidebar.js` contains the sidebar's HTML as a template and injects it into the page when it loads. This means:

- If we need to add a new menu item, we only change one file (`sidebar.js`).
- The "active" state (highlighted current page) is determined by passing the page name to the `initSidebar()` function.
- The **User Management** link has a special `admin-only` class, so it is hidden from non-admin users.
- The **Sign Out** button at the bottom calls the `logout()` function.

---

## 6. The Database

### 6.1 What Is a Database?

A database is a structured collection of information, like a very sophisticated spreadsheet. Instead of one big sheet, the data is organised into **tables**, each dedicated to a specific type of information.

### 6.2 The Tables

This system has **9 tables**. Here is what each one stores:

#### `departments`
Stores the university's departments.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `a1b2c3d4-...` |
| name | Department name | "Computer Science" |
| code | Short code | "CS" |
| description | Brief description | "Department of Computer Science" |

**Sample departments:** Computer Science, Information Systems, Library, Administration, Engineering, ICT Services.

---

#### `categories`
Stores the types of ICT equipment.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `e5f6g7h8-...` |
| name | Category name | "Laptop" |
| description | Brief description | "Portable computers" |

**Sample categories:** Desktop Computer, Laptop, Printer, Network Equipment, Server, Monitor, Projector, UPS, Scanner, Other.

---

#### `profiles`
Stores information about each system user. This table is linked to Supabase's built-in authentication system.

| Column | What It Stores | Example |
|---|---|---|
| id | Links to the authentication user | `u1v2w3x4-...` |
| email | User's email | "admin@uz.ac.zw" |
| full_name | User's full name | "John Moyo" |
| role | One of: admin, technician, department_rep | "admin" |
| department_id | Links to departments table | `a1b2c3d4-...` |
| is_active | Whether the account is enabled | true |

When a new user is created in Supabase Auth, a **database trigger** (an automatic action) creates a matching row in this `profiles` table.

---

#### `ict_assets`
The main table — stores every ICT asset.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `i1j2k3l4-...` |
| asset_tag | Human-readable ID | "UZ-ICT-0042" |
| name | Asset name | "Dell Latitude 5520" |
| description | Details about the asset | "Staff laptop, 16GB RAM" |
| category_id | Links to categories table | `e5f6g7h8-...` |
| department_id | Links to departments table | `a1b2c3d4-...` |
| serial_number | Manufacturer's serial number | "SN-ABC-12345" |
| status | Current condition | "active" / "faulty" / "under_maintenance" / "disposed" |
| purchase_date | When it was bought | 2023-03-15 |
| warranty_expiry | When warranty expires | 2026-03-15 |
| assigned_user | Person currently using it | "Jane Doe" |
| location | Physical location | "Room 204, Main Building" |

---

#### `fault_reports`
Stores reports of broken or malfunctioning equipment.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `f1g2h3i4-...` |
| asset_id | Which asset is faulty | (links to ict_assets) |
| reported_by | Who reported the fault | (links to profiles) |
| description | What is wrong | "Screen flickering intermittently" |
| priority | How urgent | "low" / "medium" / "high" / "critical" |
| status | Current progress | "reported" / "in_progress" / "resolved" / "closed" |
| resolution_notes | How it was fixed | "Replaced display cable" |

---

#### `maintenance_records`
Stores records of repair and maintenance work.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `m1n2o3p4-...` |
| asset_id | Which asset was serviced | (links to ict_assets) |
| fault_report_id | Related fault report (if any) | (links to fault_reports) |
| technician_id | Who performed the work | (links to profiles) |
| maintenance_type | Type of maintenance | "preventive" / "corrective" / "emergency" |
| description | What was the problem | "Hard drive making clicking noises" |
| actions_taken | What the technician did | "Replaced HDD with SSD" |
| status | Current progress | "scheduled" / "in_progress" / "completed" / "cancelled" |
| scheduled_date | When work is planned | 2024-06-01 |
| completed_date | When work was finished | 2024-06-03 |
| cost | Repair cost in USD | 150.00 |

---

#### `allocations`
Stores the history of asset movements between departments.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `a1l2l3o4-...` |
| asset_id | Which asset moved | (links to ict_assets) |
| from_department_id | Where it came from | (links to departments) |
| to_department_id | Where it went to | (links to departments) |
| allocated_by | Who approved the move | (links to profiles) |
| assigned_to | Person receiving the asset | "Blessing Moyo" |
| return_date | Expected or actual return date | 2025-06-30 |
| status | Current allocation status | "active" / "returned" / "cancelled" |
| notes | Reason for the move | "Needed in new lab" |
| created_at | When the move happened | 2024-06-15 10:30:00 |

---

#### `software_assets`
Stores all software licences managed by the ICT department.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `s1t2u3v4-...` |
| name | Software name | "Microsoft Office 365" |
| vendor | Software manufacturer | "Microsoft" |
| version | Version number | "365" |
| license_key | Licence key (stored securely) | "XXXXX-XXXXX-..." |
| license_type | Type of licence | "perpetual" / "subscription" / "open_source" / "freeware" |
| total_seats | Number of user seats | 50 |
| department_id | Which department uses it (NULL = university-wide) | (links to departments) |
| status | Current licence status | "active" / "expired" / "discontinued" |
| purchase_date | When it was purchased | 2024-01-01 |
| license_expiry | When the licence expires | 2025-12-31 |
| cost | Licence cost in USD | 4500.00 |
| notes | Additional details | "University-wide volume licence" |

---

#### `service_requests`
Stores formal ICT service requests raised by staff.

| Column | What It Stores | Example |
|---|---|---|
| id | Unique identifier | `r1q2p3o4-...` |
| title | Short title | "10 New Desktops for CS Lab" |
| request_type | Category of request | "new_equipment" / "repair" / "software" / "network" / "support" / "other" |
| description | Full description of the need | "Lab is at full capacity..." |
| priority | How urgent | "low" / "medium" / "high" / "critical" |
| status | Current progress | "pending" / "approved" / "rejected" / "in_progress" / "fulfilled" |
| department_id | Requesting department | (links to departments) |
| requested_by | Who submitted the request | (links to profiles) |
| assigned_to | Which technician is handling it | (links to profiles) |
| admin_notes | Notes from admin/technician | "Procurement order raised" |
| created_at | When submitted | 2025-04-10 09:00:00 |

---

### 6.3 How Tables Are Connected

The tables are linked together using **foreign keys** — a column in one table that points to a row in another table. This diagram shows the relationships:

```
                    ┌──────────────┐
                    │  departments │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────┴──────┐  ┌─────┴──────┐  ┌──────┴──────┐
   │   profiles  │  │ ict_assets │  │ allocations │
   │  (users)    │  │            │  │ (from/to    │
   └──────┬──────┘  └─────┬──────┘  │  department)│
          │                │         └─────────────┘
          │         ┌──────┴──────────────┐
          │         │                     │
   ┌──────┴──────┐  │              ┌──────┴────────┐
   │fault_reports├──┘              │ maintenance   │
   │             │◄────────────────│ _records      │
   └─────────────┘                 └───────────────┘
                                          │
                              ┌────────────┘
                              │
                    ┌─────────┴──┐
                    │ categories │
                    └────────────┘
```

**Key relationships:**
- An **asset** belongs to a **department** and a **category**.
- A **fault report** references an **asset** and the **user** who reported it.
- A **maintenance record** references an **asset**, optionally a **fault report**, and the **technician**.
- An **allocation** references an **asset**, a **from department**, a **to department**, and the **user** who approved it.
- A **software asset** optionally belongs to a specific **department** (NULL = university-wide).
- A **service request** belongs to a **department** and references the **user** who submitted it.
- A **profile (user)** belongs to a **department**.

---

## 7. Feature-by-Feature Walkthrough

### 7.1 Login Page

**File:** `index.html` + `auth.js`

**What the user sees:** A centered card with the system logo, an email field, a password field, and a "Sign in" button.

**How it works, step by step:**

1. The user types their email and password and clicks **Sign in**.
2. JavaScript captures the form submission and prevents the page from reloading.
3. The `signInWithPassword()` function sends the credentials to Supabase Auth over an encrypted connection.
4. Supabase checks if the email exists and if the password matches.
5. If the credentials are wrong, Supabase returns an error and the system shows a red alert message.
6. If the credentials are correct, the system then checks the `profiles` table to confirm:
   - The user's profile exists.
   - The `is_active` field is `true` (the account has not been deactivated).
7. If the account is deactivated, the system signs them out immediately and shows an error.
8. If everything passes, the browser redirects to `dashboard.html`.

**Automatic session check:** When any page loads, `auth.js` checks if the user already has an active session (like being already logged in from a previous visit). If they do, the login page automatically redirects them to the dashboard. If they are on any other page without a session, they are redirected back to the login page.

---

### 7.2 Dashboard

**Files:** `dashboard.html` + `dashboard.js`

**What the user sees:** A summary page with metrics cards, charts, and recent activity.

**Dashboard components:**

#### Metric Cards (top row)
Six cards showing key numbers at a glance:

| Card | What It Shows | Colour |
|---|---|---|
| Total Assets | Count of all registered assets | Dark blue |
| Active | Assets in working condition | Green |
| Faulty | Assets that are broken | Red |
| Under Maintenance | Assets being repaired | Amber |
| Disposed | Assets taken out of service | Grey |
| Open Faults | Fault reports not yet resolved | Purple |

**How the numbers are calculated:** The JavaScript sends six separate queries to the database, each counting assets with a specific `status` value. For "Open Faults", it counts fault reports where status is either "reported" or "in_progress".

#### Assets by Category (left column)
A list of asset categories (e.g., "Laptop", "Printer") with horizontal progress bars showing how many assets are in each category. This helps management see the distribution of equipment types.

#### Recent Faults (right column)
A table showing the 5 most recently reported faults, with:
- The asset's name
- The fault description
- Priority level (colour-coded badge)
- Current status (colour-coded badge)
- When it was reported

#### Asset Condition Summary (bottom)
Four coloured cards showing:
- **Working** (green) — count and percentage of total
- **Faulty** (red) — count and percentage of total
- **Under Maintenance** (amber) — count and percentage of total
- **Disposed** (grey) — count and percentage of total

#### System Alerts Panel
A live alert feed at the bottom of the dashboard that automatically highlights items requiring attention:

| Alert Type | Trigger Condition | Colour |
|---|---|---|
| **Warranty Expiring** | An asset's warranty expires within 30 days | Amber |
| **Warranty Expired** | An asset's warranty has already passed | Red |
| **Licence Expiring** | A software licence expires within 30 days | Amber |
| **Licence Expired** | A software licence has already expired | Red |
| **Overdue Maintenance** | A maintenance record is still "in_progress" after its scheduled date | Red |

No alerts are shown if everything is current. This panel runs automatically every time the dashboard loads.

---

### 7.3 Asset Management

**Files:** `assets.html` + `assets.js`

This is the core of the system. It allows administrators and technicians to manage the university's entire ICT inventory.

#### The Asset Table
A full-width table displaying all assets with these columns:
- **Asset Tag** — the unique identifier (e.g., "UZ-ICT-0042")
- **Name** — the asset's name (e.g., "Dell Latitude 5520")
- **Category** — type of equipment (e.g., "Laptop")
- **Department** — which department owns it
- **Location** — physical location
- **Status** — colour-coded badge (Active, Faulty, Under Maintenance, Disposed)
- **Assigned User** — who is using the asset
- **Actions** — View, Edit, and Delete buttons (Edit and Delete are only shown to admins and technicians)

#### Filters
Above the table, there are four filters that update the table in real time:
- **Search box** — type to search by name, asset tag, or serial number
- **Category dropdown** — filter by equipment type
- **Department dropdown** — filter by department
- **Status dropdown** — filter by condition

The search box uses **debouncing** — it waits 300 milliseconds after the user stops typing before querying the database. This avoids sending a database query for every single keystroke.

#### Adding a New Asset
1. Click the green **"Add Asset"** button (only visible to admins and technicians).
2. A modal (pop-up dialog) opens with a form containing these fields:
   - Asset Tag (required, must be unique)
   - Name (required)
   - Category (dropdown populated from the `categories` table)
   - Department (dropdown populated from the `departments` table)
   - Serial Number
   - Status (Active, Faulty, Under Maintenance, Disposed)
   - Purchase Date
   - Warranty Expiry
   - Assigned User
   - Location
   - Description
3. Fill in the fields and click **Save**.
4. JavaScript validates the required fields, then sends an `INSERT` command to the `ict_assets` table in the database.
5. The modal closes, a success message appears, and the table reloads to show the new asset.

#### Editing an Asset
1. Click the **pencil icon** on any asset row.
2. The same modal opens, but pre-filled with the asset's current data.
3. Make changes and click **Save**.
4. JavaScript sends an `UPDATE` command to the database for that specific asset.

#### Viewing an Asset
1. Click the **eye icon** on any asset row.
2. A read-only modal opens showing all asset details in a clean layout, including:
   - Full asset information
   - Maintenance history (pulled from the `maintenance_records` table)
   - Allocation history (pulled from the `allocations` table)

#### Deleting an Asset
1. Click the **trash icon** on any asset row.
2. A confirmation dialog appears.
3. If confirmed, JavaScript sends a `DELETE` command to the database.
4. The table reloads without the deleted asset.

---

### 7.4 Fault Reporting

**Files:** `faults.html` + `faults.js`

This module lets any user report equipment problems and lets technicians track their resolution.

#### The Faults Table
Displays all fault reports with:
- **ID** — first 8 characters of the unique identifier
- **Asset** — which piece of equipment is affected (name and asset tag)
- **Description** — what is wrong (truncated to fit the table)
- **Priority** — Low, Medium, High, or Critical (colour-coded)
- **Status** — Reported, In Progress, Resolved, or Closed (colour-coded)
- **Reporter** — who submitted the fault
- **Date** — when it was reported
- **Actions** — View and Edit buttons

#### Reporting a New Fault
1. Click **"Report Fault"** (available to all users).
2. A modal opens with:
   - **Asset** dropdown (lists all assets; for department reps, only their department's assets)
   - **Priority** dropdown (Low, Medium, High, Critical)
   - **Issue Description** (required text area)
   - **Resolution Notes** (only visible to admins and technicians)
3. Click **Submit**.
4. The system:
   - Inserts a new row in `fault_reports` with status "reported"
   - Automatically sets the `reported_by` field to the current user's ID
   - Automatically changes the **asset's status** to "faulty" in the `ict_assets` table

#### Updating a Fault (Technicians/Admins)
1. Click the pencil icon to edit.
2. The technician can change the **status** (e.g., from "reported" to "in_progress" or "resolved").
3. They can add **resolution notes** describing how the fault was fixed.
4. If the status is changed to "resolved", the system automatically changes the **asset's status** back to "active".

---

### 7.5 Maintenance Tracking

**Files:** `maintenance.html` + `maintenance.js`

This module provides a complete log of all repair and maintenance activities.

#### The Maintenance Table
Displays all maintenance records with:
- **ID** — short identifier
- **Asset** — name and asset tag
- **Type** — Preventive, Corrective, or Emergency (colour-coded)
- **Description** — what was done
- **Technician** — who performed the work
- **Status** — Scheduled, In Progress, Completed, or Cancelled
- **Date** — scheduled or created date
- **Actions** — View and Edit buttons

#### Creating a Maintenance Record
1. Click **"Add Maintenance Record"** (only visible to technicians and admins).
2. Fill in:
   - **Asset** (dropdown)
   - **Related Fault Report** (optional dropdown — links this maintenance to an existing fault)
   - **Type** — Preventive (routine), Corrective (fixing a reported issue), or Emergency
   - **Description** (required)
   - **Scheduled Date**
   - **Cost** (in USD)
3. Click **Save**.
4. The system:
   - Inserts the record with the current user as the assigned technician
   - Sets the record status to "scheduled"
   - Changes the **asset's status** to "under_maintenance"

#### Completing Maintenance
1. Edit the record and change the status to **"completed"**.
2. Add **actions taken** and the **completed date**.
3. The system:
   - Updates the maintenance record
   - Changes the **asset's status** back to "active"
   - If the maintenance was linked to a fault report, automatically changes that **fault's status** to "resolved"

This automatic linking between maintenance → asset status → fault status is one of the system's key features, ensuring data consistency without manual updates.

---

### 7.6 Allocation & Movement Tracking

**Files:** `allocations.html` + `allocations.js`

This module tracks when assets are moved between departments.

#### The Allocations Table
Displays all allocation records with:
- **ID** — short identifier
- **Asset** — name and asset tag
- **Movement** — compact from → to department display
- **Assigned To** — the person receiving the asset
- **Allocated By** — who approved the move
- **Status** — colour-coded badge (Active, Returned, Cancelled)
- **Date** — when it happened
- **Actions** — View button, and a "Mark Returned" button for active allocations

#### Filters
Above the table, four filters are available:
- **Search** — by asset name or assigned person
- **From Department** — filter by source department
- **To Department** — filter by destination department
- **Status** — filter by allocation status (All, Active, Returned, Cancelled)

#### Recording an Allocation
1. Click **"Record Allocation"** (admins and technicians only).
2. Fill in:
   - **Asset** (dropdown)
   - **From Department** (auto-filled based on the asset's current department, but editable)
   - **To Department** (required)
   - **Assigned To** (name of the person receiving the asset)
   - **Expected Return Date** (optional — leave blank for permanent transfers)
   - **Notes** (reason for the move)
3. Click **Save**.
4. The system:
   - Inserts a new row in the `allocations` table with status "active"
   - Automatically **updates the asset's department** to the new "To" department
   - Records the current user as `allocated_by`

#### Marking an Allocation as Returned
1. Click the **green tick icon** on any active allocation row (admins and technicians only).
2. A confirmation dialog appears.
3. The system automatically sets the allocation `status` to "returned" and records today's date as the `return_date`.

#### Viewing Allocation Details
Clicking the eye icon shows a detailed view with:
- Asset information (name, tag, current status)
- Movement details (from → to, with department names)
- Assigned person and expected/actual return date
- Who approved it and when
- Current allocation status and any notes

---

### 7.7 Reports

**Files:** `reports.html` + `reports.js`

This module generates management-level reports from live data.

#### Available Reports

| Report | What It Shows |
|---|---|
| **All Assets** | Every registered asset with tag, name, category, department, status, assigned user, and location |
| **Faulty Assets** | Only assets with status "faulty" |
| **Under Maintenance** | Assets currently being repaired, with maintenance type and technician name |
| **Assets by Department** | Summary showing each department's total assets broken down by status (active, faulty, under maintenance) |
| **Allocation History** | All asset movements with dates, from/to departments, and who approved them |
| **Fault Reports** | All reported faults with dates, assets, descriptions, priorities, statuses, and reporters |

#### How Reports Work

1. The user clicks on one of the six report cards.
2. The selected card gets a green border to show it is active.
3. JavaScript queries the database for the relevant data.
4. The data is displayed in a table below the report cards.
5. A footer shows the total number of records and the timestamp.

#### Exporting Reports

Two export buttons appear above the report table:

**Export to HTML:**
- Creates a standalone HTML file with Bootstrap styling.
- Includes a "Print Report" button in the exported file.
- The file downloads automatically to the user's computer.

**Export to CSV:**
- Creates a CSV (Comma-Separated Values) file.
- This format can be opened in Microsoft Excel, Google Sheets, or any spreadsheet program.
- The file downloads automatically.

---

### 7.8 User Management

**Files:** `users.html` + `users.js`

This page is **only accessible to administrators**. If any other role tries to visit this page, they are automatically redirected to the dashboard.

#### The Users Table
Displays all system users with:
- **Name** — full name
- **Email** — login email
- **Role** — Admin, Technician, or Department Rep (colour-coded badge)
- **Department** — assigned department
- **Status** — Active or Inactive (colour-coded badge)
- **Created** — when the account was created
- **Actions** — Edit and Toggle Status buttons

#### Adding a New User
1. Click **"Add User"**.
2. Fill in:
   - Full Name (required)
   - Email (required, must be unique)
   - Password (required, at least 6 characters)
   - Role (Admin, Technician, or Department Rep)
   - Department (dropdown)
3. Click **Save**.
4. The system:
   - Creates a new user in **Supabase Auth** (the login system)
   - A database trigger automatically creates a row in the `profiles` table
   - The profile is then updated with the selected role and department

#### Editing a User
1. Click the pencil icon.
2. Change the name, role, or department.
3. Click **Save**. (The password cannot be changed through this form for security reasons.)

#### Deactivating / Reactivating a User
1. Click the **toggle button** (shows "Deactivate" for active users, "Activate" for inactive users).
2. The system sets `is_active` to `false` (or `true`).
3. A deactivated user **can no longer log in** — the login page checks `is_active` and rejects deactivated accounts even if the password is correct.

### 7.9 Software Asset Tracking

**Files:** `software.html` + `software.js`

This module provides a centralised register of all software licences owned by the university.

#### The Software Table
Displays all software assets with:
- **Name** — software title
- **Vendor** — manufacturer/publisher
- **Version** — release version
- **Licence Type** — colour-coded badge (Perpetual, Subscription, Open Source, Freeware)
- **Seats** — number of users the licence covers
- **Department** — which department it belongs to (or "University-Wide")
- **Expiry Date** — when the licence expires ("No Expiry" for perpetual licences)
- **Status** — colour-coded badge (Active, Expired, Discontinued)
- **Actions** — View, Edit, and Delete buttons

#### Licence Expiry Warnings
When a software licence expires within **30 days**, the expiry date cell automatically turns amber with a warning icon. When it is already expired, it turns red. This gives ICT staff an at-a-glance view of upcoming renewals without waiting for a report.

#### Adding a Software Asset
1. Click **"Add Software"** (admins and technicians only).
2. Fill in:
   - **Name** (required)
   - **Vendor**
   - **Version**
   - **Licence Key** (stored as text)
   - **Licence Type** (Perpetual, Subscription, Open Source, or Freeware)
   - **Total Seats** (number of licences)
   - **Department** (leave blank for university-wide)
   - **Status** (Active, Expired, or Discontinued)
   - **Purchase Date** and **Licence Expiry Date**
   - **Cost** (in USD)
   - **Notes**
3. Click **Save**.

#### Dashboard Integration
The Dashboard's **System Alerts** panel automatically reads the `software_assets` table and flags any licences expiring within 30 days or already expired, so ICT staff are notified without needing to open this page.

---

### 7.10 Service Requests

**Files:** `service_requests.html` + `service_requests.js`

This module replaces informal verbal or email requests with a structured, trackable system for all ICT service needs.

#### The Service Requests Table
Displays all requests with:
- **ID** — short identifier
- **Title** — brief description of the request
- **Type** — colour-coded badge (New Equipment, Repair, Software, Network, Support, Other)
- **Priority** — Low, Medium, High, or Critical (colour-coded)
- **Department** — which department submitted the request
- **Status** — Pending, Approved, Rejected, In Progress, or Fulfilled (colour-coded)
- **Date** — when submitted
- **Actions** — View and Edit buttons

#### Filters
Above the table, four filters allow narrowing the view:
- **Search** — by title keyword
- **Type** — filter by request category
- **Priority** — filter by urgency level
- **Status** — filter by current progress

#### Submitting a Service Request
1. Click **"New Request"** (available to all users).
2. Fill in:
   - **Title** (required)
   - **Request Type** (New Equipment, Repair, Software, Network, Support, or Other)
   - **Priority** (Low, Medium, High, Critical)
   - **Department** (auto-filled from the user's department)
   - **Description** (required — full explanation of the need)
3. Click **Submit**.
4. The system inserts the request with status **"pending"** and records the submitting user.

#### Processing a Request (Admins/Technicians)
1. Click the pencil icon to edit any request.
2. Change the **status** to reflect progress:
   - **Approved** — management has approved the request
   - **In Progress** — work has started or items are on order
   - **Fulfilled** — the request has been completely handled
   - **Rejected** — the request was declined
3. Add **admin notes** to explain decisions or provide updates.
4. Assign a **technician** to the request if hands-on work is needed.

---

## 8. File Structure

```
📁 Resource Management System for the University of Zimbabwe/
│
├── 📄 index.html              ← Login page
├── 📄 dashboard.html          ← Dashboard (metrics overview + system alerts)
├── 📄 assets.html             ← Asset management page
├── 📄 faults.html             ← Fault reporting page
├── 📄 maintenance.html        ← Maintenance tracking page
├── 📄 allocations.html        ← Allocation & movement page
├── 📄 reports.html            ← Reports generation page
├── 📄 users.html              ← User management page (admin only)
├── 📄 software.html           ← Software asset tracking page
├── 📄 service_requests.html   ← Service requests page
│
├── 📁 css/
│   └── 📄 style.css           ← All custom styling (UZ brand colours, layout, fonts)
│
├── 📁 images/
│   └── 📄 uz-logo.png         ← University of Zimbabwe coat of arms (sidebar & login)
│
├── 📁 js/
│   ├── 📄 config.js           ← Supabase connection + shared utility functions
│   ├── 📄 auth.js             ← Login, logout, session management, role checks
│   ├── 📄 sidebar.js          ← Sidebar navigation (injected into every page)
│   ├── 📄 dashboard.js        ← Dashboard data loading, display, and system alerts
│   ├── 📄 assets.js           ← Asset CRUD operations (Create, Read, Update, Delete)
│   ├── 📄 faults.js           ← Fault report operations
│   ├── 📄 maintenance.js      ← Maintenance record operations
│   ├── 📄 allocations.js      ← Allocation/movement operations (inc. Mark Returned)
│   ├── 📄 reports.js          ← Report generation and export
│   ├── 📄 users.js            ← User management operations
│   ├── 📄 software.js         ← Software asset CRUD + licence expiry warnings
│   └── 📄 service_requests.js ← Service request submission and management
│
├── 📁 database/
│   ├── 📄 schema.sql          ← Core database structure (tables, RLS policies, seed data)
│   ├── 📄 updates.sql         ← Schema additions: software_assets, service_requests tables; allocations fields
│   └── 📄 mock_data.sql       ← Demo data: 6 users, 30 assets, faults, maintenance, allocations, software, requests
│
├── 📄 PRD.md                  ← Product Requirements Document
├── 📄 SYSTEM_DOCUMENTATION.md ← This file
└── 📄 README.md               ← Setup instructions
```

### What Each JavaScript File Does

| File | Responsibilities |
|---|---|
| **config.js** | Connects to Supabase, defines constants (roles, statuses, priorities), provides shared helper functions (format dates, format currency, show alerts, show loading spinner, escape HTML to prevent security issues) |
| **auth.js** | Checks if the user is logged in on every page load, fetches the user's profile, updates the UI with the user's name and initials, shows/hides elements based on role, handles the login form, handles logout, listens for session changes |
| **sidebar.js** | Contains the sidebar HTML template, injects it into the page, highlights the current page in the navigation, provides `updateUserAvatar()` function |
| **dashboard.js** | Queries asset counts by status, queries fault counts, loads category breakdown data, loads recent faults, loads system alerts (warranty/licence expiry, overdue maintenance), updates all dashboard UI elements |
| **assets.js** | Loads and filters assets, opens add/edit/view/delete modals, handles form submission, populates dropdowns with categories and departments |
| **faults.js** | Loads and filters fault reports, handles fault submission, auto-sets asset status to "faulty", handles fault editing including status changes and resolution notes |
| **maintenance.js** | Loads and filters maintenance records, handles record creation (auto-assigns technician), handles completion (auto-updates asset and linked fault status), populates dropdowns with assets and fault reports |
| **allocations.js** | Loads and filters allocation history, handles new allocation submission (with assigned_to and return_date), auto-updates the asset's department after a move, handles "Mark Returned" action, populates department dropdowns |
| **reports.js** | Contains six data-fetching functions (one per report type), formats data into table rows, renders the report table, handles HTML and CSV export |
| **users.js** | Loads user list, handles user creation (creates auth user + updates profile), handles editing, handles activate/deactivate toggle |
| **software.js** | Loads and filters software assets, handles CRUD operations, displays licence expiry warnings with colour coding, populates department dropdowns |
| **service_requests.js** | Loads and filters service requests, handles submission by all roles, handles status updates by admins/technicians, manages admin notes and assigned technician fields |

---

## 9. How Data Flows Through the System

### 9.1 Example: Reporting and Fixing a Fault

This walkthrough shows how multiple modules work together:

```
Step 1: Department rep reports a fault
─────────────────────────────────────
User: "The printer in Room 204 is jammed"
  → faults.js INSERTs a new fault_report (status: "reported", priority: "high")
  → faults.js UPDATEs the asset's status from "active" to "faulty"
  → Dashboard now shows: Faulty count goes up by 1, Active count goes down by 1

Step 2: Technician creates a maintenance record
────────────────────────────────────────────────
Technician opens Maintenance → Add Maintenance Record
  → Selects the printer asset
  → Links to the fault report from Step 1
  → Type: "corrective"
  → maintenance.js INSERTs a new maintenance_record (status: "scheduled")
  → maintenance.js UPDATEs the asset's status to "under_maintenance"
  → Dashboard now shows: Under Maintenance count goes up, Faulty count goes down

Step 3: Technician completes the repair
────────────────────────────────────────
Technician edits the maintenance record → status: "completed"
  → maintenance.js UPDATEs the maintenance_record
  → maintenance.js UPDATEs the asset's status back to "active"
  → maintenance.js UPDATEs the linked fault_report's status to "resolved"
  → Dashboard now shows: Active count goes up, Under Maintenance goes down

Step 4: Manager generates a report
───────────────────────────────────
Manager opens Reports → clicks "Fault Reports"
  → reports.js queries all fault_reports with related data
  → The printer fault shows as "Resolved"
  → Manager exports to CSV for their records
```

### 9.2 Example: Transferring an Asset

```
Step 1: Asset is currently in Computer Science department
─────────────────────────────────────────────────────────
The asset's department_id points to the "Computer Science" row in departments table.

Step 2: Technician records an allocation
──────────────────────────────────────────
  → Opens Allocation & Movement → Record Allocation
  → Selects the asset
  → From: Computer Science (auto-filled from the asset's current department)
  → To: Library
  → Notes: "Needed for new digital resource centre"
  → allocations.js INSERTs a new allocation record
  → allocations.js UPDATEs the asset's department_id to "Library"

Step 3: The change is reflected everywhere
──────────────────────────────────────────
  → Assets page: the asset now shows "Library" as its department
  → Dashboard: category/department counts are updated
  → Reports: the "Assets by Department" report shows the updated distribution
  → Allocation History: the from → to movement is permanently recorded
```

---

## 10. Security

### 10.1 Authentication (Proving Who You Are)

- Users must log in with an **email and password**.
- Passwords are **never stored in plain text** — Supabase Auth hashes them using industry-standard algorithms.
- After login, Supabase issues a **session token** (a long encrypted string) that the browser stores. This token is sent with every database request to prove the user's identity.
- Sessions expire automatically, requiring re-login.

### 10.2 Authorisation (Controlling What You Can Do)

There are **two layers** of access control:

**Layer 1: Frontend (JavaScript)**
- Buttons like "Add Asset" and "Delete" are hidden from users who do not have permission.
- The User Management page redirects non-admins to the dashboard.
- Department reps only see their own department's data in dropdowns and tables.

**Layer 2: Database (Row Level Security)**
- Even if someone tried to bypass the frontend (e.g., using developer tools in the browser), the **database itself** enforces rules.
- Each table has **RLS policies** that check the user's role before allowing any read, insert, update, or delete operation.
- Example policies:
  - "Department reps can only SELECT assets where the asset's department matches their own department."
  - "Only admins and technicians can INSERT, UPDATE, or DELETE assets."
  - "Only admins can modify other users' profiles."

### 10.3 Account Deactivation

- When an admin deactivates a user, the `is_active` field is set to `false`.
- The login process explicitly checks this field **after** verifying the password.
- Even if the password is correct, a deactivated user is immediately signed out and shown an error message.

### 10.4 Data Validation

- Required fields are enforced both in the **HTML forms** (the browser will not submit without them) and in the **database** (columns marked `NOT NULL` will reject empty values).
- Status fields are restricted to specific allowed values using **database CHECK constraints** (e.g., asset status can only be "active", "faulty", "under_maintenance", or "disposed").
- Text entered by users is **escaped** before being displayed, preventing Cross-Site Scripting (XSS) attacks — a type of security vulnerability where malicious code could be injected through form fields. The system prevents this by escaping all user-entered text before displaying it.

---

## 11. Glossary of Terms

| Term | Meaning |
|---|---|
| **API** | Application Programming Interface — a set of rules for how software components communicate. Supabase provides an API that our JavaScript uses to read and write data. |
| **Authentication** | The process of verifying a user's identity (usually with email and password). |
| **Authorisation** | The process of determining what an authenticated user is allowed to do. |
| **Bootstrap** | A popular CSS framework that provides pre-built UI components. |
| **CRUD** | Create, Read, Update, Delete — the four basic operations on data. |
| **CSS** | Cascading Style Sheets — the language used to style the visual appearance of web pages. |
| **CSV** | Comma-Separated Values — a simple file format for spreadsheet data. |
| **Database** | An organised collection of data stored electronically. |
| **Debouncing** | A programming technique that delays execution of a function until the user stops performing an action (e.g., typing), to avoid excessive operations. |
| **Foreign Key** | A column in one table that references a row in another table, creating a relationship between them. |
| **HTML** | HyperText Markup Language — the language used to structure web pages. |
| **JavaScript (JS)** | A programming language that runs in the browser, making web pages interactive. |
| **Modal** | A pop-up dialog box that appears on top of the current page. |
| **PostgreSQL** | A powerful, open-source relational database system. |
| **RLS** | Row Level Security — a PostgreSQL feature that restricts which rows a user can access based on rules. |
| **Session** | A period of time during which a user is logged in. The session is maintained by a token stored in the browser. |
| **Supabase** | An open-source backend-as-a-service platform that provides a PostgreSQL database, authentication, and APIs. |
| **Token** | A digital credential (like an ID card) that proves a user is logged in. |
| **Trigger** | A database feature that automatically executes a function when a specific event occurs (e.g., a new user signs up). |
| **UUID** | Universally Unique Identifier — a long string of characters used as a unique ID (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`). |

---

## End of Document

---

## Change Log

| Version | Date | Changes |
|---|---|---|
| **1.0.0** | March 2026 | Initial release — Assets, Faults, Maintenance, Allocations, Reports, User Management |
| **1.1.0** | April 2026 | Added Software Asset Tracking module; added Service Requests module; added Dashboard System Alerts; updated Allocations with assigned_to, return_date, status fields and Mark Returned action; applied UZ brand colours (deep purple + orange) and UZ coat of arms logo |

---

*This documentation was prepared for the Centralized ICT Resource Management System — University of Zimbabwe.*
*For technical setup instructions, refer to the README.md file in the project root.*
