/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  LogOut, 
  Calendar, 
  User as UserIcon, 
  Shield, 
  BookOpen, 
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import { User } from '../types';

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ user, onLogout, theme, onToggleTheme, children }: DashboardLayoutProps) {
  const formattedDate = 'Tuesday, June 23, 2026';
  
  // Choose role-specific layout accent colors
  const roleStyles = {
    admin: {
      bg: 'bg-purple-600',
      lbl: 'Administrator Portal',
      accent: 'border-purple-200 text-purple-700 bg-purple-50',
      icon: Shield
    },
    faculty: {
      bg: 'bg-emerald-600',
      lbl: 'Faculty Workspace',
      accent: 'border-emerald-200 text-emerald-700 bg-emerald-50',
      icon: BookOpen
    },
    student: {
      bg: 'bg-indigo-600',
      lbl: 'Student Attendance Tracker',
      accent: 'border-indigo-200 text-indigo-700 bg-indigo-50',
      icon: GraduationCap
    }
  };

  const style = roleStyles[user.role] || roleStyles.student;
  const RoleIcon = style.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Decorative background vectors */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-indigo-50/40 to-transparent pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-2xl text-white ${style.bg} shadow-md`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-800">
                  AttendEase
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.accent}`}>
                  {style.lbl}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium hidden sm:block">
                College Attendance Management System
              </p>
            </div>
          </div>

          {/* Quick Context Stats (Date & User Profile Info) */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Clock & Date Badge */}
            <div className="hidden lg:flex items-center space-x-2.5 bg-slate-50 border border-slate-100/80 px-3.5 py-1.5 rounded-2xl text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{formattedDate}</span>
              <span className="w-px h-3 bg-slate-200 mx-1" />
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">02:02 AM</span>
            </div>

            {/* Dynamic Dark Mode Toggle */}
            <button
              id="dashboard-theme"
              onClick={onToggleTheme}
              title={`Toggle to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* User Profile dropdown panel */}
            <div className="flex items-center space-x-3 bg-slate-50/55 p-1 rounded-2xl border border-slate-150 pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 line-clamp-1">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium lowercase line-clamp-1">{user.email}</p>
              </div>
              
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-slate-600">
                <UserIcon className="w-4 h-4" />
              </div>

              {/* Logout mechanism */}
              <button
                id="logout-button"
                onClick={onLogout}
                title="Sign out of workspace"
                className="p-2 sm:p-2.5 rounded-xl bg-rose-50 border border-rose-100/50 hover:bg-rose-100/60 hover:border-rose-200 text-rose-500 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Campus Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Academic Workspace. AttendEase Attendance System. All rights reserved.</p>
          <div className="flex items-center space-x-1.5 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-500">Service Node Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
