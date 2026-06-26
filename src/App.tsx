/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import StudentDashboard from './components/StudentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('attendease_theme') as 'light' | 'dark') || 'light';
  });

  // Sync theme with document class list
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('attendease_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auto-restore authorization token on reload
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('attendease_token');
      const storedUser = localStorage.getItem('attendease_user');

      if (storedToken && storedUser) {
        try {
          // Double check session vitality with back-end API
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const freshUser = await response.json();
            setToken(storedToken);
            setUser(freshUser);
            // Sync stored profile
            localStorage.setItem('attendease_user', JSON.stringify(freshUser));
          } else {
            // Token expired or invalid
            localStorage.removeItem('attendease_token');
            localStorage.removeItem('attendease_user');
          }
        } catch (err) {
          console.error('Session restoral connection exception:', err);
          // Network issue (allow offline local-storage fallback for smoother previews)
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      }
      setInitializing(false);
    }

    restoreSession();
  }, []);

  const handleLoginSuccess = (newToken: string, loggedInUser: User) => {
    setToken(newToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('attendease_token');
    localStorage.removeItem('attendease_user');
    setToken(null);
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-4 rounded-3xl shadow-xl text-white animate-bounce mb-5">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-4-9 4 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">AttendEase Systems</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Establishing secure campus channel connection...</p>
      </div>
    );
  }

  // Auth gate
  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <DashboardLayout user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme}>
      {user.role === 'student' && <StudentDashboard user={user} />}
      {user.role === 'faculty' && <FacultyDashboard user={user} />}
      {user.role === 'admin' && <AdminDashboard user={user} />}
    </DashboardLayout>
  );
}
