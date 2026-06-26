/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  User, 
  Department, 
  Semester, 
  Subject, 
  Student, 
  Faculty, 
  AttendanceRecord,
  AttendanceStatus,
  SubjectAttendanceStats
} from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Middlewares
app.use(express.json());

// Main In-Memory Storage
interface AppState {
  users: User[];
  departments: Department[];
  semesters: Semester[];
  subjects: Subject[];
  students: Student[];
  facultyList: Faculty[];
  attendance: AttendanceRecord[];
}

let state: AppState = {
  users: [],
  departments: [],
  semesters: [],
  subjects: [],
  students: [],
  facultyList: [],
  attendance: []
};

// Initial setup / Seed Data
function seedInitialData() {
  const departments: Department[] = [
    { id: 'dep-1', name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 'dep-2', name: 'Electrical Engineering', code: 'EE' },
    { id: 'dep-3', name: 'Mechanical Engineering', code: 'ME' }
  ];

  const semesters: Semester[] = [
    { id: 'sem-1', name: 'Semester 1', code: 'S1' },
    { id: 'sem-2', name: 'Semester 2', code: 'S2' },
    { id: 'sem-3', name: 'Semester 3', code: 'S3' },
    { id: 'sem-5', name: 'Semester 5', code: 'S5' }
  ];

  const subjects: Subject[] = [
    { id: 'sub-1', code: 'CS-101', name: 'Introduction to Programming', departmentId: 'dep-1', semesterId: 'sem-1' },
    { id: 'sub-2', code: 'CS-302', name: 'Database Management Systems', departmentId: 'dep-1', semesterId: 'sem-3' },
    { id: 'sub-3', code: 'CS-501', name: 'Computer Networks', departmentId: 'dep-1', semesterId: 'sem-5' },
    { id: 'sub-4', code: 'EE-101', name: 'Basic Electrical Eng', departmentId: 'dep-2', semesterId: 'sem-1' },
    { id: 'sub-5', code: 'ME-101', name: 'Engineering Graphics', departmentId: 'dep-3', semesterId: 'sem-1' }
  ];

  const users: User[] = [
    // Administrators
    { id: 'user-admin-1', username: 'admin', name: 'College Administrator', email: 'admin@college.edu', role: 'admin' },
    
    // Faculty
    { id: 'user-fac-1', username: 'dr.sharma', name: 'Dr. Amit Sharma', email: 'amit.sharma@college.edu', role: 'faculty', departmentId: 'dep-1' },
    { id: 'user-fac-2', username: 'prof.patel', name: 'Prof. Priya Patel', email: 'priya.patel@college.edu', role: 'faculty', departmentId: 'dep-1' },
    { id: 'user-fac-3', username: 'dr.verma', name: 'Dr. Rajesh Verma', email: 'rajesh.verma@college.edu', role: 'faculty', departmentId: 'dep-2' },
    
    // Students
    { id: 'user-stu-1', username: 'akul', name: 'Akul King', email: 'akultheking2006@gmail.com', role: 'student', departmentId: 'dep-1' },
    { id: 'user-stu-2', username: 'sarah', name: 'Sarah Smith', email: 'sarah.smith@college.edu', role: 'student', departmentId: 'dep-1' },
    { id: 'user-stu-3', username: 'rohit', name: 'Rohit Kumar', email: 'rohit.kumar@college.edu', role: 'student', departmentId: 'dep-1' },
    { id: 'user-stu-4', username: 'emma', name: 'Emma Watson', email: 'emma.watson@college.edu', role: 'student', departmentId: 'dep-3' },
    { id: 'user-stu-5', username: 'john', name: 'John Doe', email: 'john.doe@college.edu', role: 'student', departmentId: 'dep-2' }
  ];

  const students: Student[] = [
    { id: 'student-1', userId: 'user-stu-1', rollNumber: 'CSE-2024-001', name: 'Akul King', email: 'akultheking2006@gmail.com', departmentId: 'dep-1', semesterId: 'sem-3' },
    { id: 'student-2', userId: 'user-stu-2', rollNumber: 'CSE-2024-002', name: 'Sarah Smith', email: 'sarah.smith@college.edu', departmentId: 'dep-1', semesterId: 'sem-3' },
    { id: 'student-3', userId: 'user-stu-3', rollNumber: 'CSE-2025-103', name: 'Rohit Kumar', email: 'rohit.kumar@college.edu', departmentId: 'dep-1', semesterId: 'sem-1' },
    { id: 'student-4', userId: 'user-stu-4', rollNumber: 'ME-2025-044', name: 'Emma Watson', email: 'emma.watson@college.edu', departmentId: 'dep-3', semesterId: 'sem-1' },
    { id: 'student-5', userId: 'user-stu-5', rollNumber: 'EE-2025-012', name: 'John Doe', email: 'john.doe@college.edu', departmentId: 'dep-2', semesterId: 'sem-1' }
  ];

  const facultyList: Faculty[] = [
    { id: 'fac-1', userId: 'user-fac-1', employeeId: 'EMP-CS-009', name: 'Dr. Amit Sharma', email: 'amit.sharma@college.edu', departmentId: 'dep-1', subjectIds: ['sub-2', 'sub-3'] },
    { id: 'fac-2', userId: 'user-fac-2', employeeId: 'EMP-CS-012', name: 'Prof. Priya Patel', email: 'priya.patel@college.edu', departmentId: 'dep-1', subjectIds: ['sub-1'] },
    { id: 'fac-3', userId: 'user-fac-3', employeeId: 'EMP-EE-004', name: 'Dr. Rajesh Verma', email: 'rajesh.verma@college.edu', departmentId: 'dep-2', subjectIds: ['sub-4'] }
  ];

  // We will seed past attendance records for the last 15 days manually to make graphs fantastic
  const attendance: AttendanceRecord[] = [];
  const today = new Date('2026-06-23');
  
  // Create attendance logs for standard working days (Mon-Fri) in the previous 2 weeks
  const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'absent', 'present']; // biased to present
  let recIdCounter = 1;

  for (let d = 15; d > 0; d--) {
    const historicalDate = new Date(today);
    historicalDate.setDate(today.getDate() - d);
    const dayOfWeek = historicalDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = historicalDate.toISOString().split('T')[0];

    // CSE Semester 3 teaches Database Management Systems (sub-2)
    // Core students on Semester 3 CS: student-1 (Akul), student-2 (Sarah)
    const sub2StatusAkul = statuses[(d + 1) % statuses.length];
    const sub2StatusSarah = statuses[(d + 3) % statuses.length];
    attendance.push({
      id: `rec-${recIdCounter++}`,
      studentId: 'student-1',
      subjectId: 'sub-2',
      semesterId: 'sem-3',
      date: dateStr,
      status: sub2StatusAkul,
      markedByUserId: 'user-fac-1',
      timestamp: new Date().toISOString()
    });
    attendance.push({
      id: `rec-${recIdCounter++}`,
      studentId: 'student-2',
      subjectId: 'sub-2',
      semesterId: 'sem-3',
      date: dateStr,
      status: sub2StatusSarah,
      markedByUserId: 'user-fac-1',
      timestamp: new Date().toISOString()
    });

    // CSE Semester 1 teaches Introduction to Programming (sub-1)
    // Core student: student-3 (Rohit)
    const sub1StatusRohit = statuses[(d + 2) % statuses.length];
    attendance.push({
      id: `rec-${recIdCounter++}`,
      studentId: 'student-3',
      subjectId: 'sub-1',
      semesterId: 'sem-1',
      date: dateStr,
      status: sub1StatusRohit,
      markedByUserId: 'user-fac-2',
      timestamp: new Date().toISOString()
    });

    // EE Semester 1 teaches Basic Electrical Eng (sub-4)
    // Core student: student-5 (John)
    const sub4StatusJohn = statuses[d % statuses.length];
    attendance.push({
      id: `rec-${recIdCounter++}`,
      studentId: 'student-5',
      subjectId: 'sub-4',
      semesterId: 'sem-1',
      date: dateStr,
      status: sub4StatusJohn,
      markedByUserId: 'user-fac-3',
      timestamp: new Date().toISOString()
    });
  }

  state = {
    users,
    departments,
    semesters,
    subjects,
    students,
    facultyList,
    attendance
  };

  saveToDb();
}

function loadFromDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const dbData = fs.readFileSync(DB_FILE, 'utf8');
      state = JSON.parse(dbData);
      console.log('Database successfully loaded from', DB_FILE);
    } else {
      console.log('Initiating database with premium seed data...');
      seedInitialData();
    }
  } catch (err) {
    console.error('Error loading database, seeding fallback contents.', err);
    seedInitialData();
  }
}

function saveToDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Database save error:', err);
  }
}

loadFromDb();

// Helper context validator
function getStudentDetails(userId: string): Student | undefined {
  return state.students.find(s => s.userId === userId);
}

function getFacultyDetails(userId: string): Faculty | undefined {
  return state.facultyList.find(f => f.userId === userId);
}

// REST APIs
// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid username credentials' });
  }

  // Validate password for admin explicitly
  if (user.role === 'admin') {
    if (!password || password !== 'admin@123') {
      return res.status(401).json({ error: 'Invalid password for Administrator. Use admin@123' });
    }
  }

  res.json({
    token: user.id, // we use user ID as high-fidelity direct auth tokens
    user
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized access token missing' });
  }

  const userId = authHeader.split(' ')[1];
  const user = state.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User session not found' });
  }

  res.json(user);
});

// 2. Departments REST API
app.get('/api/departments', (req, res) => {
  res.json(state.departments);
});

