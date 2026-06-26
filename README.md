# AttendEase 🎓

AttendEase is a comprehensive, full-stack college attendance management system designed to streamline the tracking and reporting of student attendance for administrators, faculty, and students.

## ✨ Features

* **Role-Based Access Control**:
  * **Administrator**: Oversee the entire system, manage departments, subjects, students, and faculty. View high-level analytics and department-wise attendance rates.
  * **Faculty**: Mark daily attendance in bulk, manage subject records, and view daily/overall attendance statistics for assigned classes.
  * **Student**: Check personal attendance records, subject-wise statistics, and overall attendance percentages.
* **Core Modules**:
  * **Departments & Semesters**: Organize academic structures efficiently.
  * **Subjects**: Map subjects to specific departments and semesters.
  * **User Management**: Unified management of student and faculty profiles.
* **Attendance Tracking**: Fast, bulk attendance marking (Present, Absent, Excused) with built-in historical tracking.
* **Dashboard & Analytics**: Real-time statistics, data generation, and analytics for students and faculty.

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide React
* **Backend**: Node.js, Express.js
* **Language**: TypeScript
* **Database**: Lightweight JSON-based file storage (`db.json`)

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Set up Environment Variables**:
   Configure `.env.local` (e.g., set `GEMINI_API_KEY` to your Gemini API key if required by AI features).
3. **Run the Application**:
   ```bash
   npm run dev
   ```
   The application will start the development server using Vite and Express concurrently on `http://localhost:3000`.

### Default Accounts

The application is pre-seeded with sample data to help you get started quickly. You can log in using the following sample usernames:
* **Admin**: `admin` (Password: `admin@123`)
* **Faculty**: `dr.sharma`, `prof.patel`, `dr.verma`
* **Student**: `akul`, `sarah`, `rohit`, `emma`, `john`

*(Note: For development purposes, password validation for students and faculty is currently bypassed except for the admin role.)*

## 📁 Project Structure

* `server.ts`: Express backend server, REST API endpoints, and database initialization.
* `src/`: React frontend application and components.
* `db.json`: Auto-generated local database file storing the application state.
