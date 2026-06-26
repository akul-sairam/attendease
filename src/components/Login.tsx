/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User as UserIcon, ArrowRight, Shield, BookOpen, AlertCircle, Sun, Moon } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Login({ onLoginSuccess, theme, onToggleTheme }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, customUsername?: string) => {
    if (e) e.preventDefault();
    const loginUser = customUsername || username;
    
    if (!loginUser.trim()) {
      setError('Please provide a valid username.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser.trim(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store in localStorage for session preservation
      localStorage.setItem('attendease_token', data.token);
      localStorage.setItem('attendease_user', JSON.stringify(data.user));
      
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Connecting to server failed.');
    } finally {
      isLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top right time & theme toggle bar */}
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        <span className="font-mono text-xs text-slate-400 hidden sm:inline">
          Local Time: 2026-06-23 02:02
        </span>
        <button
          id="login-theme"
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-3 rounded-2xl shadow-lg text-white">
            <GraduationCap className="w-8 h-8" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-850 bg-clip-text text-transparent">
            AttendEase
          </span>
        </div>
        <h2 className="mt-4 text-center text-sm font-medium text-slate-500">
          College Attendance Management System
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
          <form className="space-y-6" onSubmit={(e) => handleLogin(e)}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-rose-700 font-medium">{error}</span>
              </motion.div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Username / Email ID
              </label>
              <div className="mt-1.5 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="Enter your registration username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password Key
                </label>
              </div>
              <div className="mt-1.5 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verifying Identity...' : 'Sign In To Workspace'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>

          {/* Guidelines info */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
              System Guidelines
            </h4>
            <div className="text-xs text-slate-500 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl leading-relaxed">
              <p>
                🔑 Admin Credentials: Use username <span className="font-mono font-bold text-slate-800">admin</span> and password <span className="font-mono font-bold text-indigo-600">admin@123</span>.
              </p>
              <p>
                🎓 Log in as Administrator to register customized departments, courses, students, and faculty members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