app.post('/api/departments', (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'All fields required' });
  
  const newDept = { id: `dep-${Date.now()}`, name, code };
  state.departments.push(newDept);
  saveToDb();
  res.status(201).json(newDept);
});

app.delete('/api/departments/:id', (req, res) => {
  state.departments = state.departments.filter(d => d.id !== req.params.id);
  saveToDb();
  res.json({ success: true });
});

// 3. Semesters REST API
app.get('/api/semesters', (req, res) => {
  res.json(state.semesters);
});

app.post('/api/semesters', (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'All fields required' });
  
  const newSem = { id: `sem-${Date.now()}`, name, code };
  state.semesters.push(newSem);
  saveToDb();
  res.status(201).json(newSem);
});

app.delete('/api/semesters/:id', (req, res) => {
  state.semesters = state.semesters.filter(s => s.id !== req.params.id);
  saveToDb();
  res.json({ success: true });
});

// 4. Subjects REST API
app.get('/api/subjects', (req, res) => {
  res.json(state.subjects);
});

app.post('/api/subjects', (req, res) => {
  const { code, name, departmentId, semesterId } = req.body;
  if (!code || !name || !departmentId || !semesterId) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  const newSubject: Subject = { id: `sub-${Date.now()}`, code, name, departmentId, semesterId };
  state.subjects.push(newSubject);
  saveToDb();
  res.status(201).json(newSubject);
});

app.delete('/api/subjects/:id', (req, res) => {
  state.subjects = state.subjects.filter(s => s.id !== req.params.id);
  saveToDb();
  res.json({ success: true });
});

// 5. Students REST API
app.get('/api/students', (req, res) => {
  res.json(state.students);
});

app.post('/api/students', (req, res) => {
  const { name, email, rollNumber, departmentId, semesterId, username } = req.body;
  if (!name || !email || !rollNumber || !departmentId || !semesterId || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Create associated User record first
  const userId = `user-stu-${Date.now()}`;
  const newUser: User = {
    id: userId,
    username,
    name,
    email,
    role: 'student',
    departmentId
  };

  const newStudent: Student = {
    id: `student-${Date.now()}`,
    userId,
    rollNumber,
    name,
    email,
    departmentId,
    semesterId
  };

  state.users.push(newUser);
  state.students.push(newStudent);
  saveToDb();
  res.status(201).json(newStudent);
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, rollNumber, departmentId, semesterId } = req.body;

  const stuIndex = state.students.findIndex(s => s.id === id);
  if (stuIndex === -1) return res.status(404).json({ error: 'Student not found' });

  // Update student entry
  const updatedStudent = { ...state.students[stuIndex], name, email, rollNumber, departmentId, semesterId };
  state.students[stuIndex] = updatedStudent;

  // Sync associated User profile if exists
  const userIndex = state.users.findIndex(u => u.id === updatedStudent.userId);
  if (userIndex !== -1) {
    state.users[userIndex] = {
      ...state.users[userIndex],
      name,
      email,
      departmentId
    };
  }

  saveToDb();
  res.json(updatedStudent);
});

