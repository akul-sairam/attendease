/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  Sliders, 
  MapPin, 
  Layers, 
  Plus, 
  Trash, 
  Edit2, 
  FileSpreadsheet, 
  Search, 
  CheckCircle, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { User, Student, Faculty, Subject, Semester, Department } from '../types';

interface AdminDashboardProps {
  user: User;
}

type ActiveTab = 'students' | 'faculty' | 'subjects' | 'semesters' | 'departments' | 'reports';

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Core Mapped Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Reporting statistics
  const [stats, setStats] = useState<{
    meta: { totalStudents: number; totalFaculty: number; totalSubjects: number; overallAttendanceRate: number };
    departmentStats: any[];
  } | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Creation forms states helper
  const [studentForm, setStudentForm] = useState({ name: '', email: '', rollNumber: '', departmentId: '', semesterId: '', username: '' });
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', employeeId: '', departmentId: '', subjectIds: [] as string[], username: '' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', departmentId: '', semesterId: '' });
  const [semesterForm, setSemesterForm] = useState({ name: '', code: '' });
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '' });

  // Load backend database models
  const reloadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('attendease_token');

      // Fetch Reporting summary
      const statsRes = await fetch('/api/stats/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch lists
      const [stuRes, facRes, subRes, semRes, depRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/faculty'),
        fetch('/api/subjects'),
        fetch('/api/semesters'),
        fetch('/api/departments')
      ]);

      if (stuRes.ok) setStudents(await stuRes.json());
      if (facRes.ok) setFacultyList(await facRes.json());
      if (subRes.ok) setSubjects(await subRes.json());
      if (semRes.ok) setSemesters(await semRes.json());
      if (depRes.ok) setDepartments(await depRes.json());

      // Pre-set some form default selectors once loaded
    } catch (err) {
      console.error('Failed to load admin tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Form Creation triggers
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email || !studentForm.username || !studentForm.departmentId || !studentForm.semesterId) {
      triggerAlert('error', 'All fields are required.');
      return;
    }
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm)
      });
      if (!response.ok) throw new Error('Failed to create student register');
      triggerAlert('success', `Student '${studentForm.name}' successfully added to database.`);
      setStudentForm({ name: '', email: '', rollNumber: '', departmentId: '', semesterId: '', username: '' });
      reloadData();
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyForm.name || !facultyForm.email || !facultyForm.employeeId || !facultyForm.departmentId || facultyForm.subjectIds.length === 0) {
      triggerAlert('error', 'All fields including subject course selections are required.');
      return;
    }
    try {
      const response = await fetch('/api/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyForm)
      });
      if (!response.ok) throw new Error('Failed to create faculty record');
      triggerAlert('success', `Faculty advisor '${facultyForm.name}' successfully registered.`);
      setFacultyForm({ name: '', email: '', employeeId: '', departmentId: '', subjectIds: [], username: '' });
      reloadData();
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code || !subjectForm.name || !subjectForm.departmentId || !subjectForm.semesterId) {
      triggerAlert('error', 'All fields are required.');
      return;
    }
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm)
      });
      if (!response.ok) throw new Error('Failed to create subject entry');
      triggerAlert('success', `Subject '${subjectForm.name}' (${subjectForm.code}) added.`);
      setSubjectForm({ code: '', name: '', departmentId: '', semesterId: '' });
      reloadData();
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterForm.name || !semesterForm.code) return;
    try {
      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(semesterForm)
      });
      if (!response.ok) throw new Error();
      triggerAlert('success', `Academic Term '${semesterForm.name}' added.`);
      setSemesterForm({ name: '', code: '' });
      reloadData();
    } catch (err) {
      triggerAlert('error', 'Could not create terms.');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentForm.name || !departmentForm.code) return;
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentForm)
      });
      if (!response.ok) throw new Error();
      triggerAlert('success', `Department '${departmentForm.name}' mapped.`);
      setDepartmentForm({ name: '', code: '' });
      reloadData();
    } catch (err) {
      triggerAlert('error', 'Failed creating department entry.');
    }
  };

  // Delete Action items
  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this catalog record? This will revoke access logs.')) return;
    try {
      const response = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Deletion endpoint reported failure');
      triggerAlert('success', 'Catalog record erased successfully.');
      reloadData();
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4 animate-spin"></div>
        <p className="text-slate-500 font-bold">Consolidating central college statistics...</p>
      </div>
    );
  }

  // Choose sub-form placeholders based on active selections
  const dStats = stats?.departmentStats || [];

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Header with totals */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            Centralized Administrator Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Academic Operations Portal
          </h1>
          <p className="text-sm text-slate-505 font-medium">
            Authorized admin credentials • Central Reporting & DB schemas
          </p>
        </div>

        <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl flex items-center space-x-3 shrink-0">
          <CheckCircle className="w-6 h-6 text-purple-600" />
          <div>
            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider">Overall Campus Rate</h4>
            <p className="text-xl font-black text-purple-950">{stats?.meta.overallAttendanceRate}%</p>
          </div>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm font-semibold ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{notification.message}</span>
        </motion.div>
      )}

      {/* 2. Primary Tabs bar */}
      <div className="flex border-b border-slate-150 overflow-x-auto pb-1 gap-2">
        {(['reports', 'students', 'faculty', 'subjects', 'semesters', 'departments'] as ActiveTab[]).map((tab) => (
          <button
            id={`tab-btn-${tab}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border-b-2 font-bold text-sm capitalize tracking-tight whitespace-nowrap cursor-pointer transition-all ${
              activeTab === tab
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-450 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Tab Workspaces */}
      
      {/* Tab: Central Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-8">
          
          {/* Key KPI block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Campus Students</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats?.meta.totalStudents}</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Faculty Members</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats?.meta.totalFaculty}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Subjects</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats?.meta.totalSubjects}</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Department comparative graphs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-850">Department Attendance Performance Matrix</h3>
                <p className="text-xs text-slate-450">Central comparative audit across major branches</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Report Ledger</span>
              </button>
            </div>

            {/* Custom SVG/Tailwind comparative chart */}
            <div className="space-y-5">
              {dStats.map((ds: any) => {
                const color = ds.attendanceRate >= 75 ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-rose-500 to-amber-500';
                return (
                  <div key={ds.departmentId} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-705 font-mono">[{ds.code}]</span>
                        <span className="font-bold text-slate-800 leading-none">{ds.name}</span>
                      </div>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-slate-450">{ds.studentCount} Students</span>
                        <span className="font-extrabold text-indigo-750">{ds.attendanceRate}% Logged rate</span>
                      </div>
                    </div>
                    {/* Visual bar container */}
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${ds.attendanceRate}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Students */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add Student Form */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Add New Student</h3>
              <form onSubmit={handleCreateStudent} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Liam Neeson"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Username</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. liam_p"
                      value={studentForm.username}
                      onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="student@college.edu"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Roll Number</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="CSE-2026-904"
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Department</label>
                    <select 
                      value={studentForm.departmentId}
                      onChange={(e) => setStudentForm({ ...studentForm, departmentId: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Term Semester</label>
                    <select 
                      value={studentForm.semesterId}
                      onChange={(e) => setStudentForm({ ...studentForm, semesterId: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white font-bold rounded-xl cursor-pointer shadow-md flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enrol Student Profile</span>
                </button>
              </form>
            </div>
          </div>

          {/* Student Catalog list */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Student Catalog</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 uppercase font-bold border-b border-slate-100">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(stu => {
                    const dept = departments.find(d => d.id === stu.departmentId);
                    return (
                      <tr key={stu.id} className="hover:bg-slate-55/40">
                        <td className="py-3 px-3 font-bold text-slate-800">{stu.name}</td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-550">{stu.rollNumber}</td>
                        <td className="py-3 px-3 font-semibold text-slate-500">{dept?.code || 'None'}</td>
                        <td className="py-3 px-3 text-right">
                          <button 
                            onClick={() => handleDeleteItem('students', stu.id)} 
                            title="Deport registration log"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Faculty */}
      {activeTab === 'faculty' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add Faculty Form */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Register New Instructor</h3>
              <form onSubmit={handleCreateFaculty} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Dr. Brown"
                      value={facultyForm.name}
                      onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Username</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. dr.brown"
                      value={facultyForm.username}
                      onChange={(e) => setFacultyForm({ ...facultyForm, username: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="brown@college.edu"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Employee ID</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="EMP-EE-090"
                      value={facultyForm.employeeId}
                      onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-bold text-[10px]">Department</label>
                    <select 
                      value={facultyForm.departmentId}
                      onChange={(e) => setFacultyForm({ ...facultyForm, departmentId: e.target.value })}
                      className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* SubCheckbox fields list */}
                <div className="space-y-1.5 border border-slate-100 p-3 rounded-2xl">
                  <label className="text-slate-500 uppercase font-bold text-[9px] block">Assign Teaching Course Syllabus</label>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-2">
                    {subjects.map(sub => {
                      const deptCode = departments.find(d => d.id === sub.departmentId)?.code || '';
                      return (
                        <label key={sub.id} className="flex items-center space-x-2 text-slate-650 cursor-pointer leading-none">
                          <input 
                            type="checkbox"
                            checked={facultyForm.subjectIds.includes(sub.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFacultyForm(prev => {
                                const current = prev.subjectIds;
                                const updated = checked ? [...current, sub.id] : current.filter(id => id !== sub.id);
                                return { ...prev, subjectIds: updated };
                              });
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 border-slate-200"
                          />
                          <span>({sub.code}) {sub.name} [{deptCode}]</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white font-bold rounded-xl cursor-pointer shadow-md flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Map Faculty Ledger</span>
                </button>
              </form>
            </div>
          </div>

          {/* Faculty list catalog */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Faculty Advisory Catalog</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 uppercase font-bold border-b border-slate-100">
                    <th className="py-2.5 px-3">Instructor</th>
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Enrolled Courses</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facultyList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-55/40">
                      <td className="py-3 px-3 font-bold text-slate-800">{item.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">{item.employeeId}</td>
                      <td className="py-3 px-3 font-semibold text-indigo-600">{item.subjectIds.length} syllabus loaded</td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => handleDeleteItem('faculty', item.id)} 
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Subjects */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Add New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Subject Code</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. CS-404"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Semester</label>
                  <select 
                    value={subjectForm.semesterId}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semesterId: e.target.value })}
                    className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    required
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-bold text-[10px]">Course Display Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Artificial Intelligence"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-bold text-[10px]">Course Department</label>
                <select 
                  value={subjectForm.departmentId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
                  className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white font-bold rounded-xl cursor-pointer"
              >
                Create Subject syllabus
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Syllabus Grid</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 uppercase font-bold border-b border-slate-100">
                    <th className="py-2.5 px-3">Subject Code</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map(sub => {
                    const dept = departments.find(d => d.id === sub.departmentId);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-55/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{sub.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-700">{sub.name}</td>
                        <td className="py-3 px-3 font-semibold text-slate-500">{dept?.code}</td>
                        <td className="py-3 px-3 text-right">
                          <button 
                            onClick={() => handleDeleteItem('subjects', sub.id)} 
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Semesters */}
      {activeTab === 'semesters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Register Sem Period</h3>
            <form onSubmit={handleCreateSemester} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-bold text-[10px]">Semester Display Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Semester 4"
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                  className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-bold text-[10px]">Term Code</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. S4"
                  value={semesterForm.code}
                  onChange={(e) => setSemesterForm({ ...semesterForm, code: e.target.value })}
                  className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white font-bold rounded-xl cursor-pointer"
              >
                Register Term Row
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Academic Term Registers</h3>
            <tbody className="divide-y divide-slate-100">
              {semesters.map(sem => (
                <div key={sem.id} className="p-3 bg-slate-50/60 rounded-xl flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{sem.name}</h4>
                    <p className="text-[10px] text-slate-450 font-mono">CODE: {sem.code}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteItem('semesters', sem.id)}
                    className="p-1 px-2 text-[10px] bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                  >
                    Erase Code
                  </button>
                </div>
              ))}
            </tbody>
          </div>
        </div>
      )}

      {/* Tab: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Register Department Division</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-bold text-[10px]">Department Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Chemical Engineering"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-bold text-[10px]">Log shorthand Code</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. CHE"
                  value={departmentForm.code}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })}
                  className="block w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white font-bold rounded-xl cursor-pointer"
              >
                Register Department Division
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Department Catalog</h3>
            {departments.map(dept => (
              <div key={dept.id} className="p-3 bg-slate-50/60 rounded-xl flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-850">{dept.name}</h4>
                  <p className="text-[10px] text-slate-450 font-mono">CODE: {dept.code}</p>
                </div>
                <button 
                  onClick={() => handleDeleteItem('departments', dept.id)}
                  className="p-1 px-2 text-[10px] bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                >
                  Erase Block
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
