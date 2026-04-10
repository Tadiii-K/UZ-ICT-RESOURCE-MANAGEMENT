PRODUCT REQUIREMENTS DOCUMENT (PRD)
Project: Centralized ICT Resource Management System — University of Zimbabwe
1. Product Summary

A web-based platform for managing all ICT assets at the University of Zimbabwe, built on Supabase (PostgreSQL + Auth) and a lightweight web frontend (HTML/CSS/JS).
The system provides centralized visibility, asset tracking, fault reporting, maintenance workflows, allocation management, and reporting.

2. Goals
Improve visibility of ICT resources
Centralize all asset information
Simplify fault reporting
Track maintenance end-to-end
Monitor asset transfers between departments
Generate management-level reports
3. Target Users
Admin
ICT Technicians
Department Representatives
4. Success Metrics
100% assets registered
Fault resolution time reduced
No missing audit data
Full maintenance history recorded
Accurate allocation tracking
Reports accessible in <5 seconds
5. Core Features
5.1 User Authentication
Supabase Auth
Role-based access
Profile table mapping roles
5.2 Dashboard

Shows metrics:

Total assets
Assets by category
Faulty assets
Under maintenance
Recently reported faults
Downloadable reports
5.3 Asset Management
Create, edit, delete asset
Assign to department
Assign user
Set status
View maintenance history
View allocation history
5.4 Fault Reporting
Department reps report issues
Technicians review fault queue
Update fault status
5.5 Maintenance Tracking
Record actions taken
Set maintenance status
Assign technician
Close maintenance ticket
Automatic updates to asset status
5.6 Allocation & Movement Tracking
Move asset between departments
Track “from → to” history
Record movement notes
5.7 Reports
All assets
Faulty assets
Under maintenance
Assets by department
Allocation/movement history

Reports can be exported to:

HTML
CSV
5.8 User Management
Add system users
Assign roles
Deactivate users
6. Database Schema

(Same tables as blueprint; Claude will read these for implementation)

Tables:

profiles
departments
categories
ict_assets
fault_reports
maintenance_records
allocations
7. Technical Requirements
7.1 Frontend
HTML/CSS/JS
Bootstrap
Supabase JS Client
7.2 Backend
Optional; system mostly frontend + Supabase
7.3 Database
Supabase PostgreSQL
7.4 Security
RLS required
Policies for each table
Users can only see what their role permits
8. Constraints
Must use Supabase
Must run in a standard web browser
Must work even on low bandwidth
9. Future Enhancements (NOT in scope)
Mobile app
RFID/Barcode scanning
Procurement system
Predictive maintenance analytics
10. Deliverables
Functional web system
Supabase project setup
Full documentation
ERD
System architecture diagram
User manual
Testing report