app.delete('/api/students/:id', (req, res) => {
  const student = state.students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Remove student profile
  state.students = state.students.filter(s => s.id !== req.params.id);
  // Remove user credential logs
  state.users = state.users.filter(u => u.id !== student.userId);
  // Remove associated attendance
  state.attendance = state.attendance.filter(a => a.studentId !== student.id);

  saveToDb();
  res.json({ success: true });
});

// 6. Faculty REST API
app.get('/api/faculty', (req, res) => {
  res.json(state.facultyList);
});

app.post('/api/faculty', (req, res) => {
  const { name, email, employeeId, departmentId, subjectIds, username } = req.body;
  if (!name || !email || !employeeId || !departmentId || !subjectIds || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const userId = `user-fac-${Date.now()}`;
  const newUser: User = {
    id: userId,
    username,
    name,
    email,
    role: 'faculty',
    departmentId
  };

  const newFaculty: Faculty = {
    id: `fac-${Date.now()}`,
    userId,
    employeeId,
    name,
    email,
    departmentId,
    subjectIds
  };

  state.users.push(newUser);
  state.facultyList.push(newFaculty);
  saveToDb();
  res.status(201).json(newFaculty);
});

app.put('/api/faculty/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, employeeId, departmentId, subjectIds } = req.body;

  const facIndex = state.facultyList.findIndex(f => f.id === id);
  if (facIndex === -1) return res.status(404).json({ error: 'Faculty not found' });

  const updatedFaculty = { ...state.facultyList[facIndex], name, email, employeeId, departmentId, subjectIds };
  state.facultyList[facIndex] = updatedFaculty;

  // Sync associated User record
  const userIndex = state.users.findIndex(u => u.id === updatedFaculty.userId);
  if (userIndex !== -1) {
    state.users[userIndex] = {
      ...state.users[userIndex],
      name,
      email,
      departmentId
    };
  }

  saveToDb();
  res.json(updatedFaculty);
});

app.delete('/api/faculty/:id', (req, res) => {
  const faculty = state.facultyList.find(f => f.id === req.params.id);
  if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

  state.facultyList = state.facultyList.filter(f => f.id !== req.params.id);
  state.users = state.users.filter(u => u.id !== faculty.userId);

  saveToDb();
  res.json({ success: true });
});

// 7. Attendance REST API
// Fetch reports based on queries
app.get('/api/attendance', (req, res) => {
  const { studentId, subjectId, semesterId, date } = req.query;
  let records = state.attendance;

  if (studentId) records = records.filter(r => r.studentId === studentId);
  if (subjectId) records = records.filter(r => r.subjectId === subjectId);
  if (semesterId) records = records.filter(r => r.semesterId === semesterId);
  if (date) records = records.filter(r => r.date === date);

  res.json(records);
});

// Bulk insert or update attendance records
app.post('/api/attendance/bulk', (req, res) => {
  const { subjectId, semesterId, date, records, markedByUserId } = req.body;
  if (!subjectId || !semesterId || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing mandatory batch components' });
  }

  records.forEach((record: { studentId: string; status: AttendanceStatus; notes?: string }) => {
    // If a record already exists for this student, subject, and date, update it.
    const existingIndex = state.attendance.findIndex(
      r => r.studentId === record.studentId && r.subjectId === subjectId && r.date === date
    );

    if (existingIndex !== -1) {
      state.attendance[existingIndex] = {
        ...state.attendance[existingIndex],
        status: record.status,
        notes: record.notes,
        markedByUserId,
        timestamp: new Date().toISOString()
      };
    } else {
      state.attendance.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId: record.studentId,
        subjectId,
        semesterId,
        date,
        status: record.status,
        markedByUserId,
        notes: record.notes,
        timestamp: new Date().toISOString()
      });
    }
  });

  saveToDb();
  res.json({ success: true, count: records.length });
});

