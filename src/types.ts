/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string; // For faculty or students
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Semester {
  id: string;
  name: string; // e.g. "Fall 2026", "Semester 1"
  code: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  semesterId: string;
}

export interface Student {
  id: string;
  userId: string; // references User
  rollNumber: string;
  name: string;
  email: string;
  departmentId: string;
  semesterId: string;
}

export interface Faculty {
  id: string;
  userId: string; // references User
  employeeId: string;
  name: string;
  email: string;
  departmentId: string;
  subjectIds: string[]; // subjects they can teach
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedByUserId: string; // user doing the marking
  timestamp: string;
  notes?: string;
}

// Stats types
export interface SubjectAttendanceStats {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  percentage: number;
  records: AttendanceRecord[];
}

export interface FacultyDashboardStats {
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  dailyStats: { date: string; rate: number }[];
}
