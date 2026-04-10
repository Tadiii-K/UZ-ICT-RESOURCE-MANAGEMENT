# UZ ICT Resource Management System

A web-based platform for managing all ICT assets at the University of Zimbabwe, built on Supabase (PostgreSQL + Auth) and a lightweight web frontend (HTML/CSS/JS with Bootstrap).

## Features

- **User Authentication** - Supabase Auth with role-based access control
- **Dashboard** - Real-time metrics and activity overview
- **Asset Management** - Full CRUD operations for ICT assets
- **Fault Reporting** - Issue submission and tracking
- **Maintenance Tracking** - Record and manage maintenance activities
- **Allocation Management** - Track asset movements between departments
- **Reports** - Generate and export reports (HTML/CSV)
- **User Management** - Admin panel for managing system users

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features including user management |
| **Technician** | Manage assets, faults, maintenance, and allocations |
| **Department Rep** | View department assets, report faults |

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3
- **Icons**: Bootstrap Icons
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Database**: PostgreSQL via Supabase

## Project Structure

```
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── assets.html             # Asset management
├── faults.html             # Fault reporting
├── maintenance.html        # Maintenance tracking
├── allocations.html        # Asset allocations
├── reports.html            # Report generation
├── users.html              # User management (admin)
├── css/
│   └── style.css           # Custom styles
├── js/
│   ├── config.js           # Supabase config & utilities
│   ├── auth.js             # Authentication module
│   ├── dashboard.js        # Dashboard functionality
│   ├── assets.js           # Asset management
│   ├── faults.js           # Fault reporting
│   ├── maintenance.js      # Maintenance tracking
│   ├── allocations.js      # Allocation management
│   ├── users.js            # User management
│   └── reports.js          # Report generation
├── database/
│   └── schema.sql          # Database schema & RLS policies
└── README.md
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Configure Database

1. Open the SQL Editor in your Supabase dashboard
2. Copy the contents of `database/schema.sql`
3. Run the SQL to create tables, indexes, triggers, and RLS policies

### 3. Configure Application

1. Open `js/config.js`
2. Replace the placeholder values with your Supabase credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 4. Create Admin User

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" and create your admin account
3. In the SQL Editor, update the user's role:

```sql
UPDATE profiles 
SET role = 'admin', full_name = 'Admin Name' 
WHERE email = 'admin@uz.ac.zw';
```

### 5. Deploy

#### Option A: Local Development
Simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

#### Option B: Production Deployment
Deploy to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- Any web server (Apache, Nginx)

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to Supabase Auth |
| `departments` | University departments |
| `categories` | Asset categories |
| `ict_assets` | ICT asset inventory |
| `fault_reports` | Reported faults/issues |
| `maintenance_records` | Maintenance activities |
| `allocations` | Asset movement history |

### Entity Relationship

```
profiles ──────┬──── departments
               │
ict_assets ────┼──── categories
    │          │
    ├── fault_reports
    │
    ├── maintenance_records
    │
    └── allocations
```

## Row-Level Security (RLS)

The system implements comprehensive RLS policies:

- **Admins**: Full access to all data
- **Technicians**: Can manage assets, faults, maintenance, allocations
- **Department Reps**: Can view their department's assets and report faults

## Usage Guide

### Logging In
1. Navigate to the application URL
2. Enter your email and password
3. You'll be redirected to the dashboard

### Managing Assets
1. Go to Assets page
2. Click "Add Asset" to create new assets
3. Use filters to search and filter assets
4. Click view/edit/delete icons for actions

### Reporting Faults
1. Go to Faults page
2. Click "Report Fault"
3. Select the affected asset
4. Describe the issue and set priority
5. Submit the report

### Maintenance Tracking
1. Go to Maintenance page (Technicians/Admins)
2. Click "New Maintenance"
3. Select asset and optionally link to a fault report
4. Record maintenance details and actions taken

### Generating Reports
1. Go to Reports page
2. Click on a report type card
3. View the generated report
4. Export to HTML or CSV as needed

## Security Considerations

- All API calls use Supabase's secure client
- Row-Level Security enforces data access at database level
- Passwords are handled by Supabase Auth (never stored in app)
- Session management via Supabase Auth tokens

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2024 University of Zimbabwe - ICT Department. All rights reserved.

## Support

For technical support, contact the ICT Department.