// 8. Statistics Endpoints
// Student statistics
app.get('/api/stats/student/:userId', (req, res) => {
  const student = state.students.find(s => s.userId === req.params.userId);
  if (!student) return res.status(404).json({ error: 'Student registration not found' });

  // Get all subjects in the student's semester
  const studentSubjects = state.subjects.filter(s => s.semesterId === student.semesterId && s.departmentId === student.departmentId);
  
  const studentStats: SubjectAttendanceStats[] = studentSubjects.map(sub => {
    const records = state.attendance.filter(r => r.studentId === student.id && r.subjectId === sub.id);
    const totalClasses = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const excusedCount = records.filter(r => r.status === 'excused').length;
    const percentage = totalClasses > 0 ? Math.round(((presentCount + excusedCount * 0.5) / totalClasses) * 100) : 100; // Excused counts as 50% attend rate or customizable

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      totalClasses,
      presentCount,
      absentCount,
      excusedCount,
      percentage,
      records
    };
  });

  res.json({
    student,
    summary: {
      totalSubjects: studentStats.length,
      averagePercentage: studentStats.length > 0 
        ? Math.round(studentStats.reduce((sum, item) => sum + item.percentage, 0) / studentStats.length)
        : 100
    },
    subjectWiseStats: studentStats
  });
});

// Faculty statistics
app.get('/api/stats/faculty/:userId', (req, res) => {
  const faculty = state.facultyList.find(f => f.userId === req.params.userId);
  if (!faculty) return res.status(404).json({ error: 'Faculty registration not found' });

  // Find students belonging to subjects they teach
  const mySubjects = state.subjects.filter(s => faculty.subjectIds.includes(s.id));
  
  // Unique semesterids and departmentIds
  const semesterIds = [...new Set(mySubjects.map(s => s.semesterId))];
  const departmentId = faculty.departmentId;

  const relevantStudents = state.students.filter(
    s => s.departmentId === departmentId && semesterIds.includes(s.semesterId)
  );

  // Compile daily stats over the last 10 marked dates
  const uniqueDates = [...new Set(
    state.attendance
      .filter(a => faculty.subjectIds.includes(a.subjectId))
      .map(a => a.date)
  )].sort().slice(-10);

  const dailyStats = uniqueDates.map(date => {
    const dailyRecords = state.attendance.filter(
      a => faculty.subjectIds.includes(a.subjectId) && a.date === date
    );
    const total = dailyRecords.length;
    const present = dailyRecords.filter(r => r.status === 'present').length;
    return {
      date,
      rate: total > 0 ? Math.round((present / total) * 100) : 100
    };
  });

  // Average attendance across all their subjects
  const myAttendanceRecords = state.attendance.filter(a => faculty.subjectIds.includes(a.subjectId));
  const totalAttended = myAttendanceRecords.length;
  const presentAttended = myAttendanceRecords.filter(r => r.status === 'present').length;
  const averageAttendance = totalAttended > 0 ? Math.round((presentAttended / totalAttended) * 100) : 100;

  res.json({
    faculty,
    totalStudents: relevantStudents.length,
    totalSubjects: mySubjects.length,
    averageAttendance,
    dailyStats
  });
});

// Central Administrator reports
app.get('/api/stats/admin', (req, res) => {
  const totalStudents = state.students.length;
  const totalFaculty = state.facultyList.length;
  const totalSubjects = state.subjects.length;
  const totalRecords = state.attendance.length;

  const presentCount = state.attendance.filter(r => r.status === 'present').length;
  const overallAttendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;

  // Stats by department
  const departmentStats = state.departments.map(dept => {
    const deptStudentIds = state.students.filter(s => s.departmentId === dept.id).map(s => s.id);
    const deptAttendance = state.attendance.filter(a => deptStudentIds.includes(a.studentId));
    const deptTotal = deptAttendance.length;
    const deptPresent = deptAttendance.filter(r => r.status === 'present').length;
    
    return {
      departmentId: dept.id,
      name: dept.name,
      code: dept.code,
      studentCount: deptStudentIds.length,
      attendanceRate: deptTotal > 0 ? Math.round((deptPresent / deptTotal) * 100) : 100
    };
  });

  res.json({
    meta: {
      totalStudents,
      totalFaculty,
      totalSubjects,
      overallAttendanceRate
    },
    departmentStats
  });
});

// Vite Setup: Asset pipeline integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AttendEase] Server listening successfully on http://0.0.0.0:${PORT}`);
  });
}

// Global Exception handler
process.on('uncaughtException', (err) => {
  console.error('[AttendEase] Uncaught exception error caught:', err);
});

startServer();
