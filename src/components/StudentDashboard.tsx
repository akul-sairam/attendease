/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Mail, 
  BookOpen, 
  ServerCrash
} from 'lucide-react';
import { User, Student, SubjectAttendanceStats } from '../types';

interface StudentDashboardProps {
  user: User;
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<{
    student: Student;
    summary: { totalSubjects: number; averagePercentage: number };
    subjectWiseStats: SubjectAttendanceStats[];
  } | null>(null);
  const [facultyList, setFacultyList] = useState<any[]>([]);

  useEffect(() => {
    async function loadStudentStats() {
      try {
        setLoading(true);
        // Load attendance metrics
        const token = localStorage.getItem('attendease_token');
        const response = await fetch(`/api/stats/student/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to retrieve student attendance ledger data');
        }

        const data = await response.json();
        setStatsData(data);

        // Fetch supporting Faculty list
        const facRes = await fetch('/api/faculty');
        if (facRes.ok) {
          const facData = await facRes.json();
          setFacultyList(facData);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    }

    loadStudentStats();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Assembling student attendance data...</p>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4">
        <ServerCrash className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-rose-800">Attendance Database Offline</h3>
        <p className="text-sm text-rose-600">{error || 'Could not map student dataset'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-rose-700 cursor-pointer"
        >
          Troubleshoot Sync
        </button>
      </div>
    );
  }

  const { student, summary, subjectWiseStats } = statsData;

  // Compute overall status colors
  const avgPct = summary.averagePercentage;
  const isDefaulter = avgPct < 75;
  const progressDialColor = isDefaulter ? '#ef4444' : avgPct < 85 ? '#f97316' : '#10b981';

  // Math helper for svg circles
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgPct / 100) * circumference;

  return (
    <div className="space-y-8">
      
      {/* 1. Header Hero Card with student outline */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Active Student Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome back, {student.name}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Roll Number: <span className="font-mono text-slate-700 font-semibold">{student.rollNumber}</span> • CSE Department • Current Semester: <span className="font-semibold text-slate-700">Semester 3</span>
          </p>
        </div>

        {/* 75% Cutoff Banner logic */}
        {isDefaulter ? (
          <div className="flex items-center space-x-3 bg-rose-50 border border-rose-100 px-5 py-3 rounded-2xl max-w-md shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide">Critical Warning Alert</h4>
              <p className="text-xs text-rose-600 mt-0.5">Your average attendance is <b>{avgPct}%</b>, which lies below the requested university cutoff of <b>75%</b>.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl max-w-md shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Academic Clearance Approved</h4>
              <p className="text-xs text-emerald-600 mt-0.5">Your average attendance is <b>{avgPct}%</b>. Your clearance for examinations is active.</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Cumulative Stats Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radial Circular Progress Gauge */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</h3>
            <p className="text-3xl font-extrabold text-slate-800">{avgPct}%</p>
            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Integrated over query period</p>
          </div>
          
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Back track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="text-slate-100"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Direct value arc */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke={progressDialColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-slate-800 text-base">
              {avgPct}%
            </div>
          </div>
        </div>

        {/* Regular stats */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monitored Courses</h3>
            <p className="text-3xl font-extrabold text-indigo-600">{subjectWiseStats.length}</p>
            <p className="text-xs text-slate-500 font-medium">Core courses in current semester</p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Attendance Logs</h3>
            <p className="text-3xl font-extrabold text-emerald-600">
              {subjectWiseStats.reduce((sum, s) => sum + s.totalClasses, 0)}
            </p>
            <p className="text-xs text-slate-500 font-medium">Aggregated across all registered periods</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Subject-wise Grid Visual List */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <span>Subject-Wise Attendance Overview</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjectWiseStats.map((subStats) => {
            const pct = subStats.percentage;
            const hasDanger = pct < 75;
            const barBgColor = hasDanger ? 'bg-rose-500' : pct < 85 ? 'bg-orange-500' : 'bg-emerald-500';
            const badgeStyle = hasDanger 
              ? 'bg-rose-50 border-rose-100 text-rose-700' 
              : pct < 85 
                ? 'bg-orange-50 border-orange-100 text-orange-700' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-700';

            return (
              <div 
                key={subStats.subjectId}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Visual left accent bar depending on safety */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${barBgColor}`} />

                <div className="flex items-start justify-between">
                  <div className="space-y-1 pl-2">
                    <span className="font-mono text-xs text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">
                      {subStats.subjectCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight mt-1">
                      {subStats.subjectName}
                    </h3>
                  </div>
                  <div className={`border px-3 py-1.5 rounded-2xl text-center shrink-0 ${badgeStyle}`}>
                    <p className="text-xs font-bold font-mono tracking-tight">{pct}%</p>
                    <p className="text-[9px] font-extrabold uppercase mt-0.5">Rate</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-1.5 pl-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>Performance index: {pct >= 75 ? 'Cleared' : 'Defaulter Warning'}</span>
                    <span className="font-mono text-slate-700">{subStats.presentCount}/{subStats.totalClasses} Present</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full ${barBgColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Micro breakdowns of attendance states */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-2xl pl-4 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Present</p>
                    <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">{subStats.presentCount} Classes</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Absent</p>
                    <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">{subStats.absentCount} Classes</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Excused</p>
                    <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">{subStats.excusedCount} Classes</p>
                  </div>
                </div>

                {/* Timeline Grid of Logs */}
                <div className="pl-2 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Logs Grid</p>
                  {subStats.records.length === 0 ? (
                    <p className="text-xs text-slate-400 italic font-medium">No recorded session sessions logged yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {subStats.records.slice(-10).map((rec) => {
                        const bgCircle = rec.status === 'present' 
                          ? 'bg-emerald-500 text-white' 
                          : rec.status === 'absent' 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-amber-500 text-white';
                        const textChar = rec.status === 'present' ? 'P' : rec.status === 'absent' ? 'A' : 'E';
                        return (
                          <div
                            id={`log-dot-${rec.id}`}
                            key={rec.id}
                            title={`Date: ${rec.date} | Status: ${rec.status}`}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${bgCircle} shadow-sm cursor-help transition-transform hover:scale-105`}
                          >
                            {textChar}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Faculty Contact / Academic Support Deck */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Academic Support Contacts</h2>
          <p className="text-xs text-slate-400">Reach out directly to your faculty advisors for attendance excuses, medical leaves, or audit requests.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyList.map((fac) => (
            <div 
              key={fac.id}
              className="border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div className="space-y-1 max-w-[200px]">
                <p className="text-xs font-mono text-slate-400 font-bold">{fac.employeeId}</p>
                <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">{fac.name}</h4>
                <p className="text-[10px] text-slate-500 capitalize line-clamp-1">Department Admin</p>
              </div>

              <a 
                href={`mailto:${fac.email}`}
                className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shrink-0"
                title={`Mail to ${fac.name}`}
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
