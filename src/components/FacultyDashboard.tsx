/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XSquare, 
  BookOpen, 
  Check, 
  Save, 
  Search, 
  RotateCcw, 
  TrendingUp, 
  FileText, 
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { User, Faculty, Student, Subject, AttendanceStatus, Semester } from '../types';

interface FacultyDashboardProps {
  user: User;
}

export default function FacultyDashboard({ user }: FacultyDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // States
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Dashboard overall aggregates
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalSubjects: number;
    averageAttendance: number;
    dailyStats: { date: string; rate: number }[];
  } | null>(null);

  // Selector controls
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-23');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Local Attendance marking states
  // StudentId -> { status: AttendanceStatus, notes: string }
  const [rollCall, setRollCall] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});

  const reloadAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('attendease_token');

      // 1. Fetch Faculty Stats & info
      const statsResponse = await fetch(`/api/stats/faculty/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!statsResponse.ok) throw new Error('Unassigned faculty profile credentials.');
      const statsData = await statsResponse.json();
      setFaculty(statsData.faculty);
      setStats({
        totalStudents: statsData.totalStudents,
        totalSubjects: statsData.totalSubjects,
        averageAttendance: statsData.averageAttendance,
        dailyStats: statsData.dailyStats
      });

      // 2. Fetch list of subjects taught
      const subjectsResponse = await fetch('/api/subjects');
      if (subjectsResponse.ok) {
        const subData: Subject[] = await subjectsResponse.json();
        const filteredSubjects = subData.filter(s => statsData.faculty.subjectIds.includes(s.id));
        setSubjects(filteredSubjects);
        
        // Auto-select first subject
        if (filteredSubjects.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(filteredSubjects[0].id);
        }
      }

      // 3. Fetch academic semesters
      const semResponse = await fetch('/api/semesters');
      if (semResponse.ok) {
        const sData = await semResponse.json();
        setSemesters(sData);
      }

      // 4. Fetch Master Students list
      const stuResponse = await fetch('/api/students');
      if (stuResponse.ok) {
        const sList = await stuResponse.json();
        setStudents(sList);
      }

    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: err.message || 'Error occurred loading workspace data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAllData();
  }, [user.id]);

  // Load existing attend records when Subject, Date changes to pre-populate roll call
  useEffect(() => {
    async function fetchExistingAttendance() {
      if (!selectedSubjectId || !selectedDate) return;

      try {
        const response = await fetch(`/api/attendance?subjectId=${selectedSubjectId}&date=${selectedDate}`);
        if (response.ok) {
          const records = await response.json();
          const initialRoll: Record<string, { status: AttendanceStatus; notes: string }> = {};
          
          records.forEach((rec: any) => {
            initialRoll[rec.studentId] = {
              status: rec.status,
              notes: rec.notes || ''
            };
          });

          setRollCall(initialRoll);
        }
      } catch (err) {
        console.error('Failed to load existing attendance log state:', err);
      }
    }

    fetchExistingAttendance();
  }, [selectedSubjectId, selectedDate]);

  // Filter relevant students depending on selected subject's course department / semester
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const relevantStudents = students.filter(student => {
    if (!activeSubject) return false;
    return student.departmentId === activeSubject.departmentId && student.semesterId === activeSubject.semesterId;
  });

  const filteredStudents = relevantStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Controls
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRollCall(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setRollCall(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status || 'present',
        notes
      }
    }));
  };

  const markAllAs = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = { ...rollCall };
    relevantStudents.forEach(student => {
      updated[student.id] = {
        status,
        notes: updated[student.id]?.notes || ''
      };
    });
    setRollCall(updated);
    setNotification({ type: 'success', message: `Marked all loaded students as ${status}.` });
  };

  const handleCommitAttendance = async () => {
    if (!selectedSubjectId || !activeSubject) {
      setNotification({ type: 'error', message: 'Please select a subject code.' });
      return;
    }

    setSaving(true);
    setNotification(null);

    // Build Payload
    const recordsPayload = relevantStudents.map(student => {
      const roll = rollCall[student.id] || { status: 'present', notes: '' };
      return {
        studentId: student.id,
        status: roll.status,
        notes: roll.notes
      };
    });

    try {
      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          semesterId: activeSubject.semesterId,
          date: selectedDate,
          records: recordsPayload,
          markedByUserId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Batch logging API reported failure');
      }

      setNotification({ 
        type: 'success', 
        message: `Successfully logged roll-call. Saved ${recordsPayload.length} students attendance for ${selectedDate}.` 
      });

      // Quick delay to update metrics
      await reloadAllData();
      
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: err.message || 'Error occurred recording logs.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !faculty) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-slate-500 font-medium font-sans">Bootstrapping faculty workspace ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Header welcome */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Faculty Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome, {faculty?.name}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Employee ID: <span className="font-mono text-slate-700 font-semibold">{faculty?.employeeId}</span> • CS Department Advisor • Room 402 Workstation
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            onClick={reloadAllData}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 font-semibold text-slate-600 text-sm cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex items-start space-x-3 ${
            notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-850'
          }`}
        >
          <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${notification.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`} />
          <span className="text-sm font-semibold">{notification.message}</span>
        </motion.div>
      )}

      {/* 2. Mini KPI boxes with SVGs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Academic Attendance</h3>
            <p className="text-3xl font-extrabold text-emerald-600">{stats?.averageAttendance}%</p>
            <p className="text-xs text-slate-500 font-medium">Across your courses</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course Subjects Taught</h3>
            <p className="text-3xl font-extrabold text-indigo-600">{stats?.totalSubjects}</p>
            <p className="text-xs text-slate-500 font-medium">Under active syllabus registration</p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Students</h3>
            <p className="text-3xl font-extrabold text-purple-600">{stats?.totalStudents}</p>
            <p className="text-xs text-slate-500 font-medium">Belonging to your class divisions</p>
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Daily Stats Trend Visual Timeline */}
      {stats && stats.dailyStats && stats.dailyStats.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 tracking-tight flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Recent Class Attendance Logging History (monitored dates)</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch justify-start gap-4">
            {stats.dailyStats.map((ds) => (
              <div 
                key={ds.date}
                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center flex-1 min-w-[100px] flex sm:flex-col items-center sm:justify-center justify-between gap-2"
              >
                <div className="text-left sm:text-center">
                  <p className="text-xs font-bold font-mono text-slate-700">{ds.date}</p>
                  <p className="text-[9px] font-bold text-slate-450 uppercase mt-0.5">Marked session</p>
                </div>
                <div className="sm:mt-2 text-right sm:text-center shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                    ds.rate >= 75 ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {ds.rate}% rate
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Active Roll call Roll Marker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left selector sidebar inside dashboard */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
              Class Session Parameters
            </h3>

            {/* Subject Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Select Active Subject</label>
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="width-fill block w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {subjects.map(s => (
                  <option id={`select-sub-opt-${s.id}`} key={s.id} value={s.id}>
                    ({s.code}) {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Select Log Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Helper notes */}
            {activeSubject && (
              <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl text-xs text-indigo-750 space-y-1.5">
                <p className="font-bold uppercase tracking-wider text-[9px] text-indigo-500">Class Info Card</p>
                <p>Registering attendance for <b>{relevantStudents.length} Students</b> of CSE division under active record timeline.</p>
                <p>Minimum pass clearance requirement is <b>75%</b>. Marks will affect end-semester logs list.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Active student checklist table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Table Header and action controls */}
            <div className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Filter student list..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="width-fill block w-slice pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {/* Bulk operations */}
              <div className="flex items-center space-x-2.5 text-xs">
                <span className="text-slate-450 font-semibold">Bulk:</span>
                <button 
                  onClick={() => markAllAs('present')}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl cursor-pointer"
                >
                  All Present
                </button>
                <button 
                  onClick={() => markAllAs('absent')}
                  className="px-3 py-1.5 bg-rose-50 border border-rose-150 hover:bg-rose-100 text-rose-700 font-bold rounded-xl cursor-pointer"
                >
                  All Absent
                </button>
              </div>

            </div>

            {/* Active Checklist Student row lists */}
            <div className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <UserCheck className="w-12 h-12 text-slate-250 mx-auto" />
                  <p className="text-sm font-semibold">No students mapped to this Class query.</p>
                  <p className="text-xs">Ensure correct subject and date selections.</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const roll = rollCall[student.id] || { status: 'present', notes: '' };
                  const currentStatus = roll.status;
                  
                  return (
                    <div 
                      key={student.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/20 transition-colors"
                    >
                      {/* Left: Avatar & roll info */}
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{student.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium tracking-wide">Roll No: {student.rollNumber}</p>
                        </div>
                      </div>

                      {/* Middle Notes info */}
                      <div className="flex-1 max-w-[200px]">
                        <input 
                          type="text"
                          placeholder="Excuses, medical leaves..."
                          value={roll.notes || ''}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="w-full text-xs text-slate-500 border border-slate-100/80 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20"
                        />
                      </div>

                      {/* Right Switch Button controls */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Present */}
                        <button
                          id={`btn-present-${student.id}`}
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1 border cursor-pointer transition-colors ${
                            currentStatus === 'present'
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        {/* Absent */}
                        <button
                          id={`btn-absent-${student.id}`}
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1 border cursor-pointer transition-colors ${
                            currentStatus === 'absent'
                              ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <XSquare className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>

                        {/* Excused */}
                        <button
                          id={`btn-excused-${student.id}`}
                          onClick={() => handleStatusChange(student.id, 'excused')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1 border cursor-pointer transition-colors ${
                            currentStatus === 'excused'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/10'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Excused</span>
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Form Action Commits */}
            {filteredStudents.length > 0 && (
              <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">
                  Saving writes directly to persistent state database.
                </p>
                <button
                  id="submit-attendance-log"
                  disabled={saving}
                  onClick={handleCommitAttendance}
                  className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-md shadow-emerald-500/10 text-white font-bold text-sm cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Sheet...' : 'Save Attendance Roll'}</span>
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